from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.weekly_plan import WeeklyPlan, PlanStatus
from app.schemas.weekly_plan import WeeklyPlanCreate, WeeklyPlanResponse
from app.routers.deps import get_current_user
from app.models.user import User
from typing import List

router = APIRouter(prefix="/plans", tags=["Weekly Plans"])


@router.post("/", response_model=WeeklyPlanResponse)
def create_plan(plan: WeeklyPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Prevent duplicate plan for same week
    existing = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.week_start == plan.week_start
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="You already have a plan for this week")

    new_plan = WeeklyPlan(
        user_id=current_user.id,
        week_start=plan.week_start,
        week_end=plan.week_end,
        goal_summary=plan.goal_summary
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan


@router.get("/", response_model=List[WeeklyPlanResponse])
def get_my_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Returns all plans — active + archived (full history)
    return db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id
    ).order_by(WeeklyPlan.week_start.desc()).all()


@router.get("/active", response_model=WeeklyPlanResponse)
def get_active_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.status == PlanStatus.active
    ).first()
    if not plan:
        raise HTTPException(
            status_code=404, detail="No active plan found for this week")
    return plan


@router.get("/archived", response_model=List[WeeklyPlanResponse])
def get_archived_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Returns only archived plans — previous weeks history
    return db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.status == PlanStatus.archived
    ).order_by(WeeklyPlan.week_start.desc()).all()


@router.patch("/{plan_id}/archive", response_model=WeeklyPlanResponse)
def archive_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.id == plan_id,
        WeeklyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.status = PlanStatus.archived
    db.commit()
    db.refresh(plan)
    return plan
