from sqlalchemy import Enum, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import ScheduleType


class ScheduleTemplate(TimestampMixin, Base):
    __tablename__ = "schedule_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[ScheduleType] = mapped_column(Enum(ScheduleType, name="schedule_type_enum"), nullable=False)
    days: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    time: Mapped[str] = mapped_column(String(20), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    sessions = relationship("Session", back_populates="template")
    enrollments = relationship("Enrollment", back_populates="template")
