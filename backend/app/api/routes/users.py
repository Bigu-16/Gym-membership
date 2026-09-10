from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user
from app.core.security import hash_password
from app.db import get_db_session
from app.models import AppUser
from app.schemas.auth import UserCreateRequest, UserPasswordResetRequest, UserResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


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
    _: AppUser = Depends(get_current_admin_user),
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
    )
    db.add(user)
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

    if user.id == current_admin.id and updates.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    for field, value in updates.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}/password", response_model=UserResponse)
async def reset_user_password(
    user_id: int,
    payload: UserPasswordResetRequest,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> UserResponse:
    user = await db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.password)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
