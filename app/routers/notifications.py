from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.journal import Journal
from app.services.email_service import send_welcome_email, send_daily_reminder, send_weekly_summary_email, send_otp_email
from app.services.ai_coach import weekly_summary
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/debug/config")
def debug_config(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check configuration"""
    return {
        "brevo_configured": bool(settings.BREVO_API_KEY),
        "brevo_key_preview": settings.BREVO_API_KEY[:10] + "..." if settings.BREVO_API_KEY else None,
        "whatsapp_configured": bool(settings.WHATSAPP_TOKEN and settings.WHATSAPP_PHONE_ID),
        "whatsapp_token_preview": settings.WHATSAPP_TOKEN[:10] + "..." if settings.WHATSAPP_TOKEN else None,
        "whatsapp_phone_id": settings.WHATSAPP_PHONE_ID,
        "mail_from": settings.MAIL_FROM,
        "environment": settings.ENVIRONMENT
    }


@router.post("/send-test-email")
async def send_test_email(current_user: User = Depends(get_current_user)):
    """Test endpoint to verify email is working"""
    try:
        await send_otp_email(
            to_email=current_user.email,
            username=current_user.username,
            otp="123456"
        )
        return {"message": "Test email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")


async def send_welcome_notifications(user: User):
    try:
        await send_welcome_email(to_email=user.email, username=user.username)
        logger.info(f"Welcome email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send welcome to {user.email}: {e}")


@router.post("/send-welcome")
async def send_welcome(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    background_tasks.add_task(send_welcome_notifications, current_user)
    return {"message": "Welcome email will be sent shortly"}


async def send_daily_reminder_task(user: User, db: Session):
    try:
        pending_tasks = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status != TaskStatus.completed
        ).all()
        task_titles = [t.title for t in pending_tasks]

        await send_daily_reminder(
            to_email=user.email,
            username=user.username,
            tasks=task_titles
        )
        logger.info(f"Daily reminder sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send daily reminder to {user.email}: {e}")


@router.post("/send-daily-reminder")
async def send_daily_reminder_endpoint(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    background_tasks.add_task(send_daily_reminder_task, current_user, db)
    return {"message": "Daily reminder will be sent shortly"}


async def send_weekly_summary_task(user: User, db: Session):
    try:
        completed = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status == TaskStatus.completed
        ).all()
        completed_str = ", ".join(
            [t.title for t in completed]) if completed else "No completed tasks"

        journals = db.query(Journal).filter(
            Journal.user_id == user.id
        ).order_by(Journal.entry_date.desc()).limit(7).all()

        journal_highlights = " | ".join([
            f"{j.entry_date}: {j.journal_text[:50] if j.journal_text else 'No text'}"
            for j in journals
        ]) if journals else "No entries"

        scores = [j.productivity_score for j in journals if j.productivity_score]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        summary = weekly_summary(
            username=user.username,
            completed_tasks=completed_str,
            archived_journals=journal_highlights,
            avg_score=avg_score
        )

        await send_weekly_summary_email(
            to_email=user.email,
            username=user.username,
            summary=summary,
            avg_score=avg_score,
            tasks_completed=len(completed)
        )
        logger.info(f"Weekly summary sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send weekly summary to {user.email}: {e}")


@router.post("/send-weekly-summary")
async def send_weekly_summary_endpoint(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    background_tasks.add_task(send_weekly_summary_task, current_user, db)
    return {"message": "Weekly summary will be sent shortly"}

# Add to app/routers/notifications.py


@router.post("/test-all-notifications")
async def test_all_notifications(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test all notification types for the current user"""
    background_tasks.add_task(send_welcome_notifications, current_user)
    background_tasks.add_task(send_daily_reminder_task, current_user, db)
    background_tasks.add_task(send_weekly_summary_task, current_user, db)

    return {
        "message": "Test notifications queued",
        "user_email": current_user.email,
        "user_phone": current_user.phone_number if current_user.phone_number else "Not set"
    }


@router.post("/test-whatsapp")
async def test_whatsapp(current_user: User = Depends(get_current_user)):
    """Test WhatsApp message for current user"""
    if not current_user.phone_number:
        raise HTTPException(
            status_code=400, detail="No phone number configured")

    try:
        from app.services.whatsapp_service import send_whatsapp_message
        await send_whatsapp_message(
            to_phone=current_user.phone_number,
            message=f"Hello {current_user.username}! This is a test message from BeProductive. Your notifications are working! 🎉"
        )
        return {"message": "WhatsApp test message sent", "phone": current_user.phone_number}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"WhatsApp test failed: {str(e)}")


@router.get("/scheduler-status")
def scheduler_status():
    """Check if scheduler is running"""
    from app.scheduler import scheduler
    return {
        "scheduler_running": scheduler.running,
        "jobs": [job.id for job in scheduler.get_jobs()]
    }
