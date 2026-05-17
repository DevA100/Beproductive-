from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float
from sqlalchemy.orm import relationship
from app.database import Base


class Journal(Base):
    __tablename__ = "journals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    journal_text = Column(String, nullable=True)
    productivity_score = Column(Float, nullable=True)
    wins = Column(String, nullable=True)
    challenges = Column(String, nullable=True)

    user = relationship("User", back_populates="journals")
