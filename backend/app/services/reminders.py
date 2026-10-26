"""Membership expiry reminders (default: 5 and 3 days before expiry).

Runs once a day. Each reminder "stage" is sent at most once per membership period, and a
stage whose day was missed (e.g. the server was asleep) is sent on the next run instead of
being skipped. Children are reached through their parent: one email per parent lists every
child whose membership is about to run out.
"""

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from html import escape

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.timeutils import gym_today
from app.models import Family, Member, MembershipPlan, NotificationJob
from app.models.enums import NotificationChannel, NotificationStatus, NotificationType
from app.services.messaging.base import RenderedMessage
from app.services.messaging.registry import channel_available, channels_for_member

CENTER_NAME = "N & T Taekwondo & Karate Center"


@dataclass
class DueReminder:
    member: Member
    plan: MembershipPlan | None
    days_left: int
    stage: int


def _days_phrase(days: int) -> str:
    if days <= 0:
        return "today"
    if days == 1:
        return "tomorrow"
    return f"in {days} days"


def build_expiry_email(greeting_name: str, due: list[DueReminder]) -> RenderedMessage:
    soonest = min(item.days_left for item in due)
    subject = (
        f"Membership renewal reminder: {due[0].member.name} ({_days_phrase(soonest)})"
        if len(due) == 1
        else f"Membership renewal reminder for {len(due)} trainees"
    )
    lines = [
        f"Dear {greeting_name},",
        "",
        f"This is a friendly reminder that the following {'memberships are' if len(due) > 1 else 'membership is'} about to end:",
        "",
    ]
    rows = []
    for item in due:
        package = item.plan.name if item.plan else "membership"
        when = item.member.expiry_date.strftime("%A %d %B %Y")
        lines.append(f"- {item.member.name}: {package} ends {_days_phrase(item.days_left)} ({when}).")
        rows.append(
            f"<tr><td style='padding:6px 12px 6px 0'><strong>{escape(item.member.name)}</strong></td>"
            f"<td style='padding:6px 12px 6px 0'>{escape(package)}</td>"
            f"<td style='padding:6px 0'>ends {escape(_days_phrase(item.days_left))} ({escape(when)})</td></tr>"
        )
    lines += [
        "",
        "Please renew at the front desk to keep training without interruption.",
    ]
    if settings.center_contact_line:
        lines.append(settings.center_contact_line)
    lines += ["", "Thank you,", CENTER_NAME]

    contact_html = f"<p>{escape(settings.center_contact_line)}</p>" if settings.center_contact_line else ""
    html = (
        "<div style='font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;max-width:560px'>"
        f"<h2 style='color:#e8462d;margin:0 0 16px'>{escape(CENTER_NAME)}</h2>"
        f"<p>Dear {escape(greeting_name)},</p>"
        f"<p>This is a friendly reminder that the following {'memberships are' if len(due) > 1 else 'membership is'} about to end:</p>"
        f"<table style='border-collapse:collapse;margin:12px 0'>{''.join(rows)}</table>"
        "<p>Please renew at the front desk to keep training without interruption.</p>"
        f"{contact_html}"
        f"<p>Thank you,<br>{escape(CENTER_NAME)}</p>"
        "</div>"
    )
    return RenderedMessage(subject=subject, text="\n".join(lines), html=html)


def _already_sent(jobs: list[NotificationJob]) -> set[tuple[int, str, int]]:
    """(member_id, expiry_iso, stage) for every reminder already queued or sent."""
    sent = set()
    for job in jobs:
        for entry in (job.payload or {}).get("reminder_for", []):
            sent.add((entry.get("member_id"), entry.get("expiry"), entry.get("stage")))
    return sent


