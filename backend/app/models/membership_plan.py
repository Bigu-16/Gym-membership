from decimal import Decimal

from sqlalchemy import Boolean, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class MembershipPlan(TimestampMixin, Base):
    __tablename__ = "membership_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    program: Mapped[str] = mapped_column(String(80), nullable=False, default="General", index=True)
    duration_label: Mapped[str] = mapped_column(String(80), nullable=False, default="One Month")
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    classes_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="AED")
    included_items: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    members = relationship("Member", back_populates="plan")
