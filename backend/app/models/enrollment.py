from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Enrollment(TimestampMixin, Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("member_id", "template_id", "session_id", name="uq_member_template_session"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("schedule_templates.id"), nullable=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("sessions.id"), nullable=True)

    member = relationship("Member", back_populates="enrollments")
    template = relationship("ScheduleTemplate", back_populates="enrollments")
    session = relationship("Session", back_populates="enrollments")
