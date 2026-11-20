from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user
from app.services.audit import record_audit
from app.core.security import hash_password
from app.db import get_db_session
from app.models import AppUser, Club
from app.models.enums import UserRole
from app.schemas.auth import UserCreateRequest, UserPasswordResetRequest, UserResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


async def _check_branch(db: AsyncSession, role: UserRole, club_id: int | None) -> int | None:
    """Staff must belong to an existing branch; owners never do."""
    if role == UserRole.admin:
        return None
    if club_id is None or await db.get(Club, club_id) is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Choose the branch this staff member works in")
    return club_id


@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> list[UserResponse]:
    result = await db.scalars(select(AppUser).order_by(AppUser.created_at.desc()))
    return [UserResponse.model_validate(user) for user in result.all()]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    admin: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    existing = await db.scalar(select(AppUser).where(AppUser.email == payload.email.lower()))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")

    user = AppUser(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
        club_id=await _check_branch(db, payload.role, payload.club_id),
    )
    db.add(user)
    await db.flush()
    record_audit(db, admin, "user_created", "user", user.id, f"Created {user.role.value} account {user.email}")
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    user = await db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_admin: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    user = await db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        normalized_email = updates["email"].lower()
        existing = await db.scalar(select(AppUser).where(AppUser.email == normalized_email, AppUser.id != user_id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")
        updates["email"] = normalized_email

    if "role" in updates or "club_id" in updates:
        role = updates.get("role") or user.role
        club_id = updates["club_id"] if "club_id" in updates else user.club_id
        if user.id == current_admin.id and role != UserRole.admin:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove your own owner access")
        updates["club_id"] = await _check_branch(db, role, club_id)
        if updates["club_id"] != user.club_id or role != user.role:
            user.token_version += 1  # moved branch / role: sign out so the new access applies

    if user.id == current_admin.id and updates.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    if updates.get("is_active") is False and user.is_active:
        user.token_version += 1  # a deactivated account is signed out everywhere immediately
    for field, value in updates.items():
        setattr(user, field, value)
    record_audit(db, current_admin, "user_updated", "user", user.id, f"Updated account {user.email}", {"fields": sorted(updates)})

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}/password", response_model=UserResponse)
async def reset_user_password(
    user_id: int,
    payload: UserPasswordResetRequest,
    db: AsyncSession = Depends(get_db_session),
    admin: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    user = await db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.password)
    user.token_version += 1  # existing logins with the old password stop working
    record_audit(db, admin, "password_reset", "user", user.id, f"Reset password for {user.email}")
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
