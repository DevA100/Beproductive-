from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.weekly_plan import WeeklyPlan, PlanStatus
from app.models.journal import Journal
from app.services.email_service import send_daily_reminder, send_weekly_summary_email, send_email
from app.services.ai_coach import weekly_summary
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def send_morning_reminders():
    logger.info("Running morning reminder job...")
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        for user in users:
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

                if user.phone_number:
                    from app.services.whatsapp_service import send_whatsapp_daily_reminder
                    await send_whatsapp_daily_reminder(
                        phone=user.phone_number,
                        username=user.username,
                        tasks=task_titles
                    )

                logger.info(f"Morning reminder sent to {user.email}")
            except Exception as e:
                logger.error(f"Failed to send reminder to {user.email}: {e}")
    finally:
        db.close()


async def weekly_archive_and_summary():
    logger.info("Running weekly archive job...")
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        for user in users:
            try:
                active_plan = db.query(WeeklyPlan).filter(
                    WeeklyPlan.user_id == user.id,
                    WeeklyPlan.status == PlanStatus.active
                ).first()
                if active_plan:
                    active_plan.status = PlanStatus.archived
                    db.commit()

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
                ]) if journals else "No journal entries"

                scores = [
                    j.productivity_score for j in journals if j.productivity_score]
                avg_score = round(sum(scores) / len(scores),
                                  1) if scores else 0

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

                if user.phone_number:
                    from app.services.whatsapp_service import send_whatsapp_weekly_summary
                    await send_whatsapp_weekly_summary(
                        phone=user.phone_number,
                        username=user.username,
                        summary=summary,
                        avg_score=avg_score,
                        tasks_completed=len(completed)
                    )

                logger.info(f"Weekly summary sent to {user.email}")
            except Exception as e:
                logger.error(f"Failed weekly job for {user.email}: {e}")
    finally:
        db.close()


async def monday_new_plan_reminder():
    logger.info("Running Monday new plan reminder...")
    db = SessionLocal()
    try:
        today = date.today()
        users = db.query(User).filter(User.is_active == True).all()
        for user in users:
            try:
                existing_plan = db.query(WeeklyPlan).filter(
                    WeeklyPlan.user_id == user.id,
                    WeeklyPlan.week_start == today
                ).first()

                if not existing_plan:
                    await send_email(
                        to_email=user.email,
                        subject="Start your week strong - Create your weekly plan",
                        body=f"""
Hey {user.username}!

A new week has started and you haven't created your weekly plan yet.

Here's what to do:
1. Log in to BeProductive
2. Go to Weekly Planner and create your plan
3. Add your tasks for the week
4. Let the AI coach generate suggestions

Don't let Monday slip away - plan it now!

Your BeProductive AI Coach
                        """
                    )

                    if user.phone_number:
                        from app.services.whatsapp_service import send_whatsapp_message
                        await send_whatsapp_message(
                            to_phone=user.phone_number,
                            message=f"Hey {user.username}! A new week has started. Don't forget to create your weekly plan on BeProductive!"
                        )

                    logger.info(f"Monday reminder sent to {user.email}")
            except Exception as e:
                logger.error(f"Failed Monday reminder for {user.email}: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        send_morning_reminders,
        CronTrigger(hour=7, minute=0),
        id="morning_reminders",
        replace_existing=True
    )

    scheduler.add_job(
        weekly_archive_and_summary,
        CronTrigger(day_of_week="sun", hour=21, minute=0),
        id="weekly_archive",
        replace_existing=True
    )

    scheduler.add_job(
        monday_new_plan_reminder,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="monday_reminder",
        replace_existing=True
    )

    scheduler.start()
    print("Scheduler started - jobs registered!")
