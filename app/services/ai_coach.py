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
    system_prompt = """You are BeProductive AI, an expert productivity coach.
    Generate a clean, structured weekly plan WITHOUT any markdown formatting.
    Do NOT use any emojis, asterisks, hashtags, or special characters for formatting.
    Use plain text with line breaks only.
    
    Format your response exactly like this example:

    Weekly Goal: Complete the project proposal by Friday

    Top 5 Tasks for the Week:
    1. Research competitors - Gather data on top 5 competitors
    2. Draft proposal outline - Create structure for the proposal
    3. Write executive summary - Summarize key points
    4. Create budget section - Calculate costs and resources
    5. Review and edit - Proofread and finalize

    Daily Breakdown:
    Monday: Research and data collection
    Tuesday: Draft initial proposal
    Wednesday: Write executive summary and budget
    Thursday: Review and revisions
    Friday: Final submission
    Saturday: Rest and planning
    Sunday: Prepare for next week

    Focus Tip: Start each day with your most challenging task to build momentum

    Recommended Reading:
    1. How to Be Productive - Time management strategies (URL: https://example.com/productivity)
    2. Goal Setting Framework - Achieve your weekly goals (URL: https://example.com/goals)
    3. Deep Work Techniques - Focus better (URL: https://example.com/deep-work)

    Remember: No markdown, no emojis, no special formatting characters."""

    user_message = f"""
    User: {username}
    Goals this week: {goals}

    Generate a weekly plan following the exact format above. No markdown, no emojis.
    """

    return get_ai_response(system_prompt, user_message)


def analyze_daily_progress(username: str, completed_tasks: str, journal_text: str, productivity_score: float) -> str:
    system_prompt = """You are BeProductive AI, a supportive productivity coach.
    Provide clean, plain text feedback without any markdown formatting.
    Do NOT use emojis, asterisks, or hashtags.
    Keep feedback under 150 words.
    
    Format your response in three clear paragraphs:
    First paragraph: Brief analysis of their day
    Second paragraph: One thing they did well
    Third paragraph: One suggestion for tomorrow"""

    user_message = f"""
    User: {username}
    Productivity score today: {productivity_score}/10
    Completed tasks: {completed_tasks}
    Journal entry: {journal_text}

    Provide feedback in plain text with no markdown or emojis.
    """
    return get_ai_response(system_prompt, user_message)


def suggest_next_actions(username: str, pending_tasks: str, todays_journal: str) -> str:
    system_prompt = """You are BeProductive AI. Based on the user's pending tasks
    and how their day is going, suggest the top 3 actions they should take next.
    Use plain text with numbers (1., 2., 3.) only. No markdown formatting, no emojis.
    
    Format like this:
    1. First action suggestion
    2. Second action suggestion
    3. Third action suggestion"""

    user_message = f"""
    User: {username}
    Pending tasks: {pending_tasks}
    How today is going: {todays_journal}

    What are the top 3 actions they should take next?
    Format as plain text with numbers only. No markdown or emojis.
    """
    return get_ai_response(system_prompt, user_message)


def weekly_summary(username: str, completed_tasks: str, archived_journals: str, avg_score: float) -> str:
    system_prompt = """You are BeProductive AI. Generate an insightful weekly summary
    for the user. Use plain text only, no markdown formatting.
    Do NOT use emojis, asterisks, or hashtags.
    Keep it under 200 words.
    
    Structure your response as:
    Paragraph 1: Celebrate their wins for the week
    Paragraph 2: Key patterns you noticed in their productivity
    Paragraph 3: Top recommendation for next week"""

    user_message = f"""
    User: {username}
    Average productivity score: {avg_score}/10
    Tasks completed this week: {completed_tasks}
    Journal highlights: {archived_journals}

    Generate a weekly summary in plain text with no markdown or emojis.
    """
    return get_ai_response(system_prompt, user_message)
