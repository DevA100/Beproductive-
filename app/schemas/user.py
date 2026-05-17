from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    phone_number: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    phone_number: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    email_or_username: str
    password: str
