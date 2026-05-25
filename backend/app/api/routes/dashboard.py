from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.models import CheckIn, Member, Session
from app.schemas.dashboard import ActiveMemberResponse, DashboardStatsResponse, RecentActivityResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db_session)) -> DashboardStatsResponse:
    today = date.today()

    total_members = await db.scalar(select(func.count(Member.id)))
    active_members = await db.scalar(
        select(func.count(CheckIn.id)).where(CheckIn.check_out_time.is_(None))
    )
    today_sessions = await db.scalar(select(func.count(Session.id)).where(Session.date == today))
    recent_activities = await db.scalar(
        select(func.count(CheckIn.id)).where(func.date(CheckIn.check_in_time) == today)
    )

    return DashboardStatsResponse(
        total_members=total_members or 0,
        active_members=active_members or 0,
        today_sessions=today_sessions or 0,
        recent_activities=recent_activities or 0,
    )


@router.get("/active-members", response_model=list[ActiveMemberResponse])
async def get_active_members(db: AsyncSession = Depends(get_db_session)) -> list[ActiveMemberResponse]:
    result = await db.execute(
        select(CheckIn, Member)
        .join(Member, Member.id == CheckIn.member_id)
        .where(CheckIn.check_out_time.is_(None))
        .order_by(CheckIn.check_in_time.desc())
    )
    return [
        ActiveMemberResponse(
            member_id=member.id,
            member_name=member.name,
            phone=member.phone,
            check_in_time=check_in.check_in_time,
        )
        for check_in, member in result.all()
    ]


@router.get("/recent-activities", response_model=list[RecentActivityResponse])
async def get_recent_activities(
    limit: int = 10,
    db: AsyncSession = Depends(get_db_session),
) -> list[RecentActivityResponse]:
    result = await db.execute(
        select(CheckIn, Member)
        .join(Member, Member.id == CheckIn.member_id)
        .order_by(CheckIn.check_in_time.desc())
        .limit(limit)
    )
    return [
        RecentActivityResponse(
            check_in_id=check_in.id,
            member_id=member.id,
            member_name=member.name,
            action="check_in" if check_in.check_out_time is None else "check_out",
            timestamp=check_in.check_out_time or check_in.check_in_time,
        )
        for check_in, member in result.all()
    ]
