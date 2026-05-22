from fastapi import APIRouter
from sqlalchemy import text

from app.db import get_db_session

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> dict[str, str]:
    async with get_db_session() as session:
        await session.execute(text("SELECT 1"))
    return {"status": "ok"}
