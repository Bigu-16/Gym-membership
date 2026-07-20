import asyncio
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models import Member, MembershipPlan, NotificationJob
from app.models.enums import NotificationChannel, NotificationStatus, NotificationType
from app.services.messaging.base import RenderedMessage
from app.services.messaging.registry import channels_for_member, get_adapter
from app.services.messaging.templates import (
    build_class_enrollment_message,
    build_enrollment_message,
)


# ---------------------------------------------------------------------------
# Job creation (fan-out: one job per opted-in channel the member is reachable on)
# ---------------------------------------------------------------------------
async def create_member_jobs(
    session: AsyncSession,
    *,
    member: Member,
    notification_type: NotificationType,
    message: RenderedMessage,
    scheduled_for: datetime,
    requested_channels: list[NotificationChannel] | None = None,
) -> int:
    """Create a pending NotificationJob per channel the member should receive on.

    Does not commit — the caller owns the transaction.
    """
    pairs = channels_for_member(member, requested_channels)
    for channel, recipient in pairs:
        session.add(
            NotificationJob(
                member_id=member.id,
                notification_type=notification_type,
                channel=channel,
                recipient=recipient,
                status=NotificationStatus.pending,
                scheduled_for=scheduled_for,
                payload=message.to_payload(),
                provider=channel.value,
            )
        )
    return len(pairs)


# ---------------------------------------------------------------------------
# Async implementations
# ---------------------------------------------------------------------------
async def _load_member_and_plan(
    session: AsyncSession, member_id: int
) -> tuple[Member | None, MembershipPlan | None]:
    member = await session.get(Member, member_id)
    plan = None
    if member is not None and member.plan_id is not None:
        plan = await session.get(MembershipPlan, member.plan_id)
    return member, plan


async def _queue_enrollment_confirmation(member_id: int) -> dict[str, int]:
    async with SessionLocal() as session:
        member, plan = await _load_member_and_plan(session, member_id)
        if member is None:
            return {"created_jobs": 0}
        message = build_enrollment_message(member, plan)
        created = await create_member_jobs(
            session,
            member=member,
            notification_type=NotificationType.enrollment,
            message=message,
            scheduled_for=datetime.now(UTC),
        )
        await session.commit()
    return {"created_jobs": created}


async def _queue_class_enrollment_confirmation(member_id: int, class_label: str) -> dict[str, int]:
    async with SessionLocal() as session:
        member, plan = await _load_member_and_plan(session, member_id)
        if member is None:
            return {"created_jobs": 0}
        message = build_class_enrollment_message(member, plan, class_label)
        created = await create_member_jobs(
            session,
            member=member,
            notification_type=NotificationType.class_enrollment,
            message=message,
            scheduled_for=datetime.now(UTC),
        )
        await session.commit()
    return {"created_jobs": created}


async def _queue_membership_expiry_reminders() -> dict[str, int]:
    today = date.today()
    reminder_dates = {today, today + timedelta(days=3)}

    created = 0
    async with SessionLocal() as session:
        result = await session.scalars(
            select(Member).where(
                and_(
                    Member.messaging_opt_in.is_(True),
                    Member.expiry_date.is_not(None),
                    Member.expiry_date.in_(reminder_dates),
                )
            )
        )
        members = result.all()

        for member in members:
            expiry = member.expiry_date.isoformat() if member.expiry_date else "soon"
            message = RenderedMessage(
                subject="Membership Expiry Reminder",
                text=(
                    f"Hi {member.name}, your gym membership expires on {expiry}. "
                    "Please renew to keep your access active."
                ),
            )
            created += await create_member_jobs(
                session,
                member=member,
                notification_type=NotificationType.membership_expiry,
                message=message,
                scheduled_for=datetime.now(UTC),
            )
        await session.commit()

    return {"queued_jobs": created}


async def _process_pending_notification_jobs(limit: int = 100) -> dict[str, int]:
    now = datetime.now(UTC)
    processed = 0
    failed = 0

    async with SessionLocal() as session:
        result = await session.scalars(
            select(NotificationJob)
            .where(
                NotificationJob.status == NotificationStatus.pending,
                NotificationJob.scheduled_for <= now,
            )
            .order_by(NotificationJob.scheduled_for.asc())
            .limit(limit)
        )
        jobs = result.all()

        for job in jobs:
            adapter = get_adapter(job.channel)
            message = RenderedMessage.from_payload(job.payload)
            job.attempts += 1

            outcome = await adapter.send(job.recipient or "", message)
            job.provider = outcome.provider

            if outcome.success:
                job.status = NotificationStatus.processed
                job.processed_at = now
                job.provider_message_id = outcome.provider_message_id
                job.error_message = None
                processed += 1
            else:
                job.error_message = outcome.error
                if job.attempts >= settings.notification_max_attempts:
                    job.status = NotificationStatus.failed
                    job.processed_at = now
                    failed += 1
                # otherwise the job stays pending and is retried on the next cycle

        await session.commit()

    return {"processed_jobs": processed, "failed_jobs": failed}


# ---------------------------------------------------------------------------
# Celery task entry points
# ---------------------------------------------------------------------------
@celery_app.task(name="app.tasks.queue_enrollment_confirmation")
def queue_enrollment_confirmation(member_id: int) -> dict[str, int]:
    return asyncio.run(_queue_enrollment_confirmation(member_id))


@celery_app.task(name="app.tasks.queue_class_enrollment_confirmation")
def queue_class_enrollment_confirmation(member_id: int, class_label: str) -> dict[str, int]:
    return asyncio.run(_queue_class_enrollment_confirmation(member_id, class_label))


@celery_app.task(name="app.tasks.send_membership_expiry_reminders")
def send_membership_expiry_reminders() -> dict[str, int]:
    return asyncio.run(_queue_membership_expiry_reminders())


@celery_app.task(name="app.tasks.process_pending_notification_jobs")
def process_pending_notification_jobs(limit: int = 100) -> dict[str, int]:
    return asyncio.run(_process_pending_notification_jobs(limit=limit))
