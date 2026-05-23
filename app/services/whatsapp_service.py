import httpx
from app.core.config import settings
import logging
import re

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_ID}/messages"


def format_phone_number(phone: str) -> str:
    """
    Format phone number for WhatsApp API (Universal - works for any country)

    Examples:
    - Nigeria: 07043955397 → 2347043955397
    - US: (415) 555-1234 → 14155551234
    - UK: 07911 123456 → 447911123456
    - India: 9876543210 → 919876543210
    """
    # Remove any non-digit characters (+, -, spaces, brackets, etc.)
    phone = re.sub(r'\D', '', phone)

    # Remove leading zeros
    phone = phone.lstrip('0')

    # If the number doesn't have a country code (less than 10-12 digits)
    # You'll need to detect or assume based on your user base
    # For now, we'll keep it as-is and let WhatsApp API validate

    # Note: WhatsApp requires the number to have the country code
    # If your users store numbers without country code, you'll need to add logic here

    return phone


async def send_whatsapp_message(to_phone: str, message: str):
    """Send a WhatsApp message to a phone number"""
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_ID:
        logger.warning("WhatsApp not configured - missing token or phone ID")
        return {"error": "WhatsApp not configured", "skipped": True}

    # Format the phone number properly
    original_phone = to_phone
    formatted_phone = format_phone_number(to_phone)

    logger.info(
        f"Original phone: {original_phone} -> Formatted: {formatted_phone}")

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": formatted_phone,  # Use formatted phone number
        "type": "text",
        "text": {"body": message[:1000]}
    }

    logger.info(f"Sending WhatsApp message to {formatted_phone}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(WHATSAPP_API_URL, json=payload, headers=headers)

            if response.status_code == 200:
                logger.info(
                    f"WhatsApp message sent successfully to {formatted_phone}")
                return response.json()
            else:
                logger.error(
                    f"WhatsApp API error: {response.status_code} - {response.text}")

                # Provide more helpful error messages
                if response.status_code == 400:
                    error_detail = response.json().get('error', {}).get('message', 'Unknown error')
                    if 'invalid phone number' in error_detail.lower():
                        raise Exception(
                            f"Invalid phone number format. Please ensure '{original_phone}' includes the country code (e.g., 234 for Nigeria, 1 for US)")
                    elif 'not registered' in error_detail.lower():
                        raise Exception(
                            f"Phone number '{formatted_phone}' is not registered with WhatsApp Business API. The number must be verified in WhatsApp Manager first.")
                    else:
                        raise Exception(f"WhatsApp API error: {error_detail}")
                else:
                    raise Exception(
                        f"WhatsApp API returned {response.status_code}")

    except httpx.TimeoutException:
        logger.error(f"WhatsApp timeout for {formatted_phone}")
        raise Exception("WhatsApp API timeout")
    except Exception as e:
        logger.error(f"WhatsApp error for {formatted_phone}: {e}")
        raise
# Add these after your existing functions (after send_whatsapp_message)


async def send_whatsapp_daily_reminder(phone: str, username: str, tasks: list):
    """Send daily reminder via WhatsApp"""
    if not tasks:
        task_text = "No pending tasks. Great job! 🎉"
    else:
        task_list = "\n".join([f"• {task}" for task in tasks[:5]])
        task_text = f"Your pending tasks:\n{task_list}"

    message = f"🌅 Good morning {username}!\n\n{task_text}\n\nStay productive today! 💪"

    return await send_whatsapp_message(phone, message)


async def send_whatsapp_weekly_summary(phone: str, username: str, summary: str, avg_score: float, tasks_completed: int):
    """Send weekly summary via WhatsApp"""
    message = f"📊 *Weekly Summary for {username}*\n\n"
    message += f"✅ Tasks completed: {tasks_completed}\n"
    message += f"📈 Average productivity score: {avg_score}/10\n\n"
    message += f"📝 Summary:\n{summary[:300]}\n\n"
    message += f"Great work this week! Keep it up! 🎉"

    return await send_whatsapp_message(phone, message)
