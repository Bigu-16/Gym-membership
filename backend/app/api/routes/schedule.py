from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.models import ScheduleTemplate, Session
from app.schemas.schedule import (
    ScheduleTemplateCreate,
    ScheduleTemplateResponse,
    SessionCreate,
    SessionResponse,
    SessionStatusUpdate,
)

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/templates", response_model=list[ScheduleTemplateResponse])
async def list_schedule_templates(db: AsyncSession = Depends(get_db_session)) -> list[ScheduleTemplateResponse]:
    result = await db.scalars(select(ScheduleTemplate).order_by(ScheduleTemplate.title))
    return [ScheduleTemplateResponse.model_validate(item) for item in result.all()]


@router.post("/templates", response_model=ScheduleTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule_template(
    payload: ScheduleTemplateCreate,
    db: AsyncSession = Depends(get_db_session),
) -> ScheduleTemplateResponse:
    template = ScheduleTemplate(**payload.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return ScheduleTemplateResponse.model_validate(template)


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db_session)) -> list[SessionResponse]:
    result = await db.scalars(select(Session).order_by(Session.date.desc()))
    return [SessionResponse.model_validate(item) for item in result.all()]


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate, db: AsyncSession = Depends(get_db_session)) -> SessionResponse:
    session = Session(**payload.model_dump())
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.patch("/sessions/{session_id}/status", response_model=SessionResponse)
async def update_session_status(
    session_id: int,
    payload: SessionStatusUpdate,
    db: AsyncSession = Depends(get_db_session),
) -> SessionResponse:
    session = await db.get(Session, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.status = payload.status
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)
