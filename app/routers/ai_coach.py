import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.weekly_plan import WeeklyPlan, PlanStatus
from app.services.ai_coach import generate_weekly_plan
from pydantic import BaseModel
from typing import List
from datetime import date, timedelta

router = APIRouter(prefix="/ai-coach", tags=["AI Coach"])


class GoalsInput(BaseModel):
    goals: str


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

        # Look for "Top 5 Tasks" section
        task_section = re.search(
            r'Top 5 Tasks for the Week[\s-]*\n(.*?)(?=\n\n|\nDaily Breakdown|\nFocus Tip|$)',
            plan,
            re.DOTALL | re.IGNORECASE
        )

        if task_section:
            task_lines = task_section.group(1).split('\n')
            for line in task_lines:
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
        # Calculate week start and end (current week)
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        # Check if user already has a plan for this week
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

        # Create the weekly plan
        new_plan = WeeklyPlan(
            user_id=current_user.id,
            week_start=week_start,
            week_end=week_end,
            goal_summary=request.goal_summary,
            status=PlanStatus.active
        )
        db.add(new_plan)
        db.flush()

        # Create tasks from the suggested tasks
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
