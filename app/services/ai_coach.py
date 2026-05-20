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
    system_prompt = """You are BeProductive AI.
Generate a weekly plan in PURE PLAIN TEXT.
ABSOLUTELY NO markdown, NO asterisks, NO hashtags, NO bold, NO italic.
Use ONLY numbers, letters, spaces, and dashes.

Format exactly like this:

Weekly Goal: One sentence summary of the week's focus

Top 5 Tasks for the Week:
1. Task Name - Brief description
2. Task Name - Brief description
3. Task Name - Brief description
4. Task Name - Brief description
5. Task Name - Brief description

Daily Breakdown:
Monday: Main task description
Tuesday: Main task description
Wednesday: Main task description
Thursday: Main task description
Friday: Main task description
Saturday: Main task description
Sunday: Rest and planning

Focus Tip: One actionable tip

No markdown. No special characters."""

    user_message = f"""
User: {username}
Goals this week: {goals}

Generate a weekly plan following the exact format above. Use plain text only.
"""

    return get_ai_response(system_prompt, user_message)


def weekly_summary(username: str, completed_tasks: str, archived_journals: str, avg_score: float) -> str:
    system_prompt = """You are BeProductive AI. Generate an insightful weekly summary
    for the user. Use plain text only, no markdown formatting.
    Keep it under 200 words."""

    user_message = f"""
    User: {username}
    Average productivity score: {avg_score}/10
    Tasks completed this week: {completed_tasks}
    Journal highlights: {archived_journals}
    
    Generate a weekly summary in plain text.
    """
    return get_ai_response(system_prompt, user_message)
