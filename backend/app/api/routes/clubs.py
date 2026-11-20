from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_club, get_current_admin_user, get_current_user, get_owned
from app.db import get_db_session
from app.models import AppUser, ClassSlot, Club, Student
from app.models.enums import UserRole
from app.schemas.club import ClubCreate, ClubResponse, ClubUpdate, SlotResponse, SlotWrite
from app.services.audit import record_audit
from app.services.clubs import new_club, seed_club_defaults

router = APIRouter(tags=["branches"])


@router.get("/clubs", response_model=list[ClubResponse])
async def list_clubs(
    db: AsyncSession = Depends(get_db_session),
    user: AppUser = Depends(get_current_user),
) -> list[ClubResponse]:
    """Owners see every branch; staff see only their own."""
    stmt = select(Club).order_by(Club.name)
    if user.role != UserRole.admin:
        if user.club_id is None:
            return []
        stmt = stmt.where(Club.id == user.club_id, Club.is_active.is_(True))
    rows = await db.scalars(stmt)
    return [ClubResponse.model_validate(c) for c in rows.all()]


@router.post("/clubs", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
async def create_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db_session),
    admin: AppUser = Depends(get_current_admin_user),
) -> ClubResponse:
    name = payload.name.strip()
    if await db.scalar(select(Club.id).where(func.lower(Club.name) == name.lower())):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A branch with this name already exists")
    club = new_club(name, payload.name_am, payload.monthly_fee)
    db.add(club)
    await db.flush()
    seed_club_defaults(db, club)
    record_audit(db, admin, "branch_created", "club", club.id, f"Created branch {club.name}", club_id=club.id)
    await db.commit()
    await db.refresh(club)
    return ClubResponse.model_validate(club)


@router.get("/clubs/current", response_model=ClubResponse)
async def current_club(club: Club = Depends(get_club)) -> ClubResponse:
    return ClubResponse.model_validate(club)


@router.patch("/clubs/current", response_model=ClubResponse)
async def update_current_club(
    payload: ClubUpdate,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> ClubResponse:
    updates = payload.model_dump(exclude_unset=True)
    if "is_active" in updates and user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can open or close a branch")
    if "name" in updates and updates["name"] is not None:
        updates["name"] = updates["name"].strip()
        clash = await db.scalar(select(Club.id).where(func.lower(Club.name) == updates["name"].lower(), Club.id != club.id))
        if clash:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A branch with this name already exists")
    for field in ("name", "monthly_fee", "uniform_price", "summer_start", "summer_end", "term_days", "summer_days",
                  "expiring_days", "critical_days", "low_stock_threshold", "is_active"):
        if field in updates and updates[field] is None:
            updates.pop(field)
    for field, value in updates.items():
        setattr(club, field, value)
    if club.critical_days >= club.expiring_days:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Red warning days must be fewer than yellow warning days")
    record_audit(db, user, "branch_updated", "club", club.id, f"Updated settings for {club.name}", {"fields": sorted(updates)}, club_id=club.id)
    await db.commit()
    await db.refresh(club)
    return ClubResponse.model_validate(club)


@router.get("/slots", response_model=list[SlotResponse])
async def list_slots(db: AsyncSession = Depends(get_db_session), club: Club = Depends(get_club)) -> list[SlotResponse]:
    rows = await db.scalars(select(ClassSlot).where(ClassSlot.club_id == club.id).order_by(ClassSlot.start_time))
    return [SlotResponse.model_validate(s) for s in rows.all()]


@router.post("/slots", response_model=SlotResponse, status_code=status.HTTP_201_CREATED)
async def create_slot(
    payload: SlotWrite,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SlotResponse:
    slot = ClassSlot(club_id=club.id, **payload.model_dump())
    db.add(slot)
    await db.flush()
    record_audit(db, user, "slot_created", "slot", slot.id, f"Added class {slot.start_time:%H:%M}-{slot.end_time:%H:%M}", club_id=club.id)
    await db.commit()
    await db.refresh(slot)
    return SlotResponse.model_validate(slot)


@router.put("/slots/{slot_id}", response_model=SlotResponse)
async def update_slot(
    slot_id: int,
    payload: SlotWrite,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> SlotResponse:
    slot = await get_owned(db, ClassSlot, slot_id, club, "Class")
    for field, value in payload.model_dump().items():
        setattr(slot, field, value)
    record_audit(db, user, "slot_updated", "slot", slot.id, f"Updated class {slot.start_time:%H:%M}-{slot.end_time:%H:%M}", club_id=club.id)
    await db.commit()
    await db.refresh(slot)
    return SlotResponse.model_validate(slot)


@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slot(
    slot_id: int,
    db: AsyncSession = Depends(get_db_session),
    club: Club = Depends(get_club),
    user: AppUser = Depends(get_current_user),
) -> None:
    slot = await get_owned(db, ClassSlot, slot_id, club, "Class")
    in_use = await db.scalar(select(func.count(Student.id)).where(Student.slot_id == slot.id, Student.is_active.is_(True)))
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{in_use} kids train in this class. Move them to another class first, or switch the class off instead.",
        )
    record_audit(db, user, "slot_deleted", "slot", slot.id, f"Removed class {slot.start_time:%H:%M}-{slot.end_time:%H:%M}", club_id=club.id)
    await db.delete(slot)
    await db.commit()
