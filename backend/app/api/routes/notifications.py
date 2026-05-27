from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user
from app.db import get_db_session
from app.models import AppUser, NotificationJob
from app.schemas.notification import NotificationJobResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/jobs", response_model=list[NotificationJobResponse])
async def list_notification_jobs(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> list[NotificationJobResponse]:
    result = await db.scalars(select(NotificationJob).order_by(NotificationJob.created_at.desc()))
    return [NotificationJobResponse.model_validate(item) for item in result.all()]
