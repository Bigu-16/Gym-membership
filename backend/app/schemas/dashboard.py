from datetime import datetime

from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    total_members: int
    active_members: int
    today_sessions: int
    recent_activities: int


class ActiveMemberResponse(BaseModel):
    member_id: int
    member_name: str
    phone: str
    check_in_time: datetime


class RecentActivityResponse(BaseModel):
    check_in_id: int
    member_id: int
    member_name: str
    action: str
    timestamp: datetime
