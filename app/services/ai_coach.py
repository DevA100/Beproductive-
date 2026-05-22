from groq import Groq
from app.core.config import settings
import json

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

IMPORTANT: Return ONLY the plan as plain text. Do NOT add any extra text.

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

RECOMMENDED ARTICLES:
1. [Article Title] - [Brief description] - [URL]
2. [Article Title] - [Brief description] - [URL]
3. [Article Title] - [Brief description] - [URL]

Keep it simple. Use real, relevant URLs from reputable sources."""

    user_message = f"User: {username}\nGoals: {goals}\n\nCreate weekly plan with article recommendations."
    return get_ai_response(system_prompt, user_message)


def suggest_articles(goals: str, task_titles: list = None) -> list:
    """Generate article recommendations based on user's goals and tasks"""
    system_prompt = """You are BeProductive AI. Recommend relevant articles for personal/professional development.

Return ONLY a JSON array of articles with this exact format:
[
    {
        "title": "Article Title",
        "description": "Brief 1-2 sentence description",
        "url": "https://full-url.com/article",
        "source": "Source Name (e.g., Medium, HBR, Forbes)"
    }
]

Requirements:
- 3-5 high-quality articles
- Real, working URLs from reputable sources
- Relevant to the user's goals

Return ONLY the JSON array, no other text."""

    user_message = f"User's goals: {goals}\n"
    if task_titles:
        user_message += f"Related tasks: {', '.join(task_titles[:5])}\n"
    user_message += "\nRecommend 3-5 relevant articles."

    try:
        response = get_ai_response(system_prompt, user_message)
        articles = json.loads(response)
        return articles if isinstance(articles, list) else []
    except:
        return []


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
