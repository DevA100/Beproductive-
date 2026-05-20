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

        print("=== AI RESPONSE ===")
        print(plan)
        print("=== END AI RESPONSE ===")

        tasks = []
        lines = plan.split('\n')

        for line in lines:
            line = line.strip()
            # Look for lines that start with a number followed by dot
            if re.match(r'^\d+\.', line):
                # Remove the number and dot
                task_part = re.sub(r'^\d+\.\s*', '', line)

                # Split by dash if present
                if ' - ' in task_part:
                    parts = task_part.split(' - ', 1)
                    title = parts[0].strip()
                    description = parts[1].strip() if len(parts) > 1 else ""
                else:
                    title = task_part
                    description = ""

                # Clean up any markdown
                title = title.replace('**', '').replace('*', '').strip()
                description = description.replace(
                    '**', '').replace('*', '').strip()

                tasks.append({
                    "title": title[:100],
                    "description": description[:200] if description else ""
                })

                if len(tasks) >= 5:
                    break

        # Extract goal
        goal_summary = input.goals[:300]
        for line in lines:
            if 'WEEKLY GOAL:' in line or 'Weekly Goal:' in line:
                goal_summary = line.split(':', 1)[1].strip()
                goal_summary = goal_summary.replace(
                    '**', '').replace('*', '').strip()
                goal_summary = goal_summary[:300]
                break

        print(f"Found {len(tasks)} tasks")
        for i, task in enumerate(tasks):
            print(f"  Task {i+1}: {task['title']}")

        return {
            "message": "Weekly plan generated",
            "ai_plan": plan,
            "goal_summary": goal_summary,
            "suggested_tasks": tasks,
            "tip": "Click to create plan"
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-plan-from-ai")
def create_plan_from_ai(
    request: CreatePlanFromAIRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
                detail="You already have an active plan for this week"
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
                title=task_data.get("title", "Task"),
                description=task_data.get("description", ""),
                priority=TaskPriority.medium,
                status=TaskStatus.pending,
                is_ai_generated=True
            )
            db.add(new_task)
            created_tasks.append({
                "id": new_task.id,
                "title": new_task.title
            })

        db.commit()

        return {
            "message": f"Created plan with {len(created_tasks)} tasks",
            "plan_id": new_plan.id,
            "tasks_created": created_tasks
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/daily-checkin")
def ai_daily_checkin(
    input: DailyCheckIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        completed = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status == TaskStatus.completed
        ).all()
        completed_str = ", ".join(
            [t.title for t in completed]) if completed else "None"

        pending = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status != TaskStatus.completed
        ).all()
        pending_str = ", ".join(
            [t.title for t in pending]) if pending else "None"

        feedback = f"""Check-in for {current_user.username}
Score: {input.productivity_score}/10
Completed: {completed_str}
Pending: {pending_str}
Journal: {input.journal_text[:100]}
{'Good progress' if len(completed) > 0 else 'Try to complete more tasks'}"""

        return {
            "message": "Check-in complete",
            "completed_tasks": completed_str,
            "pending_tasks": pending_str,
            "ai_feedback": feedback
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-next-actions")
def ai_suggest_actions(
    input: NextActionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        pending = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status != TaskStatus.completed
        ).order_by(Task.priority).all()

        if pending:
            suggestions = "Top 3 actions:\n"
            for i, task in enumerate(pending[:3], 1):
                suggestions += f"{i}. {task.title}\n"
        else:
            suggestions = "No pending tasks. Great job!"

        return {
            "pending_tasks_count": len(pending),
            "ai_suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weekly-summary")
def ai_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
        completed = [t for t in tasks if t.status == TaskStatus.completed]

        journals = db.query(Journal).filter(
            Journal.user_id == current_user.id
        ).order_by(Journal.entry_date.desc()).limit(7).all()

        scores = [j.productivity_score for j in journals if j.productivity_score]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        summary = f"Weekly Summary for {current_user.username}\n"
        summary += f"Tasks completed: {len(completed)}/{len(tasks)}\n"
        summary += f"Average score: {avg_score}/10\n"
        summary += f"Journal entries: {len(journals)}\n"

        return {
            "tasks_completed": len(completed),
            "total_tasks": len(tasks),
            "completion_rate": round(len(completed)/len(tasks)*100, 1) if tasks else 0,
            "average_productivity_score": avg_score,
            "journal_entries": len(journals),
            "ai_summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
