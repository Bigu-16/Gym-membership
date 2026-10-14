from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_or_staff_user, get_current_user
from app.core.timeutils import gym_today
from app.db import get_db_session
from app.models import AppUser, Member, Payment
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.memberships import get_plan_or_404

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    member_id: int | None = None,
    limit: int = Query(default=500, ge=1, le=5000),
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[PaymentResponse]:
    stmt = select(Payment).order_by(Payment.paid_on.desc(), Payment.id.desc()).limit(limit)
    if member_id is not None:
        stmt = stmt.where(Payment.member_id == member_id)
    result = await db.scalars(stmt)
    return [PaymentResponse.model_validate(item) for item in result.all()]


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_or_staff_user),
) -> PaymentResponse:
    if await db.get(Member, payload.member_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    await get_plan_or_404(db, payload.plan_id)

    data = payload.model_dump()
    data["currency"] = data["currency"].upper()
    data["paid_on"] = data["paid_on"] or gym_today()
    payment = Payment(**data)
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)
