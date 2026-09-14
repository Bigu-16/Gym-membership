from fastapi import APIRouter, Depends
from sqlalchemy import cast, func, select
from sqlalchemy import Date as SQLDate
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db import get_db_session
from app.models import AppUser
from app.models import CheckIn, Member, NotificationJob
from app.models.enums import NotificationStatus
from app.schemas.analytics import AttendancePoint, GrowthPoint, NotificationAnalytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/growth", response_model=list[GrowthPoint])
async def get_growth_analytics(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[GrowthPoint]:
    result = await db.execute(
        select(cast(Member.created_at, SQLDate), func.count(Member.id))
        .group_by(cast(Member.created_at, SQLDate))
        .order_by(cast(Member.created_at, SQLDate))
    )
    return [GrowthPoint(date=row[0], new_members=row[1]) for row in result.all()]


@router.get("/attendance", response_model=list[AttendancePoint])
async def get_attendance_analytics(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[AttendancePoint]:
    result = await db.execute(
        select(cast(CheckIn.check_in_time, SQLDate), func.count(CheckIn.id))
        .group_by(cast(CheckIn.check_in_time, SQLDate))
        .order_by(cast(CheckIn.check_in_time, SQLDate))
    )
    return [AttendancePoint(date=row[0], attendance_count=row[1]) for row in result.all()]


@router.get("/notifications", response_model=NotificationAnalytics)
async def get_notification_analytics(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> NotificationAnalytics:
    by_channel_rows = await db.execute(
        select(NotificationJob.channel, func.count(NotificationJob.id)).group_by(NotificationJob.channel)
    )
    by_channel = {row[0].value: row[1] for row in by_channel_rows.all()}

    by_type_rows = await db.execute(
        select(NotificationJob.notification_type, func.count(NotificationJob.id)).group_by(
            NotificationJob.notification_type
        )
    )
    by_type = {row[0].value: row[1] for row in by_type_rows.all()}

    by_status_rows = await db.execute(
        select(NotificationJob.status, func.count(NotificationJob.id)).group_by(NotificationJob.status)
    )
    by_status = {row[0].value: row[1] for row in by_status_rows.all()}

    pending = by_status.get(NotificationStatus.pending.value, 0)
    processed = by_status.get(NotificationStatus.processed.value, 0)
    failed = by_status.get(NotificationStatus.failed.value, 0)
    total = pending + processed + failed
    finalized = processed + failed
    delivery_rate = round(processed / finalized, 4) if finalized else 0.0

    return NotificationAnalytics(
        total=total,
        pending=pending,
        processed=processed,
        failed=failed,
        delivery_rate=delivery_rate,
        by_channel=by_channel,
        by_type=by_type,
        by_status=by_status,
    )