async def find_due_reminders(session: AsyncSession, today: date | None = None) -> list[DueReminder]:
    today = today or gym_today()
    offsets = settings.reminder_offsets
    members = (
        await session.scalars(
            select(Member).where(
                Member.messaging_opt_in.is_(True),
                Member.is_frozen.is_(False),
                Member.expiry_date.is_not(None),
                Member.expiry_date >= today,
                Member.expiry_date <= today + timedelta(days=offsets[0]),
            )
        )
    ).all()
    if not members:
        return []

    recent_jobs = (
        await session.scalars(
            select(NotificationJob).where(
                NotificationJob.notification_type == NotificationType.membership_expiry,
                NotificationJob.member_id.is_not(None),
                NotificationJob.created_at >= datetime.now(UTC) - timedelta(days=offsets[0] + 30),
            )
        )
    ).all()
    sent = _already_sent(recent_jobs)
    plans = {plan.id: plan for plan in (await session.scalars(select(MembershipPlan))).all()}

    due = []
    for member in members:
        days_left = (member.expiry_date - today).days
        stage = min(offset for offset in offsets if days_left <= offset)
        expiry = member.expiry_date.isoformat()
        # Skip if this stage, or a more urgent one, already went out for this membership period.
        if any((member.id, expiry, s) in sent for s in offsets if s <= stage):
            continue
        due.append(DueReminder(member=member, plan=plans.get(member.plan_id), days_left=days_left, stage=stage))
    return due


async def queue_expiry_reminders(session: AsyncSession, today: date | None = None) -> dict[str, int]:
    """Create reminder jobs for memberships that are due. The caller commits."""
    due = await find_due_reminders(session, today)
    family_ids = {item.member.family_id for item in due if item.member.family_id}
    families = (
        {f.id: f for f in (await session.scalars(select(Family).where(Family.id.in_(family_ids)))).all()}
        if family_ids
        else {}
    )
    now = datetime.now(UTC)

    by_email: dict[str, list[DueReminder]] = defaultdict(list)
    greeting: dict[str, str] = {}
    other_jobs = no_contact = 0
    email_ready = channel_available(NotificationChannel.email)

    for item in due:
        member = item.member
        family = families.get(member.family_id) if member.family_id else None
        email = member.email or (family.parent_email if family else None)
        if email and email_ready:
            key = email.lower()
            by_email[key].append(item)
            greeting.setdefault(key, family.parent_name if family and not member.email else member.name)

        entry = {"member_id": member.id, "expiry": member.expiry_date.isoformat(), "stage": item.stage}
        sent_elsewhere = False
        for channel, recipient in channels_for_member(member, [NotificationChannel.whatsapp, NotificationChannel.telegram]):
            message = build_expiry_email(member.name, [item])
            session.add(
                NotificationJob(
                    member_id=member.id,
                    notification_type=NotificationType.membership_expiry,
                    channel=channel,
                    recipient=recipient,
                    status=NotificationStatus.pending,
                    scheduled_for=now,
                    payload={"subject": message.subject, "text": message.text, "reminder_for": [entry]},
                    provider=channel.value,
                )
            )
            other_jobs += 1
            sent_elsewhere = True
        if not (email and email_ready) and not sent_elsewhere:
            no_contact += 1

    for email, items in by_email.items():
        message = build_expiry_email(greeting[email], items)
        session.add(
            NotificationJob(
                member_id=items[0].member.id,
                notification_type=NotificationType.membership_expiry,
                channel=NotificationChannel.email,
                recipient=email,
                status=NotificationStatus.pending,
                scheduled_for=now,
                payload={
                    **message.to_payload(),
                    "reminder_for": [
                        {"member_id": i.member.id, "expiry": i.member.expiry_date.isoformat(), "stage": i.stage}
                        for i in items
                    ],
                },
                provider="email",
            )
        )

    await session.flush()
    return {
        "members_due": len(due),
        "emails_queued": len(by_email),
        "other_messages_queued": other_jobs,
        "members_without_contact": no_contact,
    }


async def members_missing_email(session: AsyncSession) -> int:
    """Active, opted-in members with no email of their own and no parent email."""
    members = (
        await session.scalars(
            select(Member).where(Member.messaging_opt_in.is_(True), Member.email.is_(None))
        )
    ).all()
    family_ids = {m.family_id for m in members if m.family_id}
    with_parent_email = (
        set((await session.scalars(select(Family.id).where(Family.id.in_(family_ids), Family.parent_email.is_not(None)))).all())
        if family_ids
        else set()
    )
    return sum(1 for m in members if m.family_id not in with_parent_email)
