from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.core.security import decode_access_token
from app.models import AppUser, Club
from app.models.enums import UserRole

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


async def get_club(
    x_club_id: int | None = Header(default=None, alias="X-Club-Id"),
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Club:
    """The branch this request works on. Every branch-owned query must filter on its id.

    Staff are locked to their own branch. Owners pick a branch with the X-Club-Id header.
    """
    if current_user.role == UserRole.admin:
        if x_club_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a branch first")
        club_id = x_club_id
    else:
        if current_user.club_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is not linked to a branch")
        if x_club_id is not None and x_club_id != current_user.club_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only open your own branch")
        club_id = current_user.club_id
    club = await db.get(Club, club_id)
    if club is None or (not club.is_active and current_user.role != UserRole.admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return club


async def get_owned(db: AsyncSession, model, object_id: int, club: Club, label: str = "Record"):
    """Fetch a row only if it belongs to this branch; otherwise behave as if it does not exist."""
    row = await db.get(model, object_id)
    if row is None or getattr(row, "club_id", None) != club.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    return row
