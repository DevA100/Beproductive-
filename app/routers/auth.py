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
import logging

logger = logging.getLogger(__name__)

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

    try:
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Account creation failed. Please try again")

    # Send welcome email — don't fail signup if email fails
    try:
        from app.services.email_service import send_welcome_email
        await send_welcome_email(to_email=new_user.email, username=new_user.username)
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")

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
    logger.info(f"Password reset requested for email: {request.email}")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.warning(f"No account found for email: {request.email}")
        raise HTTPException(
            status_code=404, detail="No account found with this email")

    # Generate 6-digit OTP
    otp = "".join(random.choices(string.digits, k=6))
    otp_store[request.email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }

    logger.info(f"OTP generated for {request.email}: {otp}")

    try:
        from app.services.email_service import send_otp_email
        await send_otp_email(
            to_email=request.email,
            username=user.username,
            otp=otp
        )
        logger.info(f"OTP email sent successfully to {request.email}")

    except ImportError:
        # Fallback to send_email function
        try:
            from app.services.email_service import send_email
            await send_email(
                to_email=request.email,
                subject="Your Password Reset OTP - BeProductive",
                body=f"""
Hey {user.username}!

You requested a password reset for your BeProductive account.

Your OTP Code: {otp}

This code expires in 10 minutes.

If you didn't request this, ignore this email.

Your BeProductive Team
                """
            )
            logger.info(
                f"OTP email sent successfully to {request.email} using fallback")
        except Exception as e:
            logger.error(f"Fallback email also failed: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to send OTP email: {str(e)}")

    except Exception as e:
        logger.error(f"Failed to send OTP email to {request.email}: {str(e)}")
        # For development, log the OTP to console
        print(f"\n=== OTP FOR {request.email}: {otp} ===\n")
        raise HTTPException(
            status_code=500, detail=f"Failed to send OTP email. Please check your email configuration.")

    return {"message": "OTP sent to your email"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    logger.info(f"Password reset attempt for email: {request.email}")

    stored = otp_store.get(request.email)
    if not stored:
        logger.warning(f"No OTP found for email: {request.email}")
        raise HTTPException(
            status_code=400, detail="No OTP found. Please request a new one")

    if datetime.utcnow() > stored["expires"]:
        del otp_store[request.email]
        logger.warning(f"Expired OTP for email: {request.email}")
        raise HTTPException(
            status_code=400, detail="OTP has expired. Please request a new one")

    if stored["otp"] != request.otp:
        logger.warning(f"Invalid OTP for email: {request.email}")
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.warning(f"User not found for email: {request.email}")
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(request.new_password)
    db.commit()
    del otp_store[request.email]

    logger.info(f"Password reset successful for email: {request.email}")

    return {"message": "Password reset successfully! Please login with your new password"}
