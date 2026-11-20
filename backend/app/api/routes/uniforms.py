from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_club, get_current_user, get_owned
from app.db import get_db_session
from app.models import AppUser, Club, Guardian, Student, UniformAdjustment, UniformOrder, UniformOrderLine, UniformSale, UniformSize
from app.models.enums import UniformOrderStatus
from app.schemas.uniform import (
    AdjustmentCreate,
    OrderCreate,
    OrderLineOut,
    OrderOut,
    OrderReceive,
    SaleCreate,
    SaleOut,
    SizeCreate,
    SizeOut,
    SizeUpdate,
    StockCount,
)
from app.services.audit import record_audit
from app.services.fees import new_receipt_no
from app.services.season import club_today
from app.services.uniform_stock import in_stock, size_price, stock_by_size

router = APIRouter(prefix="/uniforms", tags=["uniforms"])


async def _sizes(db: AsyncSession, club: Club) -> dict[int, UniformSize]:
    rows = await db.scalars(select(UniformSize).where(UniformSize.club_id == club.id))
    return {s.id: s for s in rows.all()}


def _size_out(size: UniformSize, club: Club, stock: dict) -> SizeOut:
    values = stock.get(size.id, {"pending": 0, "received": 0, "adjusted": 0, "sold": 0, "in_stock": 0})
    return SizeOut(
        id=size.id, label=size.label, sort_order=size.sort_order, price=size.price,
        effective_price=size_price(size, club), is_active=size.is_active,
        pending=values["pending"], received=values["received"], adjusted=values["adjusted"],
        sold=values["sold"], in_stock=values["in_stock"],
        low=size.is_active and values["in_stock"] <= club.low_stock_threshold,
    )


def _order_out(order: UniformOrder, sizes: dict[int, UniformSize]) -> OrderOut:
    lines = [OrderLineOut(size_id=l.size_id, size=sizes[l.size_id].label if l.size_id in sizes else "?", quantity=l.quantity) for l in order.lines]
    lines.sort(key=lambda l: sizes[l.size_id].sort_order if l.size_id in sizes else 0)
    return OrderOut(
        id=order.id, supplier=order.supplier, ordered_on=order.ordered_on, status=order.status,
        received_on=order.received_on, note=order.note, total_quantity=sum(l.quantity for l in order.lines), lines=lines,
    )


@router.get("/sizes", response_model=list[SizeOut])
async def list_sizes(db: AsyncSession = Depends(get_db_session), club: Club = Depends(get_club)) -> list[SizeOut]:
    sizes = sorted((await _sizes(db, club)).values(), key=lambda s: (s.sort_order, s.label))
    stock = await stock_by_size(db, club.id)
    return [_size_out(s, club, stock) for s in sizes]


