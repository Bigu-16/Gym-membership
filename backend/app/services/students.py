from datetime import date

from app.models import ClassSlot, Club, Student
from app.schemas.people import StudentOut
from app.services.season import class_dates


def expiry_status(club: Club, expiry: date | None, today: date, is_active: bool = True) -> tuple[str, int | None]:
    if not is_active:
        return "inactive", None
    if expiry is None:
        return "unpaid", None
    days_left = (expiry - today).days
    if days_left < 0:
        return "expired", days_left
    if days_left <= club.critical_days:
        return "critical", days_left
    if days_left <= club.expiring_days:
        return "expiring", days_left
    return "active", days_left


def student_out(student: Student, club: Club, today: date, slots: dict[int, ClassSlot]) -> StudentOut:
    status, days_left = expiry_status(club, student.expiry_date, today, student.is_active)
    classes_left = None
    slot = slots.get(student.slot_id) if student.slot_id else None
    if student.is_active and student.expiry_date is not None and student.expiry_date >= today and slot is not None:
        classes_left = len(class_dates(club, slot, today, student.expiry_date))
    guardian = student.guardian
    return StudentOut(
        id=student.id,
        name=student.name,
        age=student.age,
        uniform_size=student.uniform_size,
        slot_id=student.slot_id,
        guardian_id=student.guardian_id,
        guardian_name=guardian.name if guardian else "",
        guardian_phone=guardian.phone if guardian else "",
        joined_on=student.joined_on,
        expiry_date=student.expiry_date,
        days_left=days_left,
        classes_left=classes_left,
        status=status,
        is_active=student.is_active,
        notes=student.notes,
    )
