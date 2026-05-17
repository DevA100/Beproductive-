from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.daily_action import DailyAction
from app.routers.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import date
from typing import Optional, List

router = APIRouter(prefix="/daily-actions", tags=["Daily Actions"])


class DailyActionCreate(BaseModel):
    task_id: int
    action_date: date
    description: str


class DailyActionUpdate(BaseModel):
    is_completed: Optional[bool] = None
    description: Optional[str] = None


class DailyActionResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    action_date: date
    description: str
    is_completed: bool

    class Config:
        from_attributes = True


@router.post("/", response_model=DailyActionResponse)
def create_action(action: DailyActionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_action = DailyAction(user_id=current_user.id, **action.model_dump())
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    return new_action


@router.get("/today", response_model=List[DailyActionResponse])
def get_todays_actions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime
    today = datetime.utcnow().date()
    return db.query(DailyAction).filter(
        DailyAction.user_id == current_user.id,
        DailyAction.action_date == today
    ).all()


@router.get("/{task_id}", response_model=List[DailyActionResponse])
def get_actions_for_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DailyAction).filter(
        DailyAction.task_id == task_id,
        DailyAction.user_id == current_user.id
    ).all()


@router.patch("/{action_id}", response_model=DailyActionResponse)
def update_action(action_id: int, updates: DailyActionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    action = db.query(DailyAction).filter(
        DailyAction.id == action_id,
        DailyAction.user_id == current_user.id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(action, key, value)
    db.commit()
    db.refresh(action)
    return action
