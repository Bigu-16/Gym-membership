from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Guardian(TimestampMixin, Base):
    """A parent. One parent can have several kids enrolled."""

    __tablename__ = "guardians"
    __table_args__ = (UniqueConstraint("club_id", "phone", name="uq_guardians_club_phone"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    phone_alt: Mapped[str | None] = mapped_column(String(30), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    students = relationship("Student", back_populates="guardian", order_by="Student.name")
