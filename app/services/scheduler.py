from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date, timedelta  # Added timedelta here
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.weekly_plan import WeeklyPlan, PlanStatus
from app.models.journal import Journal
from app.services.email_service import send_daily_reminder, send_weekly_summary_email, send_email
from app.services.ai_coach import weekly_summary
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def send_morning_reminders():
    """Send morning reminders to all active users"""
    logger.info("Running morning reminder job...")
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        logger.info(f"Found {len(users)} active users")

        for user in users:
            try:
                pending_tasks = db.query(Task).filter(
                    Task.user_id == user.id,
                    Task.status != TaskStatus.completed
                ).limit(5).all()
                task_titles = [t.title for t in pending_tasks]

                # Send email reminder
                await send_daily_reminder(
                    to_email=user.email,
                    username=user.username,
                    tasks=task_titles
                )
                logger.info(f"Morning email reminder sent to {user.email}")

                # Send WhatsApp reminder if phone number exists
                if user.phone_number and user.phone_number.strip():
                    try:
                        from app.services.whatsapp_service import send_whatsapp_daily_reminder
                        await send_whatsapp_daily_reminder(
                            phone=user.phone_number,
                            username=user.username,
                            tasks=task_titles
                        )
                        logger.info(
                            f"WhatsApp reminder sent to {user.phone_number}")
                    except Exception as e:
                        logger.error(
                            f"Failed to send WhatsApp to {user.phone_number}: {e}")

            except Exception as e:
                logger.error(f"Failed to send reminder to {user.email}: {e}")
    except Exception as e:
        logger.error(f"Error in morning reminders: {e}")
    finally:
        db.close()


async def weekly_archive_and_summary():
    """Archive active plans and send weekly summaries"""
    logger.info("Running weekly archive job...")
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        logger.info(f"Found {len(users)} active users for weekly summary")

        for user in users:
            try:
                # Archive active plan
                active_plan = db.query(WeeklyPlan).filter(
                    WeeklyPlan.user_id == user.id,
                    WeeklyPlan.status == PlanStatus.active
                ).first()
                if active_plan:
                    active_plan.status = PlanStatus.archived
                    db.commit()
                    logger.info(f"Archived plan for {user.email}")

                # Get completed tasks
                completed = db.query(Task).filter(
                    Task.user_id == user.id,
                    Task.status == TaskStatus.completed
                ).all()
                completed_str = ", ".join(
                    [t.title for t in completed]) if completed else "No completed tasks"

                # Get journals
                journals = db.query(Journal).filter(
                    Journal.user_id == user.id
                ).order_by(Journal.entry_date.desc()).limit(7).all()

                journal_highlights = " | ".join([
                    f"{j.entry_date}: {j.journal_text[:50] if j.journal_text else 'No text'}"
                    for j in journals
                ]) if journals else "No journal entries"

                # Calculate average score
                scores = [
                    j.productivity_score for j in journals if j.productivity_score]
                avg_score = round(sum(scores) / len(scores),
                                  1) if scores else 0

                # Generate AI summary
                summary = weekly_summary(
                    username=user.username,
                    completed_tasks=completed_str,
                    archived_journals=journal_highlights,
                    avg_score=avg_score
                )

                # Send email summary
                await send_weekly_summary_email(
                    to_email=user.email,
                    username=user.username,
                    summary=summary,
                    avg_score=avg_score,
                    tasks_completed=len(completed)
                )
                logger.info(f"Weekly email summary sent to {user.email}")

                # Send WhatsApp summary if phone exists
                if user.phone_number and user.phone_number.strip():
                    try:
                        from app.services.whatsapp_service import send_whatsapp_weekly_summary
                        await send_whatsapp_weekly_summary(
                            phone=user.phone_number,
                            username=user.username,
                            summary=summary,
                            avg_score=avg_score,
                            tasks_completed=len(completed)
                        )
                        logger.info(
                            f"WhatsApp summary sent to {user.phone_number}")
                    except Exception as e:
                        logger.error(
                            f"Failed to send WhatsApp summary to {user.phone_number}: {e}")

            except Exception as e:
                logger.error(f"Failed weekly job for {user.email}: {e}")
    except Exception as e:
        logger.error(f"Error in weekly archive: {e}")
    finally:
        db.close()


async def monday_new_plan_reminder():
    """Send reminders to users who haven't created a plan for the week"""
    logger.info("Running Monday new plan reminder...")
    db = SessionLocal()
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        users = db.query(User).filter(User.is_active == True).all()
        logger.info(f"Found {len(users)} active users for Monday reminder")

        for user in users:
            try:
                existing_plan = db.query(WeeklyPlan).filter(
                    WeeklyPlan.user_id == user.id,
                    WeeklyPlan.week_start == week_start
                ).first()

                if not existing_plan:
                    # Send email reminder
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
                    logger.info(f"Monday email reminder sent to {user.email}")

                    # Send WhatsApp reminder if phone exists
                    if user.phone_number and user.phone_number.strip():
                        try:
                            from app.services.whatsapp_service import send_whatsapp_message
                            await send_whatsapp_message(
                                to_phone=user.phone_number,
                                message=f"Hey {user.username}! A new week has started. Don't forget to create your weekly plan on BeProductive!"
                            )
                            logger.info(
                                f"Monday WhatsApp reminder sent to {user.phone_number}")
                        except Exception as e:
                            logger.error(
                                f"Failed to send Monday WhatsApp to {user.phone_number}: {e}")

            except Exception as e:
                logger.error(f"Failed Monday reminder for {user.email}: {e}")
    except Exception as e:
        logger.error(f"Error in Monday reminder: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start the scheduler with all jobs"""
    try:
        # Clear existing jobs
        scheduler.remove_all_jobs()

        # Add morning reminders at 7 AM daily
        scheduler.add_job(
            send_morning_reminders,
            CronTrigger(hour=7, minute=0),
            id="morning_reminders",
            replace_existing=True
        )
        logger.info("Added morning reminders job at 7:00 AM")

        # Add weekly archive and summary on Sunday at 9 PM
        scheduler.add_job(
            weekly_archive_and_summary,
            CronTrigger(day_of_week="sun", hour=21, minute=0),
            id="weekly_archive",
            replace_existing=True
        )
        logger.info("Added weekly archive job on Sunday at 9:00 PM")

        # Add Monday reminder at 8 AM
        scheduler.add_job(
            monday_new_plan_reminder,
            CronTrigger(day_of_week="mon", hour=8, minute=0),
            id="monday_reminder",
            replace_existing=True
        )
        logger.info("Added Monday reminder job at 8:00 AM")

        # Start the scheduler
        scheduler.start()
        logger.info("✅ Scheduler started successfully - all jobs registered!")
        print("Scheduler started - jobs registered!")

    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        print(f"❌ Scheduler failed to start: {e}")


def stop_scheduler():
    """Stop the scheduler gracefully"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
