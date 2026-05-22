import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_ID}/messages"


async def send_whatsapp_message(to_phone: str, message: str):
    """Send a WhatsApp message to a phone number"""
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        logger.warning("WhatsApp not configured - missing token or phone ID")
        return {"error": "WhatsApp not configured"}

    # Clean phone number
    phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")

    # Ensure phone number has country code
    if not phone.startswith("234") and not phone.startswith("1") and not phone.startswith("44"):
        logger.warning(
            f"Phone number {phone} may not have correct country code")

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message[:1000]}  # WhatsApp message limit
    }

    logger.info(f"Sending WhatsApp message to {phone}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(WHATSAPP_API_URL, json=payload, headers=headers)

            if response.status_code == 200:
                logger.info(f"WhatsApp message sent successfully to {phone}")
                return response.json()
            else:
                logger.error(
                    f"WhatsApp API error: {response.status_code} - {response.text}")
                raise Exception(
                    f"WhatsApp API returned {response.status_code}")

    except httpx.TimeoutException:
        logger.error(f"WhatsApp timeout for {phone}")
        raise Exception("WhatsApp API timeout")
    except Exception as e:
        logger.error(f"WhatsApp error for {phone}: {e}")
        raise


async def send_whatsapp_welcome(phone: str, username: str):
    """Send welcome message via WhatsApp"""
    message = f"""🎉 Welcome to BeProductive, {username}! 🎉

Your AI-powered productivity coach is ready.

Here's what I'll do for you:
✅ Send your daily tasks every morning
✅ Weekly performance summaries  
✅ Monday plan reminders
✅ AI coaching on demand

Let's make every week count! 💪

Reply HELP for support or STOP to unsubscribe."""

    await send_whatsapp_message(phone, message)


async def send_whatsapp_daily_reminder(phone: str, username: str, tasks: list):
    """Send daily task reminder via WhatsApp"""
    if not tasks:
        task_list = "✨ No pending tasks! Great job!"
    else:
        task_list = "\n".join([f"  📌 {t}" for t in tasks[:5]])
        if len(tasks) > 5:
            task_list += f"\n  ... and {len(tasks) - 5} more"

    message = f"""🌅 Good morning, {username}!

Your tasks for today:

{task_list}

💡 Tip: Start with your hardest task first - eat that frog! 🐸

Have a productive day! 🚀

BeProductive AI Coach"""

    await send_whatsapp_message(phone, message)


async def send_whatsapp_weekly_summary(phone: str, username: str, summary: str, avg_score: float, tasks_completed: int):
    """Send weekly summary via WhatsApp"""
    message = f"""📊 Weekly Summary - {username}

✅ Tasks Completed: {tasks_completed}
⭐ Avg Productivity Score: {avg_score}/10

🤖 AI Coach Says:
{summary[:400]}...

🎯 Ready for a new week? Create your plan!

BeProductive - Your AI Productivity Coach"""

    await send_whatsapp_message(phone, message)


async def send_whatsapp_otp(phone: str, otp: str):
    """Send OTP via WhatsApp for verification"""
    message = f"""🔐 Your BeProductive verification code is: {otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this message.

BeProductive AI Coach"""

    await send_whatsapp_message(phone, message)
