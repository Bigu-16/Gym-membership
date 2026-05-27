from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user, get_current_user
from app.db import get_db_session
from app.models import AppUser
from app.models import CheckIn, Member
from app.schemas.check_in import CheckInCreate, CheckInResponse, CheckOutRequest

router = APIRouter(prefix="/check-ins", tags=["check-ins"])


@router.get("/", response_model=list[CheckInResponse])
async def list_check_ins(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[CheckInResponse]:
    result = await db.scalars(select(CheckIn).order_by(CheckIn.check_in_time.desc()))
    return [
        CheckInResponse(
            id=item.id,
            member_id=item.member_id,
            check_in_time=item.check_in_time,
            check_out_time=item.check_out_time,
        )
        for item in result.all()
    ]


@router.post("/", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
async def create_check_in(
    payload: CheckInCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> CheckInResponse:
    member = await db.get(Member, payload.member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    active_check_in = await db.scalar(
        select(CheckIn).where(CheckIn.member_id == payload.member_id, CheckIn.check_out_time.is_(None))
    )
    if active_check_in is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Member is already checked in")

    check_in = CheckIn(member_id=payload.member_id, check_in_time=datetime.now(timezone.utc))
    db.add(check_in)
    await db.commit()
    await db.refresh(check_in)
    return CheckInResponse(
        id=check_in.id,
        member_id=check_in.member_id,
        check_in_time=check_in.check_in_time,
        check_out_time=check_in.check_out_time,
    )


@router.patch("/{check_in_id}/check-out", response_model=CheckInResponse)
async def check_out_member(
    check_in_id: int,
    payload: CheckOutRequest,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> CheckInResponse:
    check_in = await db.get(CheckIn, check_in_id)
    if check_in is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found")
    if check_in.check_out_time is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Member is already checked out")

    check_in.check_out_time = payload.check_out_time or datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(check_in)
    return CheckInResponse(
        id=check_in.id,
        member_id=check_in.member_id,
        check_in_time=check_in.check_in_time,
        check_out_time=check_in.check_out_time,
    )
