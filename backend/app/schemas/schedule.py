from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ScheduleType, SessionStatus


class ScheduleTemplateCreate(BaseModel):
    title: str
    type: ScheduleType
    days: list[str]
    time: str
    capacity: int


class ScheduleTemplateResponse(ScheduleTemplateCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class SessionCreate(BaseModel):
    template_id: int | None = None
    date: date
    trainer_name: str
    status: SessionStatus = SessionStatus.upcoming
    checklist_data: dict = Field(default_factory=dict)


class SessionStatusUpdate(BaseModel):
    status: SessionStatus


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int | None
    date: date
    trainer_name: str
    status: SessionStatus
    checklist_data: dict
    created_at: datetime
    updated_at: datetime
