from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.journal import Journal
from app.routers.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import date
from typing import Optional, List

router = APIRouter(prefix="/journal", tags=["Journal"])


class JournalCreate(BaseModel):
    entry_date: date
    journal_text: Optional[str] = None
    productivity_score: Optional[float] = None
    wins: Optional[str] = None
    challenges: Optional[str] = None


class JournalResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    journal_text: Optional[str]
    productivity_score: Optional[float]
    wins: Optional[str]
    challenges: Optional[str]

    class Config:
        from_attributes = True


@router.post("/", response_model=JournalResponse)
def create_entry(entry: JournalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Prevent duplicate entry for same day
    existing = db.query(Journal).filter(
        Journal.user_id == current_user.id,
        Journal.entry_date == entry.entry_date
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Journal entry already exists for this date")

    new_entry = Journal(user_id=current_user.id, **entry.model_dump())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/", response_model=List[JournalResponse])
def get_all_entries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Journal).filter(Journal.user_id == current_user.id).order_by(Journal.entry_date.desc()).all()


@router.get("/{entry_date}", response_model=JournalResponse)
def get_entry_by_date(entry_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(Journal).filter(
        Journal.user_id == current_user.id,
        Journal.entry_date == entry_date
    ).first()
    if not entry:
        raise HTTPException(
            status_code=404, detail="No journal entry found for this date")
    return entry


@router.patch("/{entry_date}", response_model=JournalResponse)
def update_entry(entry_date: date, updates: JournalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(Journal).filter(
        Journal.user_id == current_user.id,
        Journal.entry_date == entry_date
    ).first()
    if not entry:
        raise HTTPException(
            status_code=404, detail="No journal entry found for this date")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry
