from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user
from app.core.security import hash_password
from app.db import get_db_session
from app.models import AppUser
from app.schemas.auth import UserCreateRequest, UserPasswordResetRequest, UserResponse, UserUpdateRequest
from app.services.audit import record_audit

router = APIRouter(prefix="/users", tags=["users"])


async def _own_user(db: AsyncSession, admin: AppUser, user_id: int) -> AppUser:
    """Accounts of other gyms behave as if they do not exist."""
    user = await db.get(AppUser, user_id)
    if user is None or user.club_id != admin.club_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db_session),
    admin: AppUser = Depends(get_current_admin_user),
) -> list[UserResponse]:
    result = await db.scalars(select(AppUser).where(AppUser.club_id == admin.club_id).order_by(AppUser.created_at.desc()))
    return [UserResponse.model_validate(user) for user in result.all()]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    admin: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    # Emails are the login name, so they are unique across all gyms.
    existing = await db.scalar(select(AppUser).where(AppUser.email == payload.email.lower()))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")

    user = AppUser(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
        club_id=admin.club_id,  # always the admin's own gym
    )
    db.add(user)
    await db.flush()
    record_audit(db, admin, "user_created", "user", user.id, f"Created {user.role.value} account {user.email}", club_id=admin.club_id)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
    admin: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    return UserResponse.model_validate(await _own_user(db, admin, user_id))


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_admin: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    user = await _own_user(db, current_admin, user_id)

    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        normalized_email = updates["email"].lower()
        existing = await db.scalar(select(AppUser).where(AppUser.email == normalized_email, AppUser.id != user_id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")
        updates["email"] = normalized_email

    if user.id == current_admin.id and updates.get("is_active") is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account")
    if user.id == current_admin.id and updates.get("role") not in (None, current_admin.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove your own admin access")

    if updates.get("is_active") is False and user.is_active:
        user.token_version += 1  # a deactivated account is signed out everywhere immediately
    if "role" in updates and updates["role"] is not None and updates["role"] != user.role:
        user.token_version += 1  # new access applies on the next sign-in
    for field, value in updates.items():
        if value is None and field in {"full_name", "email", "role", "is_active"}:
            continue
        setattr(user, field, value)
    record_audit(db, current_admin, "user_updated", "user", user.id, f"Updated account {user.email}", {"fields": sorted(updates)}, club_id=current_admin.club_id)

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
    user = await _own_user(db, admin, user_id)
    user.password_hash = hash_password(payload.password)
    user.token_version += 1  # existing logins with the old password stop working
    record_audit(db, admin, "password_reset", "user", user.id, f"Reset password for {user.email}", club_id=admin.club_id)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
