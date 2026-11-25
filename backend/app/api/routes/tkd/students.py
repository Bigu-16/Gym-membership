from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_club, get_current_user, get_owned
from app.db import get_db_session
from app.models import AppUser, Attendance, ClassSlot, Club, FeePayment, Guardian, Student, UniformSale, UniformSize
from app.models.enums import AttendanceStatus
from app.schemas.common import normalize_et_phone
from app.schemas.people import (
    EnrolmentIn,
    EnrolmentOut,
    FeePaymentOut,
    GuardianOut,
    GuardianUpdate,
    PaymentIn,
    RenewalIn,
    StudentOut,
    StudentUpdate,
    UniformSaleBrief,
)
from app.services.audit import record_audit
from app.services.fees import coverage_for, money, new_receipt_no
from app.services.season import club_today
from app.services.students import student_out
from app.services.uniform_stock import in_stock, size_price, stock_by_size

router = APIRouter(tags=["students"], dependencies=[Depends(get_club)])


async def _slots(db: AsyncSession, club: Club) -> dict[int, ClassSlot]:
    rows = await db.scalars(select(ClassSlot).where(ClassSlot.club_id == club.id))
    return {s.id: s for s in rows.all()}


async def _guardian_out(db: AsyncSession, guardian_id: int, club: Club) -> GuardianOut:
    guardian = await db.scalar(
        select(Guardian)
        .where(Guardian.id == guardian_id, Guardian.club_id == club.id)
        .options(selectinload(Guardian.students).selectinload(Student.guardian))
    )
    if guardian is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    slots = await _slots(db, club)
    today = club_today(club)
    return GuardianOut(
        id=guardian.id,
        name=guardian.name,
        phone=guardian.phone,
        phone_alt=guardian.phone_alt,
        notes=guardian.notes,
        students=[student_out(s, club, today, slots) for s in guardian.students],
    )


def _check_slot(slot_id: int | None, slots: dict[int, ClassSlot]) -> None:
    if slot_id is not None and slot_id not in slots:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Choose one of this branch's classes")


async def _take_payments(
    db: AsyncSession,
    club: Club,
    user: AppUser,
    students_amounts: list[tuple[Student, Decimal | None]],
    payment: PaymentIn,
    receipt_no: str,
    today: date,
    start: date | None = None,
) -> list[FeePayment]:
    paid_on = payment.paid_on or today
    rows: list[FeePayment] = []
    for student, amount in students_amounts:
        period_start, period_end = coverage_for(student, payment.months, today, start)
        fee = money(amount if amount is not None else club.monthly_fee * payment.months)
        row = FeePayment(
            club_id=club.id,
            student_id=student.id,
            guardian_id=student.guardian_id,
            receipt_no=receipt_no,
            amount=fee,
            method=payment.method,
            reference=payment.reference,
            months=payment.months,
            paid_on=paid_on,
            period_start=period_start,
            period_end=period_end,
            note=payment.note,
            recorded_by_id=user.id,
        )
        db.add(row)
        student.expiry_date = period_end
        rows.append(row)
    return rows


# ----- Parents ----------------------------------------------------------------------


