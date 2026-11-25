from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_club, get_current_user, get_owned
from app.db import get_db_session
from app.models import AppUser, Attendance, ClassSlot, Club, Student
from app.models.enums import AttendanceStatus
from app.schemas.attendance import AttendanceReport, DailyPoint, RegisterOut, RegisterRow, RegisterSave, StudentAttendance
from app.services.audit import record_audit
from app.services.season import club_today, slot_runs_on
from app.services.students import expiry_status

router = APIRouter(tags=["attendance"], dependencies=[Depends(get_club)])


async def _roster(db: AsyncSession, club: Club, slot_id: int, day: date) -> list[Student]:
    rows = await db.scalars(
        select(Student)
        .where(Student.club_id == club.id, Student.slot_id == slot_id, Student.is_active.is_(True), Student.joined_on <= day)
        .options(selectinload(Student.guardian))
        .order_by(Student.name)
    )
    return list(rows.all())


@router.get("/attendance/register", response_model=RegisterOut)
async def get_register(
    day: date,
    slot_id: int,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> RegisterOut:
    slot = await get_owned(db, ClassSlot, slot_id, club, "Class")
    roster = await _roster(db, club, slot.id, day)
    marks = {
        m.student_id: m
        for m in (await db.scalars(select(Attendance).where(Attendance.club_id == club.id, Attendance.class_date == day))).all()
    }
    # Kids who were marked in this class but have since moved or left still show, so history stays visible.
    extra_ids = [sid for sid, m in marks.items() if m.slot_id == slot.id and sid not in {s.id for s in roster}]
    if extra_ids:
        roster += list((await db.scalars(select(Student).where(Student.id.in_(extra_ids)).options(selectinload(Student.guardian)))).all())
    today = club_today(club)
    rows = []
    for student in roster:
        exp_status, days_left = expiry_status(club, student.expiry_date, today, True)
        mark = marks.get(student.id)
        rows.append(RegisterRow(
            student_id=student.id, name=student.name, guardian_phone=student.guardian.phone,
            status=mark.status if mark else None, expiry_date=student.expiry_date, days_left=days_left, expiry_status=exp_status,
        ))
    return RegisterOut(
        date=day, slot_id=slot.id, is_class_day=slot_runs_on(club, slot, day),
        saved=any(m.slot_id == slot.id for m in marks.values()), rows=rows,
    )


@router.put("/attendance/register", response_model=RegisterOut)
async def save_register(
    payload: RegisterSave,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> RegisterOut:
    slot = await get_owned(db, ClassSlot, payload.slot_id, club, "Class")
    if payload.date > club_today(club):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Attendance cannot be taken for a future day")
    roster = await _roster(db, club, slot.id, payload.date)
    roster_ids = {s.id for s in roster}
    present = set(payload.present_ids)
    if not present <= roster_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Some kids are not in this class")
    existing = {
        m.student_id: m
        for m in (await db.scalars(
            select(Attendance).where(Attendance.club_id == club.id, Attendance.class_date == payload.date, Attendance.student_id.in_(roster_ids))
        )).all()
    } if roster_ids else {}
    for student in roster:
        mark_status = AttendanceStatus.present if student.id in present else AttendanceStatus.absent
        mark = existing.get(student.id)
        if mark is None:
            db.add(Attendance(club_id=club.id, student_id=student.id, slot_id=slot.id, class_date=payload.date,
                              status=mark_status, recorded_by_id=user.id))
        else:
            mark.status, mark.slot_id, mark.recorded_by_id = mark_status, slot.id, user.id
    record_audit(db, user, "attendance_saved", "slot", slot.id,
                 f"Attendance {payload.date} {slot.start_time:%H:%M}: {len(present)}/{len(roster)} present", club_id=club.id)
    await db.commit()
    return await get_register(payload.date, slot.id, db, club)


@router.get("/reports/attendance", response_model=AttendanceReport)
async def attendance_report(
    start: date | None = None,
    end: date | None = None,
    slot_id: int | None = None,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
) -> AttendanceReport:
    today = club_today(club)
    end = end or today
    start = start or end - timedelta(days=29)
    if start > end:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Start date must be before end date")
    if (end - start).days > 400:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Choose a range of at most about a year")
    stmt = select(Attendance).where(Attendance.club_id == club.id, Attendance.class_date >= start, Attendance.class_date <= end)
    if slot_id is not None:
        stmt = stmt.where(Attendance.slot_id == slot_id)
    marks = (await db.scalars(stmt.order_by(Attendance.class_date))).all()

    daily: dict[tuple[date, int | None], dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
    by_weekday: dict[int, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
    by_slot: dict[int, dict[str, int]] = defaultdict(lambda: {"present": 0, "absent": 0})
    per_student: dict[int, list[Attendance]] = defaultdict(list)
    for m in marks:
        key = m.status.value
        daily[(m.class_date, m.slot_id)][key] += 1
        by_weekday[m.class_date.weekday()][key] += 1
        if m.slot_id is not None:
            by_slot[m.slot_id][key] += 1
        per_student[m.student_id].append(m)

    student_stmt = select(Student).where(Student.club_id == club.id)
    if slot_id is not None:
        student_stmt = student_stmt.where(Student.slot_id == slot_id)
    students = {s.id: s for s in (await db.scalars(student_stmt)).all()}
    rows: list[StudentAttendance] = []
    for sid, student in students.items():
        history = per_student.get(sid, [])
        if not history and not student.is_active:
            continue
        present = sum(1 for m in history if m.status == AttendanceStatus.present)
        absent = len(history) - present
        streak = 0
        for m in sorted(history, key=lambda m: m.class_date, reverse=True):
            if m.status == AttendanceStatus.absent:
                streak += 1
            else:
                break
        last_present = max((m.class_date for m in history if m.status == AttendanceStatus.present), default=None)
        rows.append(StudentAttendance(
            student_id=sid, name=student.name, slot_id=student.slot_id, present=present, absent=absent,
            rate=round(present / len(history), 3) if history else None, last_present=last_present, absent_streak=streak,
        ))
    rows.sort(key=lambda r: (r.rate if r.rate is not None else 2, r.name))

    total_present = sum(1 for m in marks if m.status == AttendanceStatus.present)
    return AttendanceReport(
        start=start, end=end,
        class_days=len({m.class_date for m in marks}),
        present=total_present, absent=len(marks) - total_present,
        rate=round(total_present / len(marks), 3) if marks else None,
        daily=[DailyPoint(date=d, slot_id=s, **v) for (d, s), v in sorted(daily.items(), key=lambda kv: (kv[0][0], kv[0][1] or 0))],
        by_weekday=dict(by_weekday), by_slot=dict(by_slot), students=rows,
    )
