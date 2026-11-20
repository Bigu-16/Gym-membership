from collections import defaultdict
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Club, UniformAdjustment, UniformOrder, UniformOrderLine, UniformSale, UniformSize
from app.models.enums import UniformOrderStatus


async def stock_by_size(db: AsyncSession, club_id: int) -> dict[int, dict[str, int]]:
    """Per size: pending (ordered, not arrived), received, adjusted, sold, in_stock."""
    stats: dict[int, dict[str, int]] = defaultdict(lambda: {"pending": 0, "received": 0, "adjusted": 0, "sold": 0})

    order_rows = await db.execute(
        select(UniformOrderLine.size_id, UniformOrder.status, func.sum(UniformOrderLine.quantity))
        .join(UniformOrder, UniformOrder.id == UniformOrderLine.order_id)
        .where(UniformOrder.club_id == club_id)
        .group_by(UniformOrderLine.size_id, UniformOrder.status)
    )
    for size_id, status, qty in order_rows.all():
        if status == UniformOrderStatus.ordered:
            stats[size_id]["pending"] += int(qty or 0)
        elif status == UniformOrderStatus.received:
            stats[size_id]["received"] += int(qty or 0)

    sold_rows = await db.execute(
        select(UniformSale.size_id, func.sum(UniformSale.quantity)).where(UniformSale.club_id == club_id).group_by(UniformSale.size_id)
    )
    for size_id, qty in sold_rows.all():
        stats[size_id]["sold"] += int(qty or 0)

    adj_rows = await db.execute(
        select(UniformAdjustment.size_id, func.sum(UniformAdjustment.quantity))
        .where(UniformAdjustment.club_id == club_id)
        .group_by(UniformAdjustment.size_id)
    )
    for size_id, qty in adj_rows.all():
        stats[size_id]["adjusted"] += int(qty or 0)

    for values in stats.values():
        values["in_stock"] = values["received"] + values["adjusted"] - values["sold"]
    return stats


def in_stock(stats: dict[int, dict[str, int]], size_id: int) -> int:
    values = stats.get(size_id)
    return values["in_stock"] if values else 0


def size_price(size: UniformSize, club: Club) -> Decimal:
    return size.price if size.price is not None else club.uniform_price