@router.get("/guardians", response_model=list[GuardianOut])
async def list_guardians(
    search: str | None = Query(default=None, max_length=80),
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> list[GuardianOut]:
    stmt = (
        select(Guardian)
        .where(Guardian.club_id == club.id)
        .options(selectinload(Guardian.students).selectinload(Student.guardian))
        .order_by(Guardian.name)
        .limit(500)
    )
    if search and search.strip():
        term = search.strip()
        digits = "".join(ch for ch in term if ch.isdigit())
        conditions = [Guardian.name.ilike(f"%{term}%")]
        if len(digits) >= 3:
            # 0911..., 911..., +251911... all match the stored +251911...
            conditions.append(Guardian.phone.contains(digits.lstrip("0")))
        kid_match = select(Student.guardian_id).where(Student.club_id == club.id, Student.name.ilike(f"%{term}%"))
        conditions.append(Guardian.id.in_(kid_match))
        stmt = stmt.where(or_(*conditions))
    rows = (await db.scalars(stmt)).all()
    slots = await _slots(db, club)
    today = club_today(club)
    return [
        GuardianOut(
            id=g.id, name=g.name, phone=g.phone, phone_alt=g.phone_alt, notes=g.notes,
            students=[student_out(s, club, today, slots) for s in g.students],
        )
        for g in rows
    ]


@router.get("/guardians/by-phone", response_model=GuardianOut | None)
async def guardian_by_phone(
    phone: str = Query(max_length=30),
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> GuardianOut | None:
    try:
        normalized = normalize_et_phone(phone)
    except ValueError:
        return None
    guardian_id = await db.scalar(select(Guardian.id).where(Guardian.club_id == club.id, Guardian.phone == normalized))
    return await _guardian_out(db, guardian_id, club) if guardian_id else None


@router.get("/guardians/{guardian_id}", response_model=GuardianOut)
async def get_guardian(guardian_id: int, db: AsyncSession = Depends(get_db_session), club: Club = Depends(get_club)) -> GuardianOut:
    return await _guardian_out(db, guardian_id, club)


@router.patch("/guardians/{guardian_id}", response_model=GuardianOut)
async def update_guardian(
    guardian_id: int,
    payload: GuardianUpdate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> GuardianOut:
    guardian = await get_owned(db, Guardian, guardian_id, club, "Parent")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if not (k in {"name", "phone"} and v is None)}
    if "phone" in updates and updates["phone"] != guardian.phone:
        clash = await db.scalar(select(Guardian.id).where(Guardian.club_id == club.id, Guardian.phone == updates["phone"], Guardian.id != guardian.id))
        if clash:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Another parent already uses this phone number")
    for field, value in updates.items():
        setattr(guardian, field, value)
    record_audit(db, user, "parent_updated", "guardian", guardian.id, f"Updated parent {guardian.name}", {"fields": sorted(updates)}, club_id=club.id)
    await db.commit()
    return await _guardian_out(db, guardian.id, club)


# ----- Kids -------------------------------------------------------------------------


@router.get("/students", response_model=list[StudentOut])
async def list_students(
    search: str | None = Query(default=None, max_length=80),
    slot_id: int | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> list[StudentOut]:
    stmt = select(Student).where(Student.club_id == club.id).options(selectinload(Student.guardian)).order_by(Student.name)
    if not include_inactive:
        stmt = stmt.where(Student.is_active.is_(True))
    if slot_id is not None:
        stmt = stmt.where(Student.slot_id == slot_id)
    if search and search.strip():
        term = search.strip()
        digits = "".join(ch for ch in term if ch.isdigit()).lstrip("0")
        conditions = [Student.name.ilike(f"%{term}%"), Guardian.name.ilike(f"%{term}%")]
        if len(digits) >= 3:
            conditions.append(Guardian.phone.contains(digits))
        stmt = stmt.join(Guardian, Guardian.id == Student.guardian_id).where(or_(*conditions))
    rows = (await db.scalars(stmt)).all()
    slots = await _slots(db, club)
    today = club_today(club)
    result = [student_out(s, club, today, slots) for s in rows]
    if status_filter:
        wanted = set(status_filter.split(","))
        result = [s for s in result if s.status in wanted]
    return result


@router.get("/students/{student_id}")
async def get_student(student_id: int, db: AsyncSession = Depends(get_db_session), club: Club = Depends(get_club)) -> dict:
    student = await db.scalar(
        select(Student).where(Student.id == student_id, Student.club_id == club.id).options(selectinload(Student.guardian))
    )
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kid not found")
    slots = await _slots(db, club)
    today = club_today(club)
    payments = (await db.scalars(
        select(FeePayment).where(FeePayment.student_id == student.id, FeePayment.club_id == club.id).order_by(FeePayment.paid_on.desc(), FeePayment.id.desc())
    )).all()
    sales = (await db.execute(
        select(UniformSale, UniformSize.label)
        .join(UniformSize, UniformSize.id == UniformSale.size_id)
        .where(UniformSale.student_id == student.id, UniformSale.club_id == club.id)
        .order_by(UniformSale.sold_on.desc())
    )).all()
    marks = (await db.scalars(
        select(Attendance).where(Attendance.student_id == student.id, Attendance.club_id == club.id).order_by(Attendance.class_date.desc()).limit(60)
    )).all()
    present = sum(1 for m in marks if m.status == AttendanceStatus.present)
    return {
        "student": student_out(student, club, today, slots).model_dump(mode="json"),
        "payments": [FeePaymentOut.model_validate(p).model_dump(mode="json") for p in payments],
        "uniform_sales": [
            {"id": sale.id, "size": label, "quantity": sale.quantity, "total": str(sale.unit_price * sale.quantity),
             "method": sale.method.value, "sold_on": sale.sold_on.isoformat()}
            for sale, label in sales
        ],
        "attendance": [{"date": m.class_date.isoformat(), "status": m.status.value} for m in marks],
        "attendance_rate": round(present / len(marks), 3) if marks else None,
    }


@router.patch("/students/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> StudentOut:
    student = await get_owned(db, Student, student_id, club, "Kid")
    slots = await _slots(db, club)
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("name", "") is None:
        updates.pop("name")
    if "slot_id" in updates:
        _check_slot(updates["slot_id"], slots)
    if "uniform_size" in updates and updates["uniform_size"] is not None:
        updates["uniform_size"] = updates["uniform_size"].strip() or None
    for field, value in updates.items():
        setattr(student, field, value)
    record_audit(db, user, "kid_updated", "student", student.id, f"Updated {student.name}", {"fields": sorted(updates)}, club_id=club.id)
    await db.commit()
    student = await db.scalar(select(Student).where(Student.id == student.id).options(selectinload(Student.guardian)))
    return student_out(student, club, club_today(club), slots)


# ----- Enrolment & fees -------------------------------------------------------------


@router.post("/enrolments", response_model=EnrolmentOut, status_code=status.HTTP_201_CREATED)
async def enrol(
    payload: EnrolmentIn,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> EnrolmentOut:
    today = club_today(club)
    slots = await _slots(db, club)
    for item in payload.students:
        _check_slot(item.slot_id, slots)

    if payload.guardian_id is not None:
        guardian = await get_owned(db, Guardian, payload.guardian_id, club, "Parent")
    else:
        existing = await db.scalar(select(Guardian).where(Guardian.club_id == club.id, Guardian.phone == payload.guardian.phone))
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "parent_exists", "guardian_id": existing.id, "name": existing.name,
                        "message": f"This phone number already belongs to {existing.name}. Add the kids to that family instead."},
            )
        guardian = Guardian(club_id=club.id, **payload.guardian.model_dump())
        db.add(guardian)
        await db.flush()

    # Uniform sales need stock and a known size.
    sizes = {s.label: s for s in (await db.scalars(select(UniformSize).where(UniformSize.club_id == club.id))).all()}
    wanted: dict[int, int] = {}
    for item in payload.students:
        if item.buy_uniform:
            size = sizes.get((item.uniform_size or "").strip())
            if size is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"Pick a uniform size for {item.name} to sell a uniform")
            wanted[size.id] = wanted.get(size.id, 0) + 1
    if wanted:
        stock = await stock_by_size(db, club.id)
        short = [label for label, s in sizes.items() if s.id in wanted and in_stock(stock, s.id) < wanted[s.id]]
        if short:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Not enough uniforms in stock for size {', '.join(sorted(short))}. Untick the uniform, or record the stock first.",
            )

    start = payload.start_date or today
    created: list[tuple[Student, object]] = []
    for item in payload.students:
        student = Student(
            club_id=club.id,
            guardian_id=guardian.id,
            slot_id=item.slot_id,
            name=item.name,
            age=item.age,
            uniform_size=(item.uniform_size or "").strip() or None,
            joined_on=start,
            notes=item.notes,
            is_active=True,
        )
        db.add(student)
        created.append((student, item))
    await db.flush()

    receipt_no = new_receipt_no(today)
    payments = await _take_payments(db, club, user, [(s, i.amount) for s, i in created], payload.payment, receipt_no, today, start)

    sales: list[UniformSaleBrief] = []
    for student, item in created:
        if item.buy_uniform:
            size = sizes[student.uniform_size]
            sale = UniformSale(
                club_id=club.id, size_id=size.id, quantity=1, unit_price=size_price(size, club),
                method=payload.payment.method, reference=payload.payment.reference,
                sold_on=payload.payment.paid_on or today, student_id=student.id, guardian_id=guardian.id,
                receipt_no=receipt_no, recorded_by_id=user.id,
            )
            db.add(sale)
            await db.flush()
            sales.append(UniformSaleBrief(id=sale.id, size=size.label, quantity=1, total=sale.unit_price))

    names = ", ".join(s.name for s, _ in created)
    record_audit(db, user, "enrolled", "guardian", guardian.id, f"Enrolled {names} (parent {guardian.name})", {"receipt": receipt_no}, club_id=club.id)
    await db.commit()

    warnings = []
    if club.monthly_fee == 0 and any(i.amount is None for _, i in created):
        warnings.append("monthly_fee_not_set")
    total = sum((p.amount for p in payments), Decimal("0")) + sum((s.total for s in sales), Decimal("0"))
    return EnrolmentOut(
        guardian=await _guardian_out(db, guardian.id, club),
        receipt_no=receipt_no,
        payments=[FeePaymentOut.model_validate(p) for p in payments],
        uniform_sales=sales,
        total=total,
        warnings=warnings,
    )


@router.post("/fees/renew", response_model=list[FeePaymentOut], status_code=status.HTTP_201_CREATED)
async def renew(
    payload: RenewalIn,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> list[FeePaymentOut]:
    today = club_today(club)
    ids = [i.student_id for i in payload.items]
    if len(set(ids)) != len(ids):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Each kid can appear once")
    students = {s.id: s for s in (await db.scalars(select(Student).where(Student.id.in_(ids), Student.club_id == club.id))).all()}
    if len(students) != len(ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kid not found")
    for s in students.values():
        s.is_active = True  # paying again brings a kid who left back
    receipt_no = new_receipt_no(today)
    rows = await _take_payments(db, club, user, [(students[i.student_id], i.amount) for i in payload.items], payload.payment, receipt_no, today)
    record_audit(db, user, "fee_paid", "fee", receipt_no,
                 f"Fee for {', '.join(s.name for s in students.values())}: {payload.payment.months} month(s)", club_id=club.id)
    await db.commit()
    return [FeePaymentOut.model_validate(r) for r in rows]


@router.get("/fees", response_model=list[FeePaymentOut])
async def list_fees(
    start: date | None = None,
    end: date | None = None,
    guardian_id: int | None = None,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> list[FeePaymentOut]:
    today = club_today(club)
    start = start or today - timedelta(days=30)
    end = end or today
    stmt = (
        select(FeePayment)
        .where(FeePayment.club_id == club.id, FeePayment.paid_on >= start, FeePayment.paid_on <= end)
        .order_by(FeePayment.paid_on.desc(), FeePayment.id.desc())
        .limit(2000)
    )
    if guardian_id is not None:
        stmt = stmt.where(FeePayment.guardian_id == guardian_id)
    return [FeePaymentOut.model_validate(p) for p in (await db.scalars(stmt)).all()]


@router.delete("/fees/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def void_fee(
    payment_id: int,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> None:
    """Undo a payment entered by mistake. Only the kid's latest payment can be undone."""
    payment = await get_owned(db, FeePayment, payment_id, club, "Payment")
    latest = await db.scalar(
        select(FeePayment.id).where(FeePayment.student_id == payment.student_id).order_by(FeePayment.period_end.desc(), FeePayment.id.desc()).limit(1)
    )
    if latest != payment.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only the most recent payment for this kid can be undone")
    student = await db.get(Student, payment.student_id)
    previous_end = await db.scalar(
        select(func.max(FeePayment.period_end)).where(FeePayment.student_id == payment.student_id, FeePayment.id != payment.id)
    )
    student.expiry_date = previous_end
    record_audit(db, user, "fee_voided", "fee", payment.id,
                 f"Undid payment {payment.receipt_no} for {student.name} ({payment.amount} {club.currency})", club_id=club.id)
    await db.delete(payment)
    await db.commit()
