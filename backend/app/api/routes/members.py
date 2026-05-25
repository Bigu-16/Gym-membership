from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
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

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/", response_model=list[MemberResponse])
async def list_members(
    search: str | None = None,
    phone: str | None = None,
    expired: bool | None = None,
    is_frozen: bool | None = None,
    db: AsyncSession = Depends(get_db_session),
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
async def create_member(payload: MemberCreate, db: AsyncSession = Depends(get_db_session)) -> MemberResponse:
    member = Member(**payload.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.post("/families", response_model=list[MemberResponse], status_code=status.HTTP_201_CREATED)
async def create_family(payload: FamilyCreate, db: AsyncSession = Depends(get_db_session)) -> list[MemberResponse]:
    if not payload.members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="members list cannot be empty")

    members = [Member(**member.model_dump()) for member in payload.members]
    db.add_all(members)
    await db.commit()
    for member in members:
        await db.refresh(member)
    return [MemberResponse.model_validate(member) for member in members]


@router.get("/families", response_model=list[FamilyGroupResponse])
async def list_families(
    parent_phone: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
) -> list[FamilyGroupResponse]:
    stmt = select(Member).where(Member.parent_phone.is_not(None)).order_by(Member.parent_phone, Member.name)
    if parent_phone:
        stmt = stmt.where(Member.parent_phone == parent_phone)

    result = await db.scalars(stmt)
    groups: dict[str, list[MemberResponse]] = {}
    for member in result.all():
        if member.parent_phone is None:
            continue
        groups.setdefault(member.parent_phone, []).append(MemberResponse.model_validate(member))

    return [FamilyGroupResponse(parent_phone=key, members=value) for key, value in groups.items()]


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(member_id: int, db: AsyncSession = Depends(get_db_session)) -> MemberResponse:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return MemberResponse.model_validate(member)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    payload: MemberUpdate,
    db: AsyncSession = Depends(get_db_session),
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
async def delete_member(member_id: int, db: AsyncSession = Depends(get_db_session)) -> None:
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
) -> MemberResponse:
    member = await db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    member.is_frozen = payload.is_frozen
    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.patch("/families/{parent_phone}/freeze", response_model=list[MemberResponse])
async def freeze_family(
    parent_phone: str,
    payload: FamilyFreezeRequest,
    db: AsyncSession = Depends(get_db_session),
) -> list[MemberResponse]:
    await db.execute(
        update(Member).where(Member.parent_phone == parent_phone).values(is_frozen=payload.is_frozen)
    )
    await db.commit()

    result = await db.scalars(select(Member).where(Member.parent_phone == parent_phone).order_by(Member.name))
    members = result.all()
    if not members:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family not found")
    return [MemberResponse.model_validate(member) for member in members]
