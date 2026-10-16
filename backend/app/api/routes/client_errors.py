import logging

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.rate_limit import client_error_rate_limiter
from app.models import AppUser

router = APIRouter(prefix="/client-errors", tags=["monitoring"])
logger = logging.getLogger("app.client_errors")


class ClientErrorReport(BaseModel):
    message: str = Field(max_length=1000)
    stack: str | None = Field(default=None, max_length=8000)
    component_stack: str | None = Field(default=None, max_length=8000)
    page: str | None = Field(default=None, max_length=200)


@router.post("/", status_code=status.HTTP_204_NO_CONTENT)
async def report_client_error(
    report: ClientErrorReport,
    request: Request,
    user: AppUser = Depends(get_current_user),
) -> None:
    """Crashes caught by the web app's error boundary, logged (and sent to Sentry if configured)."""
    await client_error_rate_limiter.check(request)
    logger.error(
        "Web app error on %s for user_id=%s: %s\n%s\n%s",
        report.page,
        user.id,
        report.message,
        report.stack or "",
        report.component_stack or "",
    )
