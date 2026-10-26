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


class LabelValue(BaseModel):
    label: str
    value: float


class MonthValue(BaseModel):
    month: str  # YYYY-MM
    value: float


class ClassFill(BaseModel):
    template_id: int
    title: str
    days: list[str]
    time: str
    capacity: int | None
    enrolled: int


class HeatCell(BaseModel):
    weekday: int  # 0 = Monday
    hour: int  # gym-local hour
    count: int


class MembershipTotals(BaseModel):
    total: int
    active: int
    expired: int
    frozen: int
    expiring_7_days: int
    no_package: int
    families: int


class AnalyticsSummary(BaseModel):
    generated_on: date
    currency: str
    totals: MembershipTotals
    revenue_this_month: float
    revenue_last_month: float
    revenue_by_month: list[MonthValue]
    revenue_by_program: list[LabelValue]
    revenue_by_method: list[LabelValue]
    new_members_by_month: list[MonthValue]
    members_by_program: list[LabelValue]
    members_by_plan: list[LabelValue]
    age_groups: list[LabelValue]
    gender_split: list[LabelValue]
    check_ins_last_30_days: int
    check_ins_by_day: list[AttendancePoint]
    attendance_heatmap: list[HeatCell]
    class_fill: list[ClassFill]
    renewals_last_90_days: int
    expired_unrenewed_last_90_days: int
    renewal_rate: float | None
