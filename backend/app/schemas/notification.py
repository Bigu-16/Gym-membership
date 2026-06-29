from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationStatus, NotificationType


class NotificationJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int | None
    notification_type: NotificationType
    status: NotificationStatus
    scheduled_for: datetime
    processed_at: datetime | None
    payload: dict
    provider: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime
