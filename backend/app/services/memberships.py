from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timeutils import add_months, gym_today
from app.models import Member, MembershipPlan, Payment
from app.models.enums import PaymentKind
from app.schemas.member import PaymentInput


async def get_plan_or_404(db: AsyncSession, plan_id: int | None) -> MembershipPlan | None:
    if plan_id is None:
        return None
    plan = await db.get(MembershipPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership plan not found")
    return plan


def expiry_for_plan(plan: MembershipPlan, start: date) -> date:
    return add_months(start, plan.duration_months)


async def ensure_phone_available(db: AsyncSession, phone: str | None, *, exclude_member_id: int | None = None) -> None:
    """Independent members must have distinct phones; family children may share the parent's."""
    if not phone:
        return
    stmt = select(Member.id).where(Member.phone == phone, Member.family_id.is_(None), Member.parent_phone.is_(None))
    if exclude_member_id is not None:
        stmt = stmt.where(Member.id != exclude_member_id)
    if await db.scalar(stmt.limit(1)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone is already in use")


def record_payment(
    db: AsyncSession,
    *,
    member: Member,
    plan: MembershipPlan | None,
    payment: PaymentInput,
    kind: PaymentKind,
    period_start: date | None,
    period_end: date | None,
) -> Payment:
    entry = Payment(
        member_id=member.id,
        plan_id=plan.id if plan else None,
        amount=payment.amount,
        currency=payment.currency.upper(),
        method=payment.method,
        kind=kind,
        paid_on=gym_today(),
        period_start=period_start,
        period_end=period_end,
        note=payment.note,
    )
    db.add(entry)
    return entry
