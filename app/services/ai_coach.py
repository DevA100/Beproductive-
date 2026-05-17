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
        max_tokens=1000,
        temperature=0.7
    )
    return response.choices[0].message.content


def generate_weekly_plan(username: str, goals: str) -> str:
    system_prompt = """You are an expert productivity coach called BeProductive AI.
    Your job is to help users plan their week effectively.
    Always be encouraging, specific, and realistic.
    Structure your responses clearly with bullet points."""

    user_message = f"""
    User: {username}
    Their goals for this week: {goals}

    Please generate a structured weekly plan with:
    1. A brief motivational opening
    2. 3-5 specific tasks they should focus on this week
    3. Daily action suggestions (Monday to Friday)
    4. One key focus tip for the week
    Keep it concise and actionable.
    """
    return get_ai_response(system_prompt, user_message)


def analyze_daily_progress(username: str, completed_tasks: str, journal_text: str, productivity_score: float) -> str:
    system_prompt = """You are BeProductive AI, a supportive productivity coach.
    Analyze the user's daily progress and provide constructive feedback.
    Be encouraging but honest. Keep feedback under 150 words."""

    user_message = f"""
    User: {username}
    Productivity score today: {productivity_score}/10
    Completed tasks: {completed_tasks}
    Journal entry: {journal_text}

    Please provide:
    1. A brief analysis of their day
    2. One thing they did well
    3. One suggestion for tomorrow
    """
    return get_ai_response(system_prompt, user_message)


def suggest_next_actions(username: str, pending_tasks: str, todays_journal: str) -> str:
    system_prompt = """You are BeProductive AI. Based on the user's pending tasks
    and how their day is going, suggest the top 3 actions they should take next.
    Be specific and prioritize by impact. Keep it under 100 words."""

    user_message = f"""
    User: {username}
    Pending tasks: {pending_tasks}
    How today is going: {todays_journal}

    What are the top 3 actions they should take next?
    """
    return get_ai_response(system_prompt, user_message)


def weekly_summary(username: str, completed_tasks: str, archived_journals: str, avg_score: float) -> str:
    system_prompt = """You are BeProductive AI. Generate an insightful weekly summary
    for the user. Celebrate wins, identify patterns, and set the tone for next week.
    Keep it under 200 words."""

    user_message = f"""
    User: {username}
    Average productivity score: {avg_score}/10
    Tasks completed this week: {completed_tasks}
    Journal highlights: {archived_journals}

    Please generate:
    1. Weekly wins celebration
    2. Key patterns you noticed
    3. Top recommendation for next week
    """
    return get_ai_response(system_prompt, user_message)
