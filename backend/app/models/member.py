from datetime import date

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import Gender


class Member(TimestampMixin, Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    parent_phone: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    family_id: Mapped[int | None] = mapped_column(ForeignKey("families.id"), nullable=True, index=True)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender, name="gender_enum"), nullable=True)
    medical_issues: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("membership_plans.id"), nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    is_frozen: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    messaging_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)

    family = relationship("Family", back_populates="members")
    plan = relationship("MembershipPlan", back_populates="members")
    enrollments = relationship("Enrollment", back_populates="member", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="member", cascade="all, delete-orphan")
    notification_jobs = relationship("NotificationJob", cascade="all, delete-orphan")
