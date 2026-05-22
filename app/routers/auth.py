from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.weekly_plan import WeeklyPlan
from app.models.journal import Journal
from app.models.daily_action import DailyAction
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.routers.deps import get_current_user
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


class DeleteAccountRequest(BaseModel):
    password: str
    confirmation_text: str  # User must type "DELETE" to confirm


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=400, detail="This email is already registered")

    # Check if username already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=400, detail="This username is already taken")

    # Format phone number before saving
    formatted_phone = User.format_phone_number(
        user.phone_number) if user.phone_number else None

    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hash_password(user.password),
        phone_number=formatted_phone
    )
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
        logger.info(
            f"User created successfully: {new_user.username} (Phone: {formatted_phone})")
    except Exception as e:
        db.rollback()
        logger.error(f"User creation failed: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Account creation failed. Please try again")

    try:
        from app.services.email_service import send_welcome_email
        await send_welcome_email(to_email=new_user.email, username=new_user.username)
        logger.info(f"Welcome email sent to {new_user.email}")
    except Exception as e:
        logger.error(
            f"Failed to send welcome email to {new_user.email}: {str(e)}")

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


# ========== DELETE ACCOUNT ENDPOINT ==========
@router.delete("/delete-account", status_code=status.HTTP_200_OK)
async def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete user account and all associated data.
    User must confirm by typing "DELETE" and provide password.
    """
    # Verify confirmation text
    if request.confirmation_text != "DELETE":
        raise HTTPException(
            status_code=400,
            detail='Please type "DELETE" to confirm account deletion'
        )

    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )

    user_id = current_user.id
    user_email = current_user.email
    username = current_user.username

    try:
        # Delete all tasks
        tasks_deleted = db.query(Task).filter(Task.user_id == user_id).delete()
        logger.info(f"Deleted {tasks_deleted} tasks for user {username}")

        # Delete all weekly plans
        plans_deleted = db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == user_id).delete()
        logger.info(
            f"Deleted {plans_deleted} weekly plans for user {username}")

        # Delete all journals
        journals_deleted = db.query(Journal).filter(
            Journal.user_id == user_id).delete()
        logger.info(f"Deleted {journals_deleted} journals for user {username}")

        # Delete all daily actions
        actions_deleted = db.query(DailyAction).filter(
            DailyAction.user_id == user_id).delete()
        logger.info(
            f"Deleted {actions_deleted} daily actions for user {username}")

        # Delete the user
        db.delete(current_user)
        db.commit()

        logger.info(
            f"User account permanently deleted: {username} ({user_email})")

        # Send goodbye email (optional, don't fail if it errors)
        try:
            from app.services.email_service import send_email
            await send_email(
                to_email=user_email,
                subject="Goodbye from BeProductive",
                body=f"""
Hi {username},

Your BeProductive account has been permanently deleted.

We're sad to see you go! If you change your mind, you can always create a new account.

All your data has been removed from our systems.

Best regards,
The BeProductive Team
                """
            )
            logger.info(f"Goodbye email sent to {user_email}")
        except Exception as e:
            logger.error(f"Failed to send goodbye email to {user_email}: {e}")

        return {
            "message": "Account permanently deleted",
            "deleted_data": {
                "tasks": tasks_deleted,
                "weekly_plans": plans_deleted,
                "journals": journals_deleted,
                "daily_actions": actions_deleted
            }
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Account deletion failed for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete account. Please try again or contact support."
        )
