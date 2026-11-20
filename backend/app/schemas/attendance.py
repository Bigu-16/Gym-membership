from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import AttendanceStatus


class RegisterRow(BaseModel):
    student_id: int
    name: str
    guardian_phone: str
    status: AttendanceStatus | None
    expiry_date: date | None
    days_left: int | None
    expiry_status: str


class RegisterOut(BaseModel):
    date: date
    slot_id: int
    is_class_day: bool
    saved: bool
    rows: list[RegisterRow]


class RegisterSave(BaseModel):
    date: date
    slot_id: int
    present_ids: list[int] = Field(default_factory=list, max_length=500)


class DailyPoint(BaseModel):
    date: date
    slot_id: int | None
    present: int
    absent: int


class StudentAttendance(BaseModel):
    student_id: int
    name: str
    slot_id: int | None
    present: int
    absent: int
    rate: float | None
    last_present: date | None
    absent_streak: int


class AttendanceReport(BaseModel):
    start: date
    end: date
    class_days: int
    present: int
    absent: int
    rate: float | None
    daily: list[DailyPoint]
    by_weekday: dict[int, dict[str, int]]
    by_slot: dict[int, dict[str, int]]
    students: list[StudentAttendance]
