import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, body: str):
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"BeProductive AI <{settings.MAIL_FROM}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Plain text version
        text_part = MIMEText(body, "plain")
        message.attach(text_part)

        # HTML version
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">BeProductive</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; color: #333;">{body}</div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Sent by BeProductive — Your personal productivity coach</p>
            </div>
          </body>
        </html>
        """

        html_part = MIMEText(html_body, "html")
        message.attach(html_part)

        # Try sending with STARTTLS on port 587 instead of 465
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            username=settings.MAIL_USERNAME,
            password=settings.MAIL_PASSWORD,
            use_tls=False,  # STARTTLS
            start_tls=True
        )

        logger.info(f"Email sent successfully to {to_email}")

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise e


async def send_welcome_email(to_email: str, username: str):
    subject = "Welcome to BeProductive!"
    body = f"""
Hey {username}!

Welcome to BeProductive — your AI-powered productivity coach!

Here's what you can do:
- Create your weekly plan
- Add and track tasks
- Write daily journal entries
- Get AI coaching and feedback
- Review your weekly performance

Let's make this week your most productive yet!

Your BeProductive AI Coach
    """
    await send_email(to_email, subject, body)


async def send_daily_reminder(to_email: str, username: str, tasks: list):
    subject = "Good Morning! Your tasks for today"
    task_list = "\n".join(
        [f"  - {t}" for t in tasks]) if tasks else "  - No tasks yet — create your plan!"
    body = f"""
Good morning, {username}!

Here are your tasks for today:

{task_list}

Tip: Start with your hardest task first!

Have a productive day!
Your BeProductive AI Coach
    """
    await send_email(to_email, subject, body)


async def send_weekly_summary_email(to_email: str, username: str, summary: str, avg_score: float, tasks_completed: int):
    subject = "Your Weekly Performance Summary"
    body = f"""
Hey {username}! 

Here's your weekly performance summary:

Average Productivity Score: {avg_score}/10
Tasks Completed: {tasks_completed}

AI Coach Feedback:
{summary}

Ready for another great week? Create your new plan now!

Your BeProductive AI Coach
    """
    await send_email(to_email, subject, body)
