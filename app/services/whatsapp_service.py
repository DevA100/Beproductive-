import httpx
from app.core.config import settings

WHATSAPP_API_URL = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_ID}/messages"


async def send_whatsapp_message(to_phone: str, message: str):
    """Send a WhatsApp message to a phone number"""
    # Phone must be in international format e.g. 2348012345678
    phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(WHATSAPP_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()


async def send_whatsapp_welcome(phone: str, username: str):
    message = f"""👋 Welcome to BeProductive, {username}!

⚡ Your AI-powered productivity coach is ready.

Here's what I'll do for you:
✅ Send your daily tasks every morning
📊 Weekly performance summaries
📅 Monday plan reminders
🤖 AI coaching on demand

Let's make every week count! 💪"""
    await send_whatsapp_message(phone, message)


async def send_whatsapp_daily_reminder(phone: str, username: str, tasks: list):
    task_list = "\n".join(
        [f"  • {t}" for t in tasks]) if tasks else "  • No tasks yet!"
    message = f"""☀️ Good morning, {username}!

Your tasks for today:

{task_list}

💡 Start with your hardest task first!

Have a productive day! ⚡ BeProductive"""
    await send_whatsapp_message(phone, message)


async def send_whatsapp_weekly_summary(phone: str, username: str, summary: str, avg_score: float, tasks_completed: int):
    message = f"""📊 Weekly Summary — {username}

✅ Tasks Completed: {tasks_completed}
⭐ Avg Productivity Score: {avg_score}/10

🤖 AI Coach Says:
{summary[:500]}...

Ready for a new week? Create your plan! 💪 BeProductive"""
    await send_whatsapp_message(phone, message)
