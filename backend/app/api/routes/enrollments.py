from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user, get_current_user
from app.db import get_db_session
from app.models import AppUser
from app.models import Enrollment, Member, ScheduleTemplate, Session
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("/", response_model=list[EnrollmentResponse])
async def list_enrollments(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[EnrollmentResponse]:
    result = await db.scalars(select(Enrollment).order_by(Enrollment.created_at.desc()))
    return [EnrollmentResponse.model_validate(item) for item in result.all()]


@router.post("/", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    payload: EnrollmentCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> EnrollmentResponse:
    member = await db.scalar(select(Member).where(Member.id == payload.member_id).with_for_update())
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.is_frozen:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Frozen members cannot be enrolled",
        )

    target_filter = (
        Enrollment.template_id == payload.template_id
        if payload.template_id is not None
        else Enrollment.session_id == payload.session_id
    )
    duplicate = await db.scalar(
        select(Enrollment.id).where(Enrollment.member_id == payload.member_id, target_filter)
    )
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Enrollment already exists")

    if payload.template_id is not None:
        template = await db.scalar(
            select(ScheduleTemplate).where(ScheduleTemplate.id == payload.template_id).with_for_update()
        )
        if template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule template not found")

        existing_count = await db.scalar(
            select(func.count(Enrollment.id)).where(Enrollment.template_id == payload.template_id)
        )
        if (existing_count or 0) >= template.capacity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Schedule template is at capacity",
            )

    if payload.session_id is not None:
        session = await db.scalar(select(Session).where(Session.id == payload.session_id).with_for_update())
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        template = None
        if session.template_id is not None:
            template = await db.scalar(
                select(ScheduleTemplate).where(ScheduleTemplate.id == session.template_id).with_for_update()
            )

        if template is not None:
            existing_count = await db.scalar(
                select(func.count(Enrollment.id)).where(Enrollment.session_id == payload.session_id)
            )
            if (existing_count or 0) >= template.capacity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Session is at capacity",
                )

    enrollment = Enrollment(**payload.model_dump())
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentResponse.model_validate(enrollment)


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> None:
    enrollment = await db.get(Enrollment, enrollment_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    await db.delete(enrollment)
    await db.commit()
