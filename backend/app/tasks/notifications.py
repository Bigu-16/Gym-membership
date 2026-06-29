import asyncio
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, select

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import Member, NotificationJob
from app.models.enums import NotificationStatus, NotificationType


async def _create_notification_job(
    *,
    member_id: int | None,
    notification_type: NotificationType,
    scheduled_for: datetime,
    payload: dict,
) -> int:
    async with SessionLocal() as session:
        job = NotificationJob(
            member_id=member_id,
            notification_type=notification_type,
            status=NotificationStatus.pending,
            scheduled_for=scheduled_for,
            payload=payload,
            provider="internal",
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)
        return job.id


async def _queue_membership_expiry_reminders() -> dict[str, int]:
    today = date.today()
    reminder_dates = {today, today + timedelta(days=3)}

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

    created = 0
    for member in members:
        await _create_notification_job(
            member_id=member.id,
            notification_type=NotificationType.membership_expiry,
            scheduled_for=datetime.now(UTC),
            payload={
                "member_name": member.name,
                "phone": member.phone,
                "expiry_date": member.expiry_date.isoformat() if member.expiry_date else None,
            },
        )
        created += 1

    return {"queued_jobs": created}


async def _process_pending_notification_jobs(limit: int = 100) -> dict[str, int]:
    now = datetime.now(UTC)

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
            job.status = NotificationStatus.processed
            job.processed_at = now
            job.error_message = None

        await session.commit()
        return {"processed_jobs": len(jobs)}


@celery_app.task(name="app.tasks.queue_welcome_message")
def queue_welcome_message(member_id: int, member_name: str, phone: str) -> dict[str, int]:
    job_id = asyncio.run(
        _create_notification_job(
            member_id=member_id,
            notification_type=NotificationType.welcome,
            scheduled_for=datetime.now(UTC),
            payload={"member_name": member_name, "phone": phone},
        )
    )
    return {"job_id": job_id}


@celery_app.task(name="app.tasks.send_membership_expiry_reminders")
def send_membership_expiry_reminders() -> dict[str, int]:
    return asyncio.run(_queue_membership_expiry_reminders())


@celery_app.task(name="app.tasks.process_pending_notification_jobs")
def process_pending_notification_jobs(limit: int = 100) -> dict[str, int]:
    return asyncio.run(_process_pending_notification_jobs(limit=limit))
