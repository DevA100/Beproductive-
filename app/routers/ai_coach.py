import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.journal import Journal
from app.services.ai_coach import (
    generate_weekly_plan,
    analyze_daily_progress,
    suggest_next_actions,
    weekly_summary
)
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/ai-coach", tags=["AI Coach"])


class GoalsInput(BaseModel):
    goals: str


class DailyCheckIn(BaseModel):
    journal_text: Optional[str] = "No journal entry yet"
    productivity_score: Optional[float] = 5.0


class NextActionInput(BaseModel):
    todays_journal: Optional[str] = "Day is going okay"


@router.post("/generate-weekly-plan")
def ai_generate_weekly_plan(
    input: GoalsInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        plan = generate_weekly_plan(
            username=current_user.username, goals=input.goals)

        # Extract tasks from the AI response (clean version without emojis)
        tasks = []

        # Look for "Top 5 Tasks" section
        task_section = re.search(
            r'Top 5 Tasks for the Week[\s-]*\n(.*?)(?=\n\n|\nDaily Breakdown|\nFocus Tip|$)',
            plan,
            re.DOTALL | re.IGNORECASE
        )

        if task_section:
            task_lines = task_section.group(1).split('\n')
            for line in task_lines:
                # Match patterns like "1. Task Name - Description" or "1. Task Name"
                match = re.match(
                    r'^\s*\d+\.\s+(.+?)(?:\s*-\s*(.+))?$', line.strip())
                if match:
                    title = match.group(1).strip()
                    description = match.group(
                        2).strip() if match.group(2) else ""
                    tasks.append({
                        "title": title[:100],
                        "description": description[:200]
                    })

        # Extract goal summary
        goal_match = re.search(
            r'Weekly Goal[\s-]*:?\s*(.+?)(?=\n\n|\nTop 5|\n$)',
            plan,
            re.DOTALL | re.IGNORECASE
        )
        goal_summary = goal_match.group(1).strip(
        )[:300] if goal_match else input.goals[:300]

        return {
            "message": "Weekly plan generated successfully",
            "ai_plan": plan,
            "goal_summary": goal_summary,
            "suggested_tasks": tasks[:5],  # Limit to 5 tasks
            "tip": "Click 'Use This Plan' to auto-create your plan with tasks"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/daily-checkin")
def ai_daily_checkin(
    input: DailyCheckIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI analyzes your day and gives feedback"""
    try:
        # Get today's completed tasks
        today = datetime.utcnow().date()
        completed = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status == TaskStatus.completed
        ).all()
        completed_str = ", ".join(
            [t.title for t in completed]) if completed else "No tasks completed yet"

        feedback = analyze_daily_progress(
            username=current_user.username,
            completed_tasks=completed_str,
            journal_text=input.journal_text,
            productivity_score=input.productivity_score
        )
        return {
            "message": "Daily check-in complete",
            "completed_tasks": completed_str,
            "ai_feedback": feedback
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/suggest-next-actions")
def ai_suggest_actions(
    input: NextActionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI suggests your next top 3 actions based on pending tasks"""
    try:
        pending = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status != TaskStatus.completed
        ).all()
        pending_str = ", ".join(
            [f"{t.title} ({t.priority})" for t in pending]) if pending else "No pending tasks"

        suggestions = suggest_next_actions(
            username=current_user.username,
            pending_tasks=pending_str,
            todays_journal=input.todays_journal
        )
        return {
            "pending_tasks_count": len(pending),
            "ai_suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/weekly-summary")
def ai_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI generates your weekly performance summary"""
    try:
        completed = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status == TaskStatus.completed
        ).all()
        completed_str = ", ".join(
            [t.title for t in completed]) if completed else "No completed tasks"

        journals = db.query(Journal).filter(
            Journal.user_id == current_user.id
        ).order_by(Journal.entry_date.desc()).limit(7).all()

        journal_highlights = " | ".join([
            f"{j.entry_date}: {j.journal_text[:50] if j.journal_text else 'No text'}"
            for j in journals
        ]) if journals else "No journal entries"

        scores = [j.productivity_score for j in journals if j.productivity_score]
        avg_score = sum(scores) / len(scores) if scores else 0

        summary = weekly_summary(
            username=current_user.username,
            completed_tasks=completed_str,
            archived_journals=journal_highlights,
            avg_score=round(avg_score, 1)
        )
        return {
            "tasks_completed": len(completed),
            "average_productivity_score": round(avg_score, 1),
            "ai_summary": summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(e)}")
