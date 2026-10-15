from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import Gender


class Member(TimestampMixin, Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    # Children registered under a family are reached through the parent, so their own
    # phone is optional and may repeat the parent's number.
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    emirates_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    parent_phone: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    family_id: Mapped[int | None] = mapped_column(ForeignKey("families.id"), nullable=True, index=True)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender, name="gender_enum"), nullable=True)
    medical_issues: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("membership_plans.id"), nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    is_frozen: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    messaging_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    # When the student/parent agreed to the center's terms printed on the registration form.
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    family = relationship("Family", back_populates="members")
    plan = relationship("MembershipPlan", back_populates="members")
    enrollments = relationship("Enrollment", back_populates="member", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="member", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="member", cascade="all, delete-orphan")
    notification_jobs = relationship("NotificationJob", cascade="all, delete-orphan")
