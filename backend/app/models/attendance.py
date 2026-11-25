from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin
from app.models.enums import AttendanceStatus


class Attendance(TenantMixin, TimestampMixin, Base):
    """One mark per kid per class day, written when the slot's register is saved."""

    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "class_date", name="uq_attendance_student_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_id: Mapped[int | None] = mapped_column(ForeignKey("class_slots.id", ondelete="SET NULL"), nullable=True, index=True)
    class_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus, name="attendance_status_enum"), nullable=False)
    recorded_by_id: Mapped[int | None] = mapped_column(ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)
