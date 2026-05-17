from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PlanStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    goal_summary = Column(String, nullable=True)
    status = Column(Enum(PlanStatus), default=PlanStatus.active)

    user = relationship("User", back_populates="weekly_plans")
    tasks = relationship("Task", back_populates="weekly_plan")