@router.post("/sizes", response_model=SizeOut, status_code=status.HTTP_201_CREATED)
async def add_size(
    payload: SizeCreate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SizeOut:
    if await db.scalar(select(UniformSize.id).where(UniformSize.club_id == club.id, UniformSize.label == payload.label)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This size already exists")
    sort_order = payload.sort_order
    if sort_order is None:
        sort_order = (await db.scalar(select(func.max(UniformSize.sort_order)).where(UniformSize.club_id == club.id)) or 0) + 10
    size = UniformSize(club_id=club.id, label=payload.label, price=payload.price, sort_order=sort_order, is_active=True)
    db.add(size)
    await db.flush()
    record_audit(db, user, "size_added", "uniform_size", size.id, f"Added uniform size {size.label}", club_id=club.id)
    await db.commit()
    return _size_out(size, club, {})


@router.patch("/sizes/{size_id}", response_model=SizeOut)
async def update_size(
    size_id: int,
    payload: SizeUpdate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SizeOut:
    size = await get_owned(db, UniformSize, size_id, club, "Size")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("label"):
        label = updates["label"].strip()
        clash = await db.scalar(select(UniformSize.id).where(UniformSize.club_id == club.id, UniformSize.label == label, UniformSize.id != size.id))
        if clash:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This size already exists")
        size.label = label
    if updates.get("clear_price"):
        size.price = None
    elif "price" in updates and updates["price"] is not None:
        size.price = updates["price"]
    if updates.get("sort_order") is not None:
        size.sort_order = updates["sort_order"]
    if updates.get("is_active") is not None:
        size.is_active = updates["is_active"]
    record_audit(db, user, "size_updated", "uniform_size", size.id, f"Updated uniform size {size.label}", club_id=club.id)
    await db.commit()
    return _size_out(size, club, await stock_by_size(db, club.id))


# ----- Supplier orders --------------------------------------------------------------


@router.get("/orders", response_model=list[OrderOut])
async def list_orders(db: AsyncSession = Depends(get_db_session), club: Club = Depends(get_club)) -> list[OrderOut]:
    rows = await db.scalars(
        select(UniformOrder).where(UniformOrder.club_id == club.id).options(selectinload(UniformOrder.lines))
        .order_by(UniformOrder.ordered_on.desc(), UniformOrder.id.desc()).limit(300)
    )
    sizes = await _sizes(db, club)
    return [_order_out(o, sizes) for o in rows.all()]


@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> OrderOut:
    sizes = await _sizes(db, club)
    merged: dict[int, int] = {}
    for line in payload.lines:
        if line.size_id not in sizes:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Unknown uniform size")
        merged[line.size_id] = merged.get(line.size_id, 0) + line.quantity
    order = UniformOrder(
        club_id=club.id, supplier=payload.supplier, ordered_on=payload.ordered_on or club_today(club),
        status=UniformOrderStatus.ordered, note=payload.note,
        lines=[UniformOrderLine(size_id=size_id, quantity=qty) for size_id, qty in merged.items()],
    )
    db.add(order)
    await db.flush()
    record_audit(db, user, "uniform_ordered", "uniform_order", order.id, f"Ordered {sum(merged.values())} uniforms", club_id=club.id)
    await db.commit()
    order = await db.scalar(select(UniformOrder).where(UniformOrder.id == order.id).options(selectinload(UniformOrder.lines)))
    return _order_out(order, sizes)


async def _set_order_status(db, club, user, order_id: int, new_status: UniformOrderStatus, received_on: date | None) -> OrderOut:
    order = await db.scalar(
        select(UniformOrder).where(UniformOrder.id == order_id, UniformOrder.club_id == club.id).options(selectinload(UniformOrder.lines))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != UniformOrderStatus.ordered:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"This order is already {order.status.value}")
    order.status = new_status
    order.received_on = (received_on or club_today(club)) if new_status == UniformOrderStatus.received else None
    record_audit(db, user, f"uniform_order_{new_status.value}", "uniform_order", order.id,
                 f"Order #{order.id} marked {new_status.value}", club_id=club.id)
    await db.commit()
    return _order_out(order, await _sizes(db, club))


@router.post("/orders/{order_id}/receive", response_model=OrderOut)
async def receive_order(
    order_id: int,
    payload: OrderReceive,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> OrderOut:
    return await _set_order_status(db, club, user, order_id, UniformOrderStatus.received, payload.received_on)


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> OrderOut:
    return await _set_order_status(db, club, user, order_id, UniformOrderStatus.cancelled, None)


# ----- Sales ------------------------------------------------------------------------


async def _sale_out(db: AsyncSession, sale: UniformSale, sizes: dict[int, UniformSize]) -> SaleOut:
    buyer = sale.buyer_name or ""
    if sale.student_id:
        student = await db.get(Student, sale.student_id)
        buyer = student.name if student else buyer
    elif sale.guardian_id:
        guardian = await db.get(Guardian, sale.guardian_id)
        buyer = guardian.name if guardian else buyer
    return SaleOut(
        id=sale.id, size_id=sale.size_id, size=sizes[sale.size_id].label if sale.size_id in sizes else "?",
        quantity=sale.quantity, unit_price=sale.unit_price, total=sale.unit_price * sale.quantity,
        method=sale.method, reference=sale.reference, sold_on=sale.sold_on,
        student_id=sale.student_id, guardian_id=sale.guardian_id, buyer=buyer, receipt_no=sale.receipt_no,
    )


@router.get("/sales", response_model=list[SaleOut])
async def list_sales(
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=300, ge=1, le=2000),
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> list[SaleOut]:
    today = club_today(club)
    start = start or today - timedelta(days=90)
    end = end or today
    rows = (await db.scalars(
        select(UniformSale).where(UniformSale.club_id == club.id, UniformSale.sold_on >= start, UniformSale.sold_on <= end)
        .order_by(UniformSale.sold_on.desc(), UniformSale.id.desc()).limit(limit)
    )).all()
    sizes = await _sizes(db, club)
    return [await _sale_out(db, s, sizes) for s in rows]


@router.post("/sales", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
async def sell(
    payload: SaleCreate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SaleOut:
    size = await get_owned(db, UniformSize, payload.size_id, club, "Size")
    student = await get_owned(db, Student, payload.student_id, club, "Kid") if payload.student_id else None
    guardian_id = payload.guardian_id or (student.guardian_id if student else None)
    if guardian_id:
        await get_owned(db, Guardian, guardian_id, club, "Parent")
    if not (student or guardian_id or payload.buyer_name):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Choose a kid or parent, or type the buyer's name")
    stock = await stock_by_size(db, club.id)
    if in_stock(stock, size.id) < payload.quantity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Only {in_stock(stock, size.id)} left in size {size.label}")
    today = club_today(club)
    sale = UniformSale(
        club_id=club.id, size_id=size.id, quantity=payload.quantity,
        unit_price=payload.unit_price if payload.unit_price is not None else size_price(size, club),
        method=payload.method, reference=(payload.reference or "").strip() or None,
        sold_on=payload.sold_on or today, student_id=student.id if student else None, guardian_id=guardian_id,
        buyer_name=payload.buyer_name, buyer_phone=payload.buyer_phone, receipt_no=new_receipt_no(today),
        recorded_by_id=user.id,
    )
    db.add(sale)
    await db.flush()
    record_audit(db, user, "uniform_sold", "uniform_sale", sale.id, f"Sold {sale.quantity} x size {size.label}", club_id=club.id)
    await db.commit()
    return await _sale_out(db, sale, await _sizes(db, club))


@router.delete("/sales/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def void_sale(
    sale_id: int,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> None:
    """Undo a sale entered by mistake; the uniform goes back into stock."""
    sale = await get_owned(db, UniformSale, sale_id, club, "Sale")
    record_audit(db, user, "uniform_sale_voided", "uniform_sale", sale.id,
                 f"Undid uniform sale #{sale.id} ({sale.quantity} pcs)", club_id=club.id)
    await db.delete(sale)
    await db.commit()


# ----- Stock counts -----------------------------------------------------------------


@router.post("/adjustments", response_model=SizeOut, status_code=status.HTTP_201_CREATED)
async def adjust(
    payload: AdjustmentCreate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SizeOut:
    size = await get_owned(db, UniformSize, payload.size_id, club, "Size")
    stock = await stock_by_size(db, club.id)
    if in_stock(stock, size.id) + payload.quantity < 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Stock cannot go below zero")
    db.add(UniformAdjustment(club_id=club.id, size_id=size.id, quantity=payload.quantity, reason=payload.reason, recorded_by_id=user.id))
    record_audit(db, user, "stock_adjusted", "uniform_size", size.id, f"Size {size.label}: {payload.quantity:+d} ({payload.reason})", club_id=club.id)
    await db.commit()
    return _size_out(size, club, await stock_by_size(db, club.id))


@router.post("/stock-count", response_model=SizeOut)
async def stock_count(
    payload: StockCount,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SizeOut:
    size = await get_owned(db, UniformSize, payload.size_id, club, "Size")
    stock = await stock_by_size(db, club.id)
    difference = payload.counted - in_stock(stock, size.id)
    if difference:
        db.add(UniformAdjustment(club_id=club.id, size_id=size.id, quantity=difference, reason=payload.reason, recorded_by_id=user.id))
        record_audit(db, user, "stock_counted", "uniform_size", size.id,
                     f"Size {size.label}: counted {payload.counted} ({difference:+d})", club_id=club.id)
        await db.commit()
    return _size_out(size, club, await stock_by_size(db, club.id))
