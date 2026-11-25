from datetime import time

from sqlalchemy import JSON, Boolean, ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin


class ClassSlot(TenantMixin, TimestampMixin, Base):
    """A class hour, e.g. 09:00-10:00 (3-4 in Ethiopian time). Each kid trains in one slot."""

    __tablename__ = "class_slots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Stored in international (24h) time; the app shows the Ethiopian hour too.
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    # Weekdays this slot can run on (0 = Monday). The season decides which of them are class days.
    weekdays: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=lambda: [0, 1, 2, 3, 4, 5, 6])
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    club = relationship("Club", back_populates="slots")
