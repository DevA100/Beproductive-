from pydantic import BaseModel
from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import verify_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "phone_number": current_user.phone_number,  # Added this
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }


class UpdatePhone(BaseModel):
    phone_number: str


@router.patch("/me/phone")
def update_phone(
    data: UpdatePhone,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.phone_number = data.phone_number
    db.commit()
    db.refresh(current_user)
    return {"message": "Phone updated", "phone_number": current_user.phone_number}


class UpdateProfile(BaseModel):
    username: str = None
    email: str = None


@router.patch("/me")
def update_profile(
    data: UpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.username:
        # Check if username is taken
        existing = db.query(User).filter(
            User.username == data.username,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Username already taken")
        current_user.username = data.username

    if data.email:
        existing = db.query(User).filter(
            User.email == data.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Email already registered")
        current_user.email = data.email

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated", "user": current_user}
