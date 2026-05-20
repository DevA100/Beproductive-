import brevo_python as brevo
from brevo_python.rest import ApiException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure Brevo
configuration = brevo.Configuration()
configuration.api_key['api-key'] = settings.BREVO_API_KEY
api_instance = brevo.TransactionalEmailsApi(brevo.ApiClient(configuration))


async def send_email(to_email: str, subject: str, body: str):
    """Send email using Brevo API (bypasses Render SMTP block)"""
    try:
        logger.info(f"Attempting to send email to {to_email} via Brevo")

        # Create the email content
        sender = {"email": settings.MAIL_FROM, "name": "BeProductive"}
        to = [{"email": to_email}]

        # HTML version with styling
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <div style="background: #3b82f6; padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">BeProductive</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
              <div style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; color: #333;">{body}</div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Sent by BeProductive - Your personal productivity coach</p>
            </div>
          </body>
        </html>
        """

        # Create the email request
        send_smtp_email = brevo.SendSmtpEmail(
            to=to,
            sender=sender,
            subject=subject,
            text_content=body,
            html_content=html_body
        )

        # Send the email
        response = api_instance.send_transac_email(send_smtp_email)
        logger.info(
            f"Email sent successfully to {to_email}, message_id: {response.message_id}")
        return True

    except ApiException as e:
        logger.error(f"Brevo API error sending to {to_email}: {e}")
        raise Exception(f"Failed to send email: {e}")
    except Exception as e:
        logger.error(f"Unexpected error sending to {to_email}: {str(e)}")
        raise e


async def send_welcome_email(to_email: str, username: str):
    subject = "Welcome to BeProductive"
    body = f"""
Hey {username}!

Welcome to BeProductive - your AI-powered productivity coach!

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
    subject = "Good Morning - Your tasks for today"
    task_list = "\n".join(
        [f"  - {t}" for t in tasks]) if tasks else "  - No tasks yet - create your plan!"
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


async def send_otp_email(to_email: str, username: str, otp: str):
    subject = "Your Password Reset OTP - BeProductive"
    body = f"""
Hey {username}!

You requested a password reset for your BeProductive account.

Your OTP Code: {otp}

This code expires in 10 minutes.

If you didn't request this, ignore this email.

Your BeProductive Team
    """
    await send_email(to_email, subject, body)
