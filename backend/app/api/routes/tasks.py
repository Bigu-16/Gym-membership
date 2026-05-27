from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_admin_user
from app.models import AppUser
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
