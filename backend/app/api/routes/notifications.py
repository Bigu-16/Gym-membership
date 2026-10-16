from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user, get_current_user
from app.db import get_db_session
from app.models import Announcement, AppUser, NotificationJob
from app.models.enums import NotificationChannel, NotificationStatus, NotificationType
from app.schemas.notification import (
    AnnouncementCreate,
    AnnouncementResponse,
    NotificationJobResponse,
)
from app.services.announcements import dispatch_announcement
from app.core.config import settings
from app.services.audit import record_audit
from app.services.messaging.base import RenderedMessage
from app.services.messaging.registry import channel_available, get_adapter
from app.services.reminders import CENTER_NAME, members_missing_email

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/jobs", response_model=list[NotificationJobResponse])
async def list_notification_jobs(
    status_filter: NotificationStatus | None = Query(default=None, alias="status"),
    channel: NotificationChannel | None = Query(default=None),
    notification_type: NotificationType | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> list[NotificationJobResponse]:
    stmt = select(NotificationJob).order_by(NotificationJob.created_at.desc())
    if status_filter is not None:
        stmt = stmt.where(NotificationJob.status == status_filter)
    if channel is not None:
        stmt = stmt.where(NotificationJob.channel == channel)
    if notification_type is not None:
        stmt = stmt.where(NotificationJob.notification_type == notification_type)

    result = await db.scalars(stmt)
    return [NotificationJobResponse.model_validate(item) for item in result.all()]


@router.get("/channels")
async def list_channel_status(
    _: AppUser = Depends(get_current_user),
) -> list[dict]:
    """Report each channel's configuration state so the admin UI can show readiness."""
    return [
        {
            "channel": channel.value,
            "configured": get_adapter(channel).is_configured,
            "available": channel_available(channel),
        }
        for channel in NotificationChannel
    ]


@router.get("/reminder-settings")
async def reminder_settings(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> dict:
    """What the Notifications page needs to show whether automatic reminders will work."""
    return {
        "reminder_days": settings.reminder_offsets,
        "email_configured": get_adapter(NotificationChannel.email).is_configured,
        "from_email": settings.smtp_from_email or None,
        "scheduler_enabled": bool(settings.cron_secret),
        "members_without_email": await members_missing_email(db),
    }


class TestEmailRequest(BaseModel):
    to: EmailStr


@router.post("/test-email")
async def send_test_email(
    payload: TestEmailRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: AppUser = Depends(get_current_admin_user),
) -> dict:
    """Send one email right now to check the SMTP settings."""
    adapter = get_adapter(NotificationChannel.email)
    if not adapter.is_configured:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is not set up on the server yet (SMTP settings missing)")
    message = RenderedMessage(
        subject=f"Test email from {CENTER_NAME}",
        text="This is a test. Membership reminders from the center will arrive like this one.",
        html=f"<p>This is a test. Membership reminders from <strong>{CENTER_NAME}</strong> will arrive like this one.</p>",
    )
    result = await adapter.send(str(payload.to), message)
    record_audit(db, current_user, "test_email_sent", "settings", None, f"Test email to {payload.to}: {'sent' if result.success else 'failed'}")
    await db.commit()
    if not result.success:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"The email server refused the message: {result.error}")
    return {"sent": True}


@router.post(
    "/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_announcement(
    payload: AnnouncementCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: AppUser = Depends(get_current_admin_user),
) -> AnnouncementResponse:
    scheduled_for = payload.scheduled_for or datetime.now(UTC)
    announcement = Announcement(
        subject=payload.subject,
        body=payload.body,
        channels=[channel.value for channel in payload.channels],
        filters=payload.filters.model_dump(exclude_none=True),
        scheduled_for=scheduled_for,
        created_by_id=current_user.id,
    )
    db.add(announcement)
    await db.flush()

    await dispatch_announcement(db, announcement, scheduled_for)

    await db.commit()
    await db.refresh(announcement)
    return AnnouncementResponse.model_validate(announcement)


@router.get("/announcements", response_model=list[AnnouncementResponse])
async def list_announcements(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> list[AnnouncementResponse]:
    result = await db.scalars(select(Announcement).order_by(Announcement.created_at.desc()))
    return [AnnouncementResponse.model_validate(item) for item in result.all()]
