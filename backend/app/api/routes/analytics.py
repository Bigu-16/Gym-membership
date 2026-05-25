from fastapi import APIRouter, Depends
from sqlalchemy import cast, func, select
from sqlalchemy import Date as SQLDate
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.models import CheckIn, Member
from app.schemas.analytics import AttendancePoint, GrowthPoint

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/growth", response_model=list[GrowthPoint])
async def get_growth_analytics(db: AsyncSession = Depends(get_db_session)) -> list[GrowthPoint]:
    result = await db.execute(
        select(cast(Member.created_at, SQLDate), func.count(Member.id))
        .group_by(cast(Member.created_at, SQLDate))
        .order_by(cast(Member.created_at, SQLDate))
    )
    return [GrowthPoint(date=row[0], new_members=row[1]) for row in result.all()]


@router.get("/attendance", response_model=list[AttendancePoint])
async def get_attendance_analytics(db: AsyncSession = Depends(get_db_session)) -> list[AttendancePoint]:
    result = await db.execute(
        select(cast(CheckIn.check_in_time, SQLDate), func.count(CheckIn.id))
        .group_by(cast(CheckIn.check_in_time, SQLDate))
        .order_by(cast(CheckIn.check_in_time, SQLDate))
    )
    return [AttendancePoint(date=row[0], attendance_count=row[1]) for row in result.all()]
