from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, declared_attr, mapped_column


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TenantMixin:
    """Every row belongs to exactly one tenant (gym). Queries must always filter on club_id."""

    @declared_attr
    def club_id(cls) -> Mapped[int]:
        return mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
