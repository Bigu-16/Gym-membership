from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import (
    AnnouncementStatus,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)


class NotificationJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int | None
    notification_type: NotificationType
    channel: NotificationChannel
    status: NotificationStatus
    recipient: str | None
    scheduled_for: datetime
    processed_at: datetime | None
    payload: dict
    provider: str
    provider_message_id: str | None
    attempts: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class AnnouncementFilters(BaseModel):
    plan_id: int | None = None
    program: str | None = None
    expired: bool | None = None


class AnnouncementCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)
    channels: list[NotificationChannel] = Field(min_length=1)
    filters: AnnouncementFilters = Field(default_factory=AnnouncementFilters)
    scheduled_for: datetime | None = None

    @model_validator(mode="after")
    def dedupe_channels(self) -> "AnnouncementCreate":
        # Preserve order while removing duplicate channels.
        seen: dict[NotificationChannel, None] = {}
        for channel in self.channels:
            seen.setdefault(channel, None)
        self.channels = list(seen.keys())
        return self


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    body: str
    channels: list[str]
    filters: dict
    status: AnnouncementStatus
    scheduled_for: datetime
    recipient_count: int
    job_count: int
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime
