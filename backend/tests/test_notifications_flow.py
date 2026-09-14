from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select

from app.models import Member, MembershipPlan, NotificationJob
from app.models.enums import NotificationStatus, NotificationType
from app.services.messaging.templates import build_enrollment_message
from app.tasks.notifications import (
    _process_pending_notification_jobs,
    _queue_enrollment_confirmation,
    create_member_jobs,
)


async def _add_member(session, **overrides) -> Member:
    defaults = dict(
        name="Member One",
        phone="+9715000000{:02d}".format(overrides.pop("_seq", 1)),
        email="m@example.com",
        telegram_chat_id="12345",
        age=25,
        messaging_opt_in=True,
    )
    defaults.update(overrides)
    member = Member(**defaults)
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member


async def _add_plan(session) -> MembershipPlan:
    plan = MembershipPlan(
        name="Gold",
        program="Adults",
        duration_label="One Month",
        duration_months=1,
        duration_days=30,
        price=Decimal("300.00"),
        currency="AED",
        included_items=["Towel"],
    )
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return plan


async def test_create_member_jobs_fans_out_per_channel(db_session):
    member = await _add_member(db_session)
    msg = build_enrollment_message(member, None)

    created = await create_member_jobs(
        db_session,
        member=member,
        notification_type=NotificationType.enrollment,
        message=msg,
        scheduled_for=datetime.now(UTC),
    )
    await db_session.commit()

    assert created == 3
    jobs = (await db_session.scalars(select(NotificationJob))).all()
    assert len(jobs) == 3
    assert {j.channel.value for j in jobs} == {"whatsapp", "telegram", "email"}
    assert all(j.status == NotificationStatus.pending for j in jobs)
    assert all(j.recipient for j in jobs)


async def test_opted_out_member_creates_no_jobs(db_session):
    member = await _add_member(db_session, messaging_opt_in=False)
    created = await create_member_jobs(
        db_session,
        member=member,
        notification_type=NotificationType.enrollment,
        message=build_enrollment_message(member, None),
        scheduled_for=datetime.now(UTC),
    )
    await db_session.commit()
    assert created == 0


async def test_enrollment_task_and_processing(db_session, session_factory):
    plan = await _add_plan(db_session)
    member = await _add_member(db_session, plan_id=plan.id)

    result = await _queue_enrollment_confirmation(member.id)
    assert result["created_jobs"] == 3

    processed = await _process_pending_notification_jobs()
    assert processed["processed_jobs"] == 3
    assert processed["failed_jobs"] == 0

    async with session_factory() as s:
        jobs = (await s.scalars(select(NotificationJob))).all()
        assert all(j.status == NotificationStatus.processed for j in jobs)
        assert all(j.provider == "dev-stub" for j in jobs)
        assert all(j.processed_at is not None for j in jobs)
        # enrollment message carried the plan details in the payload
        assert any("Gold" in j.payload["text"] for j in jobs)


async def test_processing_is_idempotent_on_status(db_session, session_factory):
    member = await _add_member(db_session, email=None, telegram_chat_id=None)
    await create_member_jobs(
        db_session,
        member=member,
        notification_type=NotificationType.enrollment,
        message=build_enrollment_message(member, None),
        scheduled_for=datetime.now(UTC),
    )
    await db_session.commit()

    first = await _process_pending_notification_jobs()
    assert first["processed_jobs"] == 1
    # No pending jobs remain, so a second run does nothing.
    second = await _process_pending_notification_jobs()
    assert second["processed_jobs"] == 0
