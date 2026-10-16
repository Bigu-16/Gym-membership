import logging

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin_user, get_current_user
from app.core.config import settings
from app.db import get_db_session
from app.models import AppUser
from app.services.demo_data import ADMIN_EMAIL, ADMIN_PASSWORD, STAFF_EMAIL, STAFF_PASSWORD, seed_demo_data
from app.models.enums import UserRole
from app.services.audit import record_audit
from app.tasks.notifications import process_pending_notification_jobs, run_daily_reminders, send_membership_expiry_reminders

router = APIRouter(prefix="/tasks", tags=["tasks"])
logger = logging.getLogger(__name__)


def enqueue(task) -> dict[str, str]:
    try:
        result = task.delay()
    except Exception as exc:  # broker (Redis) unreachable or misconfigured
        logger.exception("Failed to queue %s", task.name)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The background message queue is unavailable. Try again later.",
        ) from exc
    if not result.id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to queue task")
    return {"task_id": result.id, "status": "queued"}


optional_bearer = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


@router.post("/daily-reminders")
async def daily_reminders(
    x_cron_secret: str | None = Header(default=None),
    token: str | None = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, int]:
    """Send today's due expiry reminders now, in-process.

    Called once a day by the scheduler (header ``X-Cron-Secret``) or by an admin from the
    Notifications page. Safe to call repeatedly: each reminder goes out only once.
    """
    actor = None
    if x_cron_secret is not None:
        if not settings.cron_secret or not secrets.compare_digest(x_cron_secret, settings.cron_secret):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid scheduler secret")
    else:
        if token is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        actor = await get_current_user(token=token, db=db)
        if actor.role != UserRole.admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = await run_daily_reminders()
    if actor is not None:
        record_audit(db, actor, "reminders_sent", "settings", None, f"Sent due expiry reminders: {result['emails_queued']} email(s)")
        await db.commit()
    return result


@router.post("/membership-expiry-reminders", status_code=status.HTTP_202_ACCEPTED)
async def trigger_membership_expiry_reminders(
    _: AppUser = Depends(get_current_admin_user),
) -> dict[str, str]:
    return enqueue(send_membership_expiry_reminders)


@router.post("/process-notification-jobs", status_code=status.HTTP_202_ACCEPTED)
async def trigger_process_notification_jobs(
    _: AppUser = Depends(get_current_admin_user),
) -> dict[str, str]:
    return enqueue(process_pending_notification_jobs)


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
