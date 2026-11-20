from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Student(TimestampMixin, Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    guardian_id: Mapped[int] = mapped_column(ForeignKey("guardians.id"), nullable=False, index=True)
    slot_id: Mapped[int | None] = mapped_column(ForeignKey("class_slots.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uniform_size: Mapped[str | None] = mapped_column(String(10), nullable=True)
    joined_on: Mapped[date] = mapped_column(Date, nullable=False)
    # Last day the paid months cover. After this day the kid is "expired".
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    guardian = relationship("Guardian", back_populates="students")
    slot = relationship("ClassSlot")
