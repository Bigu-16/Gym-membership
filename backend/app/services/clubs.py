from datetime import time
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ClassSlot, Club, UniformSize
from app.models.enums import ClubKind

ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
MON_TO_SAT = [0, 1, 2, 3, 4, 5]

# Ethiopian time 3-4, 4-5, 5-6 (morning, every class day) and 8-9 (afternoon, not on Sunday).
DEFAULT_SLOTS = [
    (time(9, 0), time(10, 0), ALL_DAYS),
    (time(10, 0), time(11, 0), ALL_DAYS),
    (time(11, 0), time(12, 0), ALL_DAYS),
    (time(14, 0), time(15, 0), MON_TO_SAT),
]
DEFAULT_SIZES = ["55", "60", "65", "70", "75", "80", "85", "90", "95", "100"]


def seed_club_defaults(db: AsyncSession, club: Club) -> None:
    """Default class times and uniform sizes for a new taekwondo club (both editable afterwards)."""
    for start, end, days in DEFAULT_SLOTS:
        db.add(ClassSlot(club_id=club.id, start_time=start, end_time=end, weekdays=list(days), is_active=True))
    for index, label in enumerate(DEFAULT_SIZES):
        db.add(UniformSize(club_id=club.id, label=label, sort_order=(index + 1) * 10, price=None, is_active=True))


def new_club(name: str, name_am: str | None = None, monthly_fee: Decimal = Decimal("0"), kind: ClubKind = ClubKind.taekwondo) -> Club:
    return Club(
        name=name,
        kind=kind,
        name_am=name_am,
        monthly_fee=monthly_fee,
        uniform_price=Decimal("0"),
        timezone="Africa/Addis_Ababa",
        currency="ETB",
        summer_start="06-15",
        summer_end="09-10",
        term_days=[5, 6],
        summer_days=list(MON_TO_SAT),
        expiring_days=7,
        critical_days=2,
        low_stock_threshold=3,
        is_active=True,
    )
