from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr
import random
import string
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Temporary OTP store (in production use Redis)
otp_store = {}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=400, detail="This email is already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=400, detail="This username is already taken")

    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hash_password(user.password),
        phone_number=user.phone_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        from app.services.email_service import send_welcome_email
        await send_welcome_email(to_email=new_user.email, username=new_user.username)
    except Exception:
        pass

    return new_user


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == credentials.email_or_username).first()
    if not user:
        user = db.query(User).filter(User.username ==
                                     credentials.email_or_username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=404, detail="No account found with this email")

    # Generate 6-digit OTP
    otp = "".join(random.choices(string.digits, k=6))
    otp_store[request.email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }

    try:
        from app.services.email_service import send_email
        await send_email(
            to_email=request.email,
            subject="🔐 Your Password Reset OTP — BeProductive",
            body=f"""
Hey {user.username}!

You requested a password reset for your BeProductive account.

Your OTP Code: {otp}

This code expires in 10 minutes.

If you didn't request this, ignore this email.

Your BeProductive Team
            """
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return {"message": "OTP sent to your email"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    stored = otp_store.get(request.email)
    if not stored:
        raise HTTPException(
            status_code=400, detail="No OTP found. Please request a new one")
    if datetime.utcnow() > stored["expires"]:
        del otp_store[request.email]
        raise HTTPException(
            status_code=400, detail="OTP has expired. Please request a new one")
    if stored["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(request.new_password)
    db.commit()
    del otp_store[request.email]

    return {"message": "Password reset successfully! Please login with your new password"}
