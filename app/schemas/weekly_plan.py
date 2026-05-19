from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.models.weekly_plan import PlanStatus


class WeeklyPlanCreate(BaseModel):
    week_start: date
    week_end: date
    goal_summary: Optional[str] = None


class WeeklyPlanResponse(BaseModel):
    id: int
    user_id: int
    week_start: date
    week_end: date
    goal_summary: Optional[str]
    status: PlanStatus

    class Config:
        from_attributes = True


class WeeklyPlanUpdate(BaseModel):
    goal_summary: Optional[str] = None
    status: Optional[PlanStatus] = None
