from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user, get_current_user
from app.db import get_db_session
from app.models import AppUser, Member, MembershipPlan
from app.schemas.membership_plan import MembershipPlanCreate, MembershipPlanResponse, MembershipPlanUpdate

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/", response_model=list[MembershipPlanResponse])
async def list_plans(
    program: str | None = None,
    is_active: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[MembershipPlanResponse]:
    stmt = select(MembershipPlan).order_by(MembershipPlan.sort_order, MembershipPlan.program, MembershipPlan.name)
    if program:
        stmt = stmt.where(func.lower(MembershipPlan.program) == program.lower())
    if is_active is not None:
        stmt = stmt.where(MembershipPlan.is_active == is_active)

    result = await db.scalars(stmt)
    return [MembershipPlanResponse.model_validate(plan) for plan in result.all()]


@router.post("/", response_model=MembershipPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    payload: MembershipPlanCreate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> MembershipPlanResponse:
    existing = await db.scalar(select(MembershipPlan.id).where(MembershipPlan.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Plan name is already in use")

    plan = MembershipPlan(**payload.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return MembershipPlanResponse.model_validate(plan)


@router.get("/{plan_id}", response_model=MembershipPlanResponse)
async def get_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> MembershipPlanResponse:
    plan = await db.get(MembershipPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return MembershipPlanResponse.model_validate(plan)


@router.put("/{plan_id}", response_model=MembershipPlanResponse)
async def update_plan(
    plan_id: int,
    payload: MembershipPlanUpdate,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> MembershipPlanResponse:
    plan = await db.get(MembershipPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates:
        existing = await db.scalar(
            select(MembershipPlan.id).where(MembershipPlan.name == updates["name"], MembershipPlan.id != plan_id)
        )
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Plan name is already in use")

    for field, value in updates.items():
        setattr(plan, field, value)

    await db.commit()
    await db.refresh(plan)
    return MembershipPlanResponse.model_validate(plan)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> None:
    plan = await db.get(MembershipPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    member_count = await db.scalar(select(func.count(Member.id)).where(Member.plan_id == plan_id))
    if member_count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Plan is assigned to members; deactivate it instead")

    await db.delete(plan)
    await db.commit()
