from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from app.database import Base


class DailyAction(Base):
    __tablename__ = "daily_actions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)

    task = relationship("Task", back_populates="daily_actions")
