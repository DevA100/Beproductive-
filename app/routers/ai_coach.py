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
    """AI generates a weekly plan based on your goals"""
    try:
        plan = generate_weekly_plan(
            username=current_user.username,
            goals=input.goals
        )
        return {
            "message": "Weekly plan generated successfully",
            "ai_plan": plan,
            "tip": "Use POST /plans/ to save this plan to your account"
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
