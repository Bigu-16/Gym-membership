from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.core.security import decode_access_token
from app.core.tenancy import bind_tenant
from app.models import AppUser, Club
from app.models.enums import ClubKind, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> AppUser:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        token_version = payload.get("ver", 0)
        if not subject:
            raise credentials_error
    except InvalidTokenError as exc:
        raise credentials_error from exc

    user = await db.scalar(select(AppUser).where(AppUser.email == subject))
    if user is None or not user.is_active or user.token_version != token_version:
        raise credentials_error
    return user


async def get_current_admin_user(current_user: AppUser = Depends(get_current_user)) -> AppUser:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


async def get_current_admin_or_staff_user(current_user: AppUser = Depends(get_current_user)) -> AppUser:
    if current_user.role not in {UserRole.admin, UserRole.staff}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or staff access required")
    return current_user



async def get_tenant(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Club:
    """The signed-in account's own tenant. There is no way to ask for another tenant."""
    club = await db.get(Club, current_user.club_id)
    if club is None or not club.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This gym account is not active")
    # From here on every query in this request is limited to this tenant (app/core/tenancy.py).
    bind_tenant(db, club.id)
    return club


async def get_gym(club: Club = Depends(get_tenant)) -> Club:
    """Tenant for the gym app (members, packages, schedule). Taekwondo accounts get 404 here."""
    if club.kind != ClubKind.gym:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return club


async def get_club(club: Club = Depends(get_tenant)) -> Club:
    """Tenant for the taekwondo app. Gym accounts get 404 here."""
    if club.kind != ClubKind.taekwondo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return club


async def get_owned(db: AsyncSession, model, object_id: int, club: Club, label: str = "Record"):
    """Fetch a row only if it belongs to this tenant; otherwise behave as if it does not exist."""
    row = await db.get(model, object_id)
    if row is None or getattr(row, "club_id", None) != club.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    return row
