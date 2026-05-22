from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import re


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    weekly_plans = relationship("WeeklyPlan", back_populates="user")
    journals = relationship("Journal", back_populates="user")

    @staticmethod
    def format_phone_number(phone: str) -> str:
        """
        Format phone number for storage - Universal (all countries)

        Examples:
        - Nigeria: 07043955397 → 2347043955397
        - US: (415) 555-1234 → 14155551234
        - UK: 07911 123456 → 447911123456
        - India: 9876543210 → 919876543210
        - Kenya: 0712345678 → 254712345678
        - Ghana: 0241234567 → 233241234567
        - South Africa: 0821234567 → 27821234567
        """
        if not phone:
            return None

        phone = re.sub(r'\D', '', phone)

        phone = phone.lstrip('0')

        if len(phone) < 10:
            return phone

        return phone if phone else None
