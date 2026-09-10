from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import login_rate_limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db_session
from app.models import AppUser
from app.models.enums import UserRole
from app.schemas.auth import BootstrapAdminRequest, CheckEmailRequest, CheckEmailResponse, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email(
    payload: CheckEmailRequest,
    db: AsyncSession = Depends(get_db_session),
) -> CheckEmailResponse:
    email = payload.email.strip().lower()
    user_id = await db.scalar(select(AppUser.id).where(AppUser.email == email))
    return CheckEmailResponse(exists=user_id is not None)


@router.post("/bootstrap-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def bootstrap_admin(
    payload: BootstrapAdminRequest,
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    if not settings.allows_development_endpoints:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    user_count = await db.scalar(select(func.count(AppUser.id)))
    if (user_count or 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bootstrap is only available before the first user exists",
        )

    user = AppUser(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db_session),
) -> LoginResponse:
    await login_rate_limiter.check(request)
    user = await db.scalar(select(AppUser).where(AppUser.email == form_data.username.lower()))
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    token = create_access_token(user.email)
    return LoginResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: AppUser = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
