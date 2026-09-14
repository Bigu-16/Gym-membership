from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user
from app.core.config import settings
from app.db import get_db_session
from app.models import AppUser
from app.services.demo_data import ADMIN_EMAIL, ADMIN_PASSWORD, STAFF_EMAIL, STAFF_PASSWORD, seed_demo_data
from app.tasks.notifications import process_pending_notification_jobs, send_membership_expiry_reminders

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/membership-expiry-reminders", status_code=status.HTTP_202_ACCEPTED)
async def trigger_membership_expiry_reminders(
    _: AppUser = Depends(get_current_admin_user),
) -> dict[str, str]:
    task = send_membership_expiry_reminders.delay()
    if not task.id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to queue task")
    return {"task_id": task.id, "status": "queued"}


@router.post("/process-notification-jobs", status_code=status.HTTP_202_ACCEPTED)
async def trigger_process_notification_jobs(
    _: AppUser = Depends(get_current_admin_user),
) -> dict[str, str]:
    task = process_pending_notification_jobs.delay()
    if not task.id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to queue task")
    return {"task_id": task.id, "status": "queued"}


@router.post("/seed-demo-data", status_code=status.HTTP_200_OK)
async def seed_demo_data_endpoint(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_admin_user),
) -> dict:
    if not settings.allows_development_endpoints:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    counts = await seed_demo_data(db)
    return {
        "status": "seeded",
        "counts": counts,
        "logins": {
            "admin": {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            "staff": {"email": STAFF_EMAIL, "password": STAFF_PASSWORD},
        },
    }
