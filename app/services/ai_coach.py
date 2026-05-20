from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)


def get_ai_response(system_prompt: str, user_message: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        max_tokens=1500,
        temperature=0.7
    )
    return response.choices[0].message.content


def generate_weekly_plan(username: str, goals: str) -> str:
    system_prompt = """You are BeProductive AI. Create a weekly plan.

IMPORTANT: Return ONLY the tasks as a JSON-like list. Do NOT add any extra text.

Format your response EXACTLY like this:

WEEKLY GOAL: [one sentence goal]

TASKS:
1. [Task title] - [description]
2. [Task title] - [description]
3. [Task title] - [description]
4. [Task title] - [description]
5. [Task title] - [description]

DAILY BREAKDOWN:
Monday: [task]
Tuesday: [task]
Wednesday: [task]
Thursday: [task]
Friday: [task]

FOCUS TIP: [one tip]

Keep it simple. No markdown. No bold. No italic."""

    user_message = f"User: {username}\nGoals: {goals}\n\nCreate weekly plan."
    return get_ai_response(system_prompt, user_message)


def weekly_summary(username: str, completed_tasks: str, archived_journals: str, avg_score: float) -> str:
    system_prompt = """You are BeProductive AI. Generate a weekly summary.
    Use plain text only. Keep it under 200 words."""

    user_message = f"""
    User: {username}
    Average productivity score: {avg_score}/10
    Tasks completed: {completed_tasks}
    Journal: {archived_journals}
    
    Generate weekly summary.
    """
    return get_ai_response(system_prompt, user_message)
