from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.journal import Journal
from app.services.email_service import send_welcome_email, send_daily_reminder, send_weekly_summary_email
from app.services.whatsapp_service import send_whatsapp_welcome, send_whatsapp_daily_reminder, send_whatsapp_weekly_summary
from app.services.ai_coach import weekly_summary

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/send-welcome")
async def send_welcome(current_user: User = Depends(get_current_user)):
    try:
        await send_welcome_email(to_email=current_user.email, username=current_user.username)
        if current_user.phone_number:
            await send_whatsapp_welcome(phone=current_user.phone_number, username=current_user.username)
        return {"message": "Welcome notifications sent", "whatsapp": bool(current_user.phone_number)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-daily-reminder")
async def send_daily_reminder_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        pending_tasks = db.query(Task).filter(
            Task.user_id == current_user.id, Task.status != TaskStatus.completed).all()
        task_titles = [t.title for t in pending_tasks]
        await send_daily_reminder(to_email=current_user.email, username=current_user.username, tasks=task_titles)
        if current_user.phone_number:
            await send_whatsapp_daily_reminder(phone=current_user.phone_number, username=current_user.username, tasks=task_titles)
        return {"message": "Daily reminder sent", "tasks_count": len(task_titles), "whatsapp": bool(current_user.phone_number)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-weekly-summary")
async def send_weekly_summary_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        completed = db.query(Task).filter(
            Task.user_id == current_user.id, Task.status == TaskStatus.completed).all()
        completed_str = ", ".join(
            [t.title for t in completed]) if completed else "No completed tasks"
        journals = db.query(Journal).filter(Journal.user_id == current_user.id).order_by(
            Journal.entry_date.desc()).limit(7).all()
        journal_highlights = " | ".join(
            [f"{j.entry_date}: {j.journal_text[:50] if j.journal_text else 'No text'}" for j in journals]) if journals else "No entries"
        scores = [j.productivity_score for j in journals if j.productivity_score]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        summary = weekly_summary(username=current_user.username, completed_tasks=completed_str,
                                 archived_journals=journal_highlights, avg_score=avg_score)
        await send_weekly_summary_email(to_email=current_user.email, username=current_user.username, summary=summary, avg_score=avg_score, tasks_completed=len(completed))
        if current_user.phone_number:
            await send_whatsapp_weekly_summary(phone=current_user.phone_number, username=current_user.username, summary=summary, avg_score=avg_score, tasks_completed=len(completed))
        return {"message": "Weekly summary sent", "whatsapp": bool(current_user.phone_number)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
