from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_or_staff_user, get_current_admin_user, get_current_user
from app.db import get_db_session
from app.models import AppUser, Enrollment, ScheduleTemplate, Session
from app.schemas.schedule import (
    ScheduleTemplateCreate,
    ScheduleTemplateResponse,
    ScheduleTemplateUpdate,
    SessionCreate,
    SessionResponse,
    SessionStatusUpdate,
    SessionUpdate,
)

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/templates", response_model=list[ScheduleTemplateResponse])
async def list_schedule_templates(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[ScheduleTemplateResponse]:
    result = await db.scalars(select(ScheduleTemplate).order_by(ScheduleTemplate.title))
    return [ScheduleTemplateResponse.model_validate(item) for item in result.all()]


@router.post("/templates", response_model=ScheduleTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule_template(
    payload: ScheduleTemplateCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> ScheduleTemplateResponse:
    template = ScheduleTemplate(**payload.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return ScheduleTemplateResponse.model_validate(template)


@router.patch("/templates/{template_id}", response_model=ScheduleTemplateResponse)
async def update_schedule_template(
    template_id: int,
    payload: ScheduleTemplateUpdate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> ScheduleTemplateResponse:
    template = await db.get(ScheduleTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule template not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return ScheduleTemplateResponse.model_validate(template)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule_template(
    template_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> None:
    template = await db.get(ScheduleTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule template not found")

    # Preserve session and enrollment history while removing their template reference.
    await db.execute(update(Session).where(Session.template_id == template_id).values(template_id=None))
    await db.execute(update(Enrollment).where(Enrollment.template_id == template_id).values(template_id=None))
    await db.delete(template)
    await db.commit()


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[SessionResponse]:
    result = await db.scalars(select(Session).order_by(Session.date.desc()))
    return [SessionResponse.model_validate(item) for item in result.all()]


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> SessionResponse:
    session = Session(**payload.model_dump())
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    payload: SessionUpdate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_or_staff_user),
) -> SessionResponse:
    session = await db.get(Session, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.patch("/sessions/{session_id}/status", response_model=SessionResponse)
async def update_session_status(
    session_id: int,
    payload: SessionStatusUpdate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> SessionResponse:
    session = await db.get(Session, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.status = payload.status
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)
