import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin_or_staff_user, get_current_admin_user, get_current_user
from app.core.timeutils import gym_today
from app.db import get_db_session
from app.models import AppUser
from app.models import Family
from app.models import Member
from app.models.enums import PaymentKind
from app.schemas.member import (
    FamilyCreate,
    FamilyFreezeRequest,
    FamilyGroupResponse,
    FreezeRequest,
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    RenewRequest,
)
from app.services.memberships import ensure_phone_available, expiry_for_plan, get_plan_or_404, record_payment
from app.tasks.notifications import queue_enrollment_confirmation

router = APIRouter(prefix="/members", tags=["members"])
logger = logging.getLogger(__name__)


def family_response(family: Family, members: list[Member] | None = None) -> FamilyGroupResponse:
    family_members = family.members if members is None else members
    return FamilyGroupResponse(
        id=family.id,
        parent={
            "name": family.parent_name,
            "phone": family.parent_phone,
            "email": family.parent_email,
            "address": family.parent_address,
            "relationship": family.parent_relationship,
            "notes": family.notes,
        },
        members=[MemberResponse.model_validate(member) for member in family_members],
    )


@router.get("/", response_model=list[MemberResponse])
async def list_members(
    search: str | None = None,
    phone: str | None = None,
    expired: bool | None = None,
    is_frozen: bool | None = None,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[MemberResponse]:
    stmt = select(Member).order_by(Member.created_at.desc())

    if search:
        pattern = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Member.name).like(pattern),
                func.lower(Member.phone).like(pattern),
            )
        )
    if phone:
        stmt = stmt.where(Member.phone == phone)
    if expired is not None:
        today = gym_today()
        stmt = stmt.where(Member.expiry_date < today if expired else Member.expiry_date >= today)
    if is_frozen is not None:
        stmt = stmt.where(Member.is_frozen == is_frozen)

    result = await db.scalars(stmt)
    return [MemberResponse.model_validate(member) for member in result.all()]


@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member(
    payload: MemberCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> MemberResponse:
    if not payload.parent_phone and payload.family_id is None:
        await ensure_phone_available(db, payload.phone)
    plan = await get_plan_or_404(db, payload.plan_id)

    data = payload.model_dump(exclude={"payment"})
    start = gym_today()
    if data["expiry_date"] is None and plan is not None:
        data["expiry_date"] = expiry_for_plan(plan, start)

    member = Member(**data)
    db.add(member)
    await db.flush()
    if payload.payment is not None:
        record_payment(
            db,
            member=member,
            plan=plan,
            payment=payload.payment,
            kind=PaymentKind.new,
            period_start=start,
            period_end=member.expiry_date,
        )
    await db.commit()
    await db.refresh(member)
    if member.messaging_opt_in:
        try:
            queue_enrollment_confirmation.delay(member.id)
        except Exception:
            logger.exception("Failed to queue enrollment notification for member_id=%s", member.id)
    return MemberResponse.model_validate(member)


@router.post("/families", response_model=FamilyGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    payload: FamilyCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> FamilyGroupResponse:
    # A returning parent registers more children into their existing family.
    family = await db.scalar(select(Family).where(Family.parent_phone == payload.parent.phone))
    if family is None:
        family = Family(
            parent_name=payload.parent.name,
            parent_phone=payload.parent.phone,
            parent_email=payload.parent.email,
            parent_address=payload.parent.address,
            parent_relationship=payload.parent.relationship,
            notes=payload.parent.notes,
        )
        db.add(family)
        await db.flush()
    else:
        family.parent_name = payload.parent.name
        family.parent_email = payload.parent.email or family.parent_email
        family.parent_address = payload.parent.address or family.parent_address

    start = gym_today()
    members: list[Member] = []
    for entry in payload.members:
        plan = await get_plan_or_404(db, entry.plan_id)
        data = entry.model_dump(exclude={"family_id", "parent_phone", "payment"})
        if data["expiry_date"] is None and plan is not None:
            data["expiry_date"] = expiry_for_plan(plan, start)
        member = Member(**data, family_id=family.id, parent_phone=family.parent_phone)
        db.add(member)
        await db.flush()
        if entry.payment is not None:
            record_payment(
                db,
                member=member,
                plan=plan,
                payment=entry.payment,
                kind=PaymentKind.new,
                period_start=start,
                period_end=member.expiry_date,
            )
        members.append(member)
    await db.commit()
    await db.refresh(family)
    for member in members:
        await db.refresh(member)
        if member.messaging_opt_in:
            try:
                queue_enrollment_confirmation.delay(member.id)
            except Exception:
                logger.exception("Failed to queue enrollment notification for member_id=%s", member.id)
    return family_response(family, members)


@router.get("/families", response_model=list[FamilyGroupResponse])
async def list_families(
    parent_phone: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[FamilyGroupResponse]:
    stmt = select(Family).options(selectinload(Family.members)).order_by(Family.parent_name)
    if parent_phone:
        stmt = stmt.where(Family.parent_phone == parent_phone)

    result = await db.scalars(stmt)
    return [family_response(family) for family in result.all()]


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> MemberResponse:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return MemberResponse.model_validate(member)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    payload: MemberUpdate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> MemberResponse:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    updates = payload.model_dump(exclude_unset=True)
    if "phone" in updates and not member.family_id and not member.parent_phone:
        await ensure_phone_available(db, updates["phone"], exclude_member_id=member.id)
    if "plan_id" in updates:
        await get_plan_or_404(db, updates["plan_id"])

    for field, value in updates.items():
        setattr(member, field, value)

    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.post("/{member_id}/renew", response_model=MemberResponse)
async def renew_member(
    member_id: int,
    payload: RenewRequest,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_or_staff_user),
) -> MemberResponse:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    plan = await get_plan_or_404(db, payload.plan_id if payload.plan_id is not None else member.plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a package to renew")

    today = gym_today()
    start = today
    if payload.start_from == "expiry" and member.expiry_date and member.expiry_date > today:
        start = member.expiry_date
    member.plan_id = plan.id
    member.expiry_date = expiry_for_plan(plan, start)
    member.is_frozen = False

    if payload.payment is not None:
        record_payment(
            db,
            member=member,
            plan=plan,
            payment=payload.payment,
            kind=PaymentKind.renewal,
            period_start=start,
            period_end=member.expiry_date,
        )
    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> None:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    await db.delete(member)
    await db.commit()


@router.patch("/{member_id}/freeze", response_model=MemberResponse)
async def freeze_member(
    member_id: int,
    payload: FreezeRequest,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> MemberResponse:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    member.is_frozen = payload.is_frozen
    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.patch("/families/{family_key}/freeze", response_model=FamilyGroupResponse)
async def freeze_family(
    family_key: str,
    payload: FamilyFreezeRequest,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> FamilyGroupResponse:
    stmt = select(Family)
    if family_key.isdigit():
        stmt = stmt.where(Family.id == int(family_key))
    else:
        stmt = stmt.where(Family.parent_phone == family_key)

    family = await db.scalar(stmt)
    if family is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")

    await db.execute(update(Member).where(Member.family_id == family.id).values(is_frozen=payload.is_frozen))
    await db.commit()

    result = await db.scalars(select(Member).where(Member.family_id == family.id).order_by(Member.name))
    members = result.all()
    return family_response(family, members)
