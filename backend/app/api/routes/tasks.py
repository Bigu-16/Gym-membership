from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_admin_user
from app.models import AppUser
from app.tasks.reminders import send_membership_expiry_reminders

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/membership-expiry-reminders", status_code=status.HTTP_202_ACCEPTED)
async def trigger_membership_expiry_reminders(
    _: AppUser = Depends(get_current_admin_user),
) -> dict[str, str]:
    task = send_membership_expiry_reminders.delay()
    if not task.id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to queue task")
    return {"task_id": task.id, "status": "queued"}
