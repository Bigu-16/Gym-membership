from datetime import date
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin_user, get_current_user
from app.db import get_db_session
from app.models import AppUser
from app.models import Family
from app.models import Member
from app.schemas.member import (
    FamilyCreate,
    FamilyFreezeRequest,
    FamilyGroupResponse,
    FreezeRequest,
    MemberCreate,
    MemberResponse,
    MemberUpdate,
)
from app.tasks.notifications import queue_welcome_message

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
        today = date.today()
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
    existing = await db.scalar(select(Member.id).where(Member.phone == payload.phone))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone is already in use")

    member = Member(**payload.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    if member.messaging_opt_in:
        try:
            queue_welcome_message.delay(member.id, member.name, member.phone)
        except Exception:
            logger.exception("Failed to queue welcome notification for member_id=%s", member.id)
    return MemberResponse.model_validate(member)


@router.post("/families", response_model=FamilyGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    payload: FamilyCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> FamilyGroupResponse:
    if not payload.members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="members list cannot be empty")

    phones = [member.phone for member in payload.members]
    if len(phones) != len(set(phones)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Family member phones must be unique")

    existing_family = await db.scalar(select(Family.id).where(Family.parent_phone == payload.parent.phone))
    if existing_family is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Parent phone is already in use")

    existing_phone = await db.scalar(select(Member.phone).where(Member.phone.in_(phones)).limit(1))
    if existing_phone is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone is already in use")

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

    members = [
        Member(**member.model_dump(exclude={"family_id", "parent_phone"}), family_id=family.id, parent_phone=family.parent_phone)
        for member in payload.members
    ]
    db.add_all(members)
    await db.commit()
    await db.refresh(family)
    for member in members:
        await db.refresh(member)
        if member.messaging_opt_in:
            try:
                queue_welcome_message.delay(member.id, member.name, member.phone)
            except Exception:
                logger.exception("Failed to queue welcome notification for member_id=%s", member.id)
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

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)

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
