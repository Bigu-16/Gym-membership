from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CheckIn(Base):
    __tablename__ = "check_ins"
    __table_args__ = (
        CheckConstraint("check_out_time IS NULL OR check_out_time >= check_in_time", name="ck_check_out_after_check_in"),
        # At most one open check-in per member, enforced by the database (no double-tap duplicates).
        Index(
            "uq_check_ins_open_member",
            "member_id",
            unique=True,
            postgresql_where=text("check_out_time IS NULL"),
            sqlite_where=text("check_out_time IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False, index=True)
    check_in_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    check_out_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    member = relationship("Member", back_populates="check_ins")
