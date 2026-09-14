from datetime import date

from pydantic import BaseModel


class GrowthPoint(BaseModel):
    date: date
    new_members: int


class AttendancePoint(BaseModel):
    date: date
    attendance_count: int


class NotificationAnalytics(BaseModel):
    total: int
    pending: int
    processed: int
    failed: int
    delivery_rate: float  # processed / (processed + failed), as a 0-1 fraction
    by_channel: dict[str, int]
    by_type: dict[str, int]
    by_status: dict[str, int]
