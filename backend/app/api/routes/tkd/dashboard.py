from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_club
from app.db import get_db_session
from app.models import Attendance, ClassSlot, Club, FeePayment, Student, UniformSale, UniformSize
from app.models.enums import AttendanceStatus
from app.services.season import club_today, is_class_day, is_summer, slot_runs_on
from app.services.students import student_out
from app.services.uniform_stock import stock_by_size

router = APIRouter(tags=["dashboard"], dependencies=[Depends(get_club)])


async def _money(db: AsyncSession, club: Club, start: date, end: date) -> dict:
    fees = (await db.scalars(select(FeePayment).where(FeePayment.club_id == club.id, FeePayment.paid_on >= start, FeePayment.paid_on <= end))).all()
    sales = (await db.scalars(select(UniformSale).where(UniformSale.club_id == club.id, UniformSale.sold_on >= start, UniformSale.sold_on <= end))).all()
    by_method: dict[str, dict[str, Decimal]] = defaultdict(lambda: {"fees": Decimal("0"), "uniforms": Decimal("0")})
    daily: dict[date, dict[str, Decimal]] = defaultdict(lambda: {"fees": Decimal("0"), "uniforms": Decimal("0")})
    for f in fees:
        by_method[f.method.value]["fees"] += f.amount
        daily[f.paid_on]["fees"] += f.amount
    for s in sales:
        total = s.unit_price * s.quantity
        by_method[s.method.value]["uniforms"] += total
        daily[s.sold_on]["uniforms"] += total
    fee_total = sum((f.amount for f in fees), Decimal("0"))
    uniform_total = sum((s.unit_price * s.quantity for s in sales), Decimal("0"))
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "currency": club.currency,
        "fees": str(fee_total),
        "uniforms": str(uniform_total),
        "total": str(fee_total + uniform_total),
        "fee_payments": len(fees),
        "uniforms_sold": sum(s.quantity for s in sales),
        "by_method": {m: {k: str(v) for k, v in vals.items()} for m, vals in by_method.items()},
        "daily": [{"date": d.isoformat(), **{k: str(v) for k, v in vals.items()}} for d, vals in sorted(daily.items())],
    }


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db_session), club: Club = Depends(get_club)) -> dict:
    today = club_today(club)
    slots = {s.id: s for s in (await db.scalars(select(ClassSlot).where(ClassSlot.club_id == club.id).order_by(ClassSlot.start_time))).all()}
    students = (await db.scalars(
        select(Student).where(Student.club_id == club.id, Student.is_active.is_(True)).options(selectinload(Student.guardian))
    )).all()
    outs = [student_out(s, club, today, slots) for s in students]
    counts = defaultdict(int)
    for o in outs:
        counts[o.status] += 1

    marks_today = (await db.scalars(select(Attendance).where(Attendance.club_id == club.id, Attendance.class_date == today))).all()
    today_slots = []
    for slot in slots.values():
        if not slot_runs_on(club, slot, today):
            continue
        roster = [o for o in outs if o.slot_id == slot.id and o.joined_on <= today]
        slot_marks = [m for m in marks_today if m.slot_id == slot.id]
        today_slots.append({
            "slot_id": slot.id,
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "expected": len(roster),
            "present": sum(1 for m in slot_marks if m.status == AttendanceStatus.present),
            "saved": bool(slot_marks),
        })

    # Next class day, so the desk knows when the next session is on a non-class day.
    next_day = today
    for _ in range(14):
        next_day += timedelta(days=1)
        if is_class_day(club, next_day):
            break

    attention = sorted(
        (o for o in outs if o.status in {"critical", "expiring", "expired", "unpaid"}),
        key=lambda o: (o.days_left if o.days_left is not None else -9999),
    )

    stock = await stock_by_size(db, club.id)
    sizes = (await db.scalars(select(UniformSize).where(UniformSize.club_id == club.id, UniformSize.is_active.is_(True)).order_by(UniformSize.sort_order))).all()
    low_stock = [
        {"size_id": s.id, "label": s.label, "in_stock": stock.get(s.id, {}).get("in_stock", 0), "pending": stock.get(s.id, {}).get("pending", 0)}
        for s in sizes
        if stock.get(s.id, {}).get("in_stock", 0) <= club.low_stock_threshold
    ]

    month_start = today.replace(day=1)
    four_weeks = (await db.scalars(
        select(Attendance.status).where(Attendance.club_id == club.id, Attendance.class_date >= today - timedelta(days=27), Attendance.class_date <= today)
    )).all()
    present_4w = sum(1 for s in four_weeks if s == AttendanceStatus.present)

    setup = []
    if club.monthly_fee == 0:
        setup.append("monthly_fee")
    if club.uniform_price == 0 and all(s.price is None for s in sizes):
        setup.append("uniform_price")
    if not slots:
        setup.append("slots")

    return {
        "today": today.isoformat(),
        "season": "summer" if is_summer(club, today) else "term",
        "is_class_day": is_class_day(club, today),
        "next_class_day": next_day.isoformat(),
        "today_slots": today_slots,
        "counts": {
            "active": len(outs),
            "paid": counts["active"],
            "expiring": counts["expiring"] + counts["critical"],
            "critical": counts["critical"],
            "expired": counts["expired"],
            "unpaid": counts["unpaid"],
        },
        "attention": [a.model_dump(mode="json") for a in attention[:25]],
        "low_stock": low_stock,
        "attendance_rate_4w": round(present_4w / len(four_weeks), 3) if four_weeks else None,
        "money_month": await _money(db, club, month_start, today),
        "setup_needed": setup,
    }


@router.get("/reports/money")
async def money_report(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> dict:
    today = club_today(club)
    end = end or today
    start = start or end.replace(day=1)
    if start > end or (end - start).days > 400:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Choose a valid range of at most about a year")
    return await _money(db, club, start, end)
