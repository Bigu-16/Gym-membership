from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Family(TimestampMixin, Base):
    __tablename__ = "families"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    parent_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    parent_phone: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    parent_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parent_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parent_relationship: Mapped[str] = mapped_column(String(60), nullable=False, default="parent")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    members = relationship("Member", back_populates="family")
