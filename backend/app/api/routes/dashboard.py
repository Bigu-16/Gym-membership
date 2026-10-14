from datetime import UTC, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.timeutils import gym_day_bounds_utc, gym_today
from app.db import get_db_session
from app.models import AppUser
from app.models import CheckIn, Member, ScheduleTemplate, Session
from app.schemas.dashboard import ActiveMemberResponse, DashboardStatsResponse, RecentActivityResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# A visit nobody checked out of is closed after this long (and never past the day's end).
STALE_VISIT_LENGTH = timedelta(hours=2)


async def close_stale_check_ins(db: AsyncSession) -> None:
    """Close visits left open from previous gym days so 'in club' does not grow forever."""
    day_start, _ = gym_day_bounds_utc(gym_today())
    result = await db.scalars(
        select(CheckIn).where(CheckIn.check_out_time.is_(None), CheckIn.check_in_time < day_start)
    )
    stale = result.all()
    for check_in in stale:
        started = check_in.check_in_time
        if started.tzinfo is None:
            started = started.replace(tzinfo=UTC)
        check_in.check_out_time = min(started + STALE_VISIT_LENGTH, day_start)
    if stale:
        await db.commit()


async def count_classes_today(db: AsyncSession) -> int:
    today = gym_today()
    weekday = today.strftime("%A").lower()
    templates = (await db.scalars(select(ScheduleTemplate))).all()
    group_classes = sum(1 for template in templates if weekday in {day.lower() for day in template.days})
    personal_sessions = await db.scalar(
        select(func.count(Session.id)).where(Session.date == today, Session.template_id.is_(None))
    )
    return group_classes + (personal_sessions or 0)


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> DashboardStatsResponse:
    await close_stale_check_ins(db)
    day_start, day_end = gym_day_bounds_utc(gym_today())

    total_members = await db.scalar(select(func.count(Member.id)))
    active_members = await db.scalar(select(func.count(CheckIn.id)).where(CheckIn.check_out_time.is_(None)))
    recent_activities = await db.scalar(
        select(func.count(CheckIn.id)).where(CheckIn.check_in_time >= day_start, CheckIn.check_in_time < day_end)
    )

    return DashboardStatsResponse(
        total_members=total_members or 0,
        active_members=active_members or 0,
        today_sessions=await count_classes_today(db),
        recent_activities=recent_activities or 0,
    )


@router.get("/active-members", response_model=list[ActiveMemberResponse])
async def get_active_members(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[ActiveMemberResponse]:
    await close_stale_check_ins(db)
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
            phone=member.phone or member.parent_phone,
            check_in_time=check_in.check_in_time,
        )
        for check_in, member in result.all()
    ]


@router.get("/recent-activities", response_model=list[RecentActivityResponse])
async def get_recent_activities(
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[RecentActivityResponse]:
    result = await db.execute(
        select(CheckIn, Member)
        .join(Member, Member.id == CheckIn.member_id)
        .order_by(func.coalesce(CheckIn.check_out_time, CheckIn.check_in_time).desc())
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
