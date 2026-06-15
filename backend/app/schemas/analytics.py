from datetime import date

from pydantic import BaseModel


class GrowthPoint(BaseModel):
    date: date
    new_members: int


class AttendancePoint(BaseModel):
    date: date
    attendance_count: int
