from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Announcement, Member, MembershipPlan
from app.models.enums import AnnouncementStatus, NotificationChannel, NotificationType
from app.services.messaging.templates import build_announcement_message
from app.tasks.notifications import create_member_jobs


async def resolve_recipients(session: AsyncSession, filters: dict) -> list[Member]:
    """Members that match the announcement filters and are opted into messaging.

    Supported filters: ``plan_id`` (int), ``program`` (str, matched on the member's
    plan), ``expired`` (bool, expiry before/after today).
    """
    stmt = select(Member).where(Member.messaging_opt_in.is_(True))

    plan_id = filters.get("plan_id")
    if plan_id is not None:
        stmt = stmt.where(Member.plan_id == plan_id)

    program = filters.get("program")
    if program:
        stmt = stmt.join(MembershipPlan, Member.plan_id == MembershipPlan.id).where(
            MembershipPlan.program == program
        )

    expired = filters.get("expired")
    if expired is not None:
        today = date.today()
        if expired:
            stmt = stmt.where(Member.expiry_date.is_not(None), Member.expiry_date < today)
        else:
            stmt = stmt.where(Member.expiry_date.is_(None) | (Member.expiry_date >= today))

    result = await session.scalars(stmt)
    return list(result.all())


async def dispatch_announcement(
    session: AsyncSession,
    announcement: Announcement,
    scheduled_for: datetime,
) -> tuple[int, int]:
    """Fan an announcement out into per-member, per-channel notification jobs.

    Returns (recipient_count, job_count). Does not commit — caller owns the txn.
    """
    members = await resolve_recipients(session, announcement.filters or {})
    requested_channels = [NotificationChannel(c) for c in announcement.channels] or None
    message = build_announcement_message(announcement.subject, announcement.body)

    job_count = 0
    for member in members:
        job_count += await create_member_jobs(
            session,
            member=member,
            notification_type=NotificationType.announcement,
            message=message,
            scheduled_for=scheduled_for,
            requested_channels=requested_channels,
        )

    announcement.recipient_count = len(members)
    announcement.job_count = job_count
    announcement.status = AnnouncementStatus.sent if job_count else AnnouncementStatus.queued
    return len(members), job_count
