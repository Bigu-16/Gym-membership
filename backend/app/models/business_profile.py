from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class BusinessProfile(TimestampMixin, Base):
    __tablename__ = "business_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    account_details: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
