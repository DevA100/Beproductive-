import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.weekly_plan import WeeklyPlan, PlanStatus
from app.models.journal import Journal
from app.services.ai_coach import generate_weekly_plan
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, timedelta

router = APIRouter(prefix="/ai-coach", tags=["AI Coach"])


class GoalsInput(BaseModel):
    goals: str


class DailyCheckIn(BaseModel):
    journal_text: Optional[str] = "No journal entry yet"
    productivity_score: Optional[float] = 5.0


class NextActionInput(BaseModel):
    todays_journal: Optional[str] = "Day is going okay"


class CreatePlanFromAIRequest(BaseModel):
    ai_plan: str
    goal_summary: str
    suggested_tasks: List[dict]


@router.post("/generate-weekly-plan")
def ai_generate_weekly_plan(
    input: GoalsInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        plan = generate_weekly_plan(
            username=current_user.username, goals=input.goals)

        # Extract tasks from the AI response
        tasks = []

        task_section = re.search(
            r'Top 5 Tasks for the Week[\s-]*\n(.*?)(?=\n\n|\nDaily Breakdown|\nFocus Tip|\*\*Daily Breakdown|$)',
            plan,
            re.DOTALL | re.IGNORECASE
        )

        if task_section:
            task_text = task_section.group(1)
            for line in task_text.split('\n'):
                clean_line = re.sub(r'\*\*', '', line.strip())
                match = re.match(
                    r'^\s*\d+\.\s+(.+?)(?:\s*-\s*(.+))?$', clean_line)
                if match:
                    title = match.group(1).strip()
                    description = match.group(
                        2).strip() if match.group(2) else ""
                    title = title[:100]
                    description = description[:200] if description else ""
                    tasks.append({
                        "title": title,
                        "description": description
                    })

        # Extract goal summary
        goal_match = re.search(
            r'Weekly Goal[\s-]*:?\s*(.+?)(?=\n\n|\nTop 5|\*\*Top 5|\n$)',
            plan,
            re.DOTALL | re.IGNORECASE
        )
        if goal_match:
            goal_summary = re.sub(
                r'\*\*', '', goal_match.group(1).strip())[:300]
        else:
            goal_summary = input.goals[:300]

        return {
            "message": "Weekly plan generated successfully",
            "ai_plan": plan,
            "goal_summary": goal_summary,
            "suggested_tasks": tasks[:5],
            "tip": "Click 'Use This Plan' to auto-create your plan with tasks"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/create-plan-from-ai")
def create_plan_from_ai(
    request: CreatePlanFromAIRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a weekly plan and tasks from AI-generated content"""
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        existing_plan = db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == current_user.id,
            WeeklyPlan.week_start == week_start,
            WeeklyPlan.status == PlanStatus.active
        ).first()

        if existing_plan:
            raise HTTPException(
                status_code=400,
                detail="You already have an active plan for this week. Please archive it first."
            )

        new_plan = WeeklyPlan(
            user_id=current_user.id,
            week_start=week_start,
            week_end=week_end,
            goal_summary=request.goal_summary,
            status=PlanStatus.active
        )
        db.add(new_plan)
        db.flush()

        created_tasks = []
        for task_data in request.suggested_tasks:
            new_task = Task(
                weekly_plan_id=new_plan.id,
                user_id=current_user.id,
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description", ""),
                priority=TaskPriority.medium,
                status=TaskStatus.pending,
                is_ai_generated=True
            )
            db.add(new_task)
            created_tasks.append({
                "id": new_task.id,
                "title": new_task.title,
                "description": new_task.description
            })

        db.commit()
        db.refresh(new_plan)

        return {
            "message": f"Successfully created plan with {len(created_tasks)} tasks",
            "plan": {
                "id": new_plan.id,
                "week_start": new_plan.week_start,
                "week_end": new_plan.week_end,
                "goal_summary": new_plan.goal_summary,
                "status": new_plan.status.value
            },
            "tasks_created": created_tasks
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create plan: {str(e)}")


@router.post("/daily-checkin")
def ai_daily_checkin(
    input: DailyCheckIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI analyzes your day and gives feedback"""
    try:
        today = date.today()
        completed = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status == TaskStatus.completed
        ).all()
        completed_str = ", ".join(
            [t.title for t in completed]) if completed else "No tasks completed yet"

        pending = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status != TaskStatus.completed
        ).all()
        pending_str = ", ".join(
            [t.title for t in pending]) if pending else "No pending tasks"

        feedback = f"""Daily Check-in Summary - {current_user.username}

Productivity Score: {input.productivity_score}/10

Completed Tasks: {completed_str}
Pending Tasks: {pending_str}

Journal Entry: {input.journal_text[:200]}

Feedback: 
{'Good progress today.' if len(completed) > 0 else 'Try to complete at least one task today.'}
{'You have pending tasks. Focus on completing them tomorrow.' if len(pending) > 0 else 'All tasks completed. Excellent work.'}

Tip: {'Start with your hardest task tomorrow morning.' if len(pending) > 0 else 'Take time to plan for tomorrow.'}"""

        return {
            "message": "Daily check-in complete",
            "completed_tasks": completed_str,
            "pending_tasks": pending_str,
            "ai_feedback": feedback
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


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
        ).order_by(Task.priority).all()

        if pending:
            suggestions = f"Based on your current progress: {input.todays_journal}\n\n"
            suggestions += "Top 3 Actions for you:\n"
            for i, task in enumerate(pending[:3], 1):
                priority_flag = "[HIGH]" if task.priority.value == "high" else "[MEDIUM]" if task.priority.value == "medium" else "[LOW]"
                suggestions += f"{i}. {priority_flag} {task.title}\n"
                if task.description:
                    suggestions += f"   {task.description[:100]}\n"
        else:
            suggestions = "No pending tasks. Great job. Consider creating a new weekly plan."

        return {
            "pending_tasks_count": len(pending),
            "ai_suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/weekly-summary")
def ai_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI generates your weekly performance summary"""
    try:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        tasks = db.query(Task).filter(
            Task.user_id == current_user.id
        ).all()

        completed_tasks = [
            t for t in tasks if t.status == TaskStatus.completed]
        pending_tasks = [t for t in tasks if t.status != TaskStatus.completed]

        journals = db.query(Journal).filter(
            Journal.user_id == current_user.id
        ).order_by(Journal.entry_date.desc()).limit(7).all()

        scores = [j.productivity_score for j in journals if j.productivity_score]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        active_plan = db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == current_user.id,
            WeeklyPlan.status == PlanStatus.active
        ).first()

        summary = f"Weekly Performance Summary - {current_user.username}\n"
        summary += f"Week of {start_of_week} to {end_of_week}\n"
        summary += "=" * 40 + "\n\n"

        summary += "Overall Statistics:\n"
        summary += f"  - Total Tasks: {len(tasks)}\n"
        summary += f"  - Completed: {len(completed_tasks)}\n"
        summary += f"  - Pending: {len(pending_tasks)}\n"
        summary += f"  - Completion Rate: {round(len(completed_tasks)/len(tasks)*100, 1) if tasks else 0}%\n"
        summary += f"  - Average Productivity Score: {avg_score}/10\n\n"

        summary += f"Journal Entries: {len(journals)}\n\n"

        if active_plan:
            summary += "Current Weekly Goal:\n"
            summary += f"  {active_plan.goal_summary[:200]}\n\n"

        if len(completed_tasks) > 0:
            summary += "Top Completed Tasks:\n"
            for task in completed_tasks[:3]:
                summary += f"  - {task.title}\n"
            summary += "\n"

        if len(pending_tasks) > 0:
            summary += "Remaining Tasks:\n"
            for task in pending_tasks[:3]:
                summary += f"  - {task.title}\n"
            summary += "\n"

        summary += "Recommendation:\n"
        if len(completed_tasks) > len(pending_tasks):
            summary += "  Good progress this week. Use momentum to finish remaining tasks."
        elif avg_score > 7:
            summary += "  High productivity week. Keep up the excellent work."
        else:
            summary += "  Set smaller, achievable daily goals to improve productivity next week."

        return {
            "tasks_completed": len(completed_tasks),
            "total_tasks": len(tasks),
            "completion_rate": round(len(completed_tasks)/len(tasks)*100, 1) if tasks else 0,
            "average_productivity_score": avg_score,
            "journal_entries": len(journals),
            "ai_summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
