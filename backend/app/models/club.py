from decimal import Decimal

from sqlalchemy import JSON, Boolean, Enum, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import ClubKind

# Monday = 0 ... Sunday = 6 (Python's date.weekday()).
DEFAULT_TERM_DAYS = [5, 6]  # school season (Sep - Jun): weekends only
DEFAULT_SUMMER_DAYS = [0, 1, 2, 3, 4, 5]  # summer (Jun - Sep): Monday to Saturday


class Club(TimestampMixin, Base):
    """A tenant: one gym. Its accounts and data are never visible to any other tenant.

    `kind` decides which app the tenant uses. The taekwondo settings below only apply to
    kind == taekwondo; the gym app keeps its own settings in its own tables.
    """

    __tablename__ = "clubs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    kind: Mapped[ClubKind] = mapped_column(
        Enum(ClubKind, name="club_kind_enum", native_enum=False, length=20), nullable=False, default=ClubKind.taekwondo
    )
    name_am: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Africa/Addis_Ababa")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="ETB")
    monthly_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    uniform_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    # Summer runs from summer_start to summer_end inclusive, as "MM-DD" every year.
    summer_start: Mapped[str] = mapped_column(String(5), nullable=False, default="06-15")
    summer_end: Mapped[str] = mapped_column(String(5), nullable=False, default="09-10")
    term_days: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=lambda: list(DEFAULT_TERM_DAYS))
    summer_days: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=lambda: list(DEFAULT_SUMMER_DAYS))
    # Expiry colours: yellow at <= expiring_days left, red at <= critical_days left.
    expiring_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    critical_days: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=3)

    slots = relationship("ClassSlot", back_populates="club", order_by="ClassSlot.start_time")
