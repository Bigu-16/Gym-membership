from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import AnnouncementStatus


class Announcement(TimestampMixin, Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    # List of NotificationChannel values this announcement targets.
    channels: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # Recipient filters, e.g. {"plan_id": 1, "program": "Kids", "expired": false}.
    filters: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[AnnouncementStatus] = mapped_column(
        Enum(AnnouncementStatus, name="announcement_status_enum"),
        nullable=False,
        default=AnnouncementStatus.draft,
    )
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    recipient_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    job_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("app_users.id"), nullable=True, index=True
    )

    created_by = relationship("AppUser")
