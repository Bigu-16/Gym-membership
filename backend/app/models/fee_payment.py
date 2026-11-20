from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import FeeMethod


class FeePayment(TimestampMixin, Base):
    """Monthly training fee for one kid. Kids paid together share a receipt number."""

    __tablename__ = "fee_payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    guardian_id: Mapped[int] = mapped_column(ForeignKey("guardians.id"), nullable=False, index=True)
    receipt_no: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[FeeMethod] = mapped_column(Enum(FeeMethod, name="fee_method_enum"), nullable=False)
    # Telebirr / bank transaction id, so it can be matched against the SMS or statement.
    reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    months: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    paid_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by_id: Mapped[int | None] = mapped_column(ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)

    student = relationship("Student")
