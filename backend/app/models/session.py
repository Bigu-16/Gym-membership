from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import SessionStatus


class Session(TimestampMixin, Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("schedule_templates.id"), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    trainer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status_enum"),
        nullable=False,
        default=SessionStatus.upcoming,
    )
    checklist_data: Mapped[dict | list] = mapped_column(JSON, nullable=False, default=dict)

    template = relationship("ScheduleTemplate", back_populates="sessions")
    enrollments = relationship("Enrollment", back_populates="session")
