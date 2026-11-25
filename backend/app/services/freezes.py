"""Membership freezes: frozen members keep their remaining days.

Freezing pauses the membership clock. When the freeze ends (automatically on the chosen
date, or when staff unfreeze), the days that were left at the start of the freeze are
counted again from the resume day.
"""

from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timeutils import gym_today
from app.models import Member


def paused_days(member: Member) -> int:
    """Days of membership left when the freeze started (0 if it had already run out)."""
    if not member.expiry_date or not member.frozen_since:
        return 0
    return max(0, (member.expiry_date - member.frozen_since).days)


def freeze_member(member: Member, until: date | None, today: date | None = None) -> None:
    today = today or gym_today()
    if until is not None and until <= today:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The freeze end date must be after today")
    if not member.is_frozen:
        member.is_frozen = True
        member.frozen_since = today
    member.freeze_until = until  # changing the end date of an existing freeze is allowed


def unfreeze_member(member: Member, resume_on: date | None = None) -> int:
    """End the freeze and give back the paused days. Returns the days restored."""
    if not member.is_frozen:
        return 0
    resume_on = resume_on or gym_today()
    restored = 0
    if member.expiry_date and member.frozen_since:
        remaining = paused_days(member)
        if remaining > 0:
            member.expiry_date = resume_on + timedelta(days=remaining)
            restored = remaining
    member.is_frozen = False
    member.frozen_since = None
    member.freeze_until = None
    return restored


async def release_due_freezes(session: AsyncSession, today: date | None = None) -> int:
    """Resume every freeze whose end date has arrived, counting days from that date. The caller commits."""
    today = today or gym_today()
    due = (
        await session.scalars(
            select(Member).where(Member.is_frozen.is_(True), Member.freeze_until.is_not(None), Member.freeze_until <= today)
        )
    ).all()
    for member in due:
        unfreeze_member(member, resume_on=member.freeze_until)
    return len(due)
