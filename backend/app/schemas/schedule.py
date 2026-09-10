from datetime import date as Date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import ScheduleType, SessionStatus
from app.schemas.validation import sanitize_json_text, sanitize_plain_text, validate_person_name

VALID_WEEKDAYS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
TIME_PATTERN = (
    r"^(?:(?:[01]\d|2[0-3]):[0-5]\d|(?i:(?:0?[1-9]|1[0-2]):[0-5]\d\s*(?:AM|PM)))"
    r"(?:\s*-\s*(?:(?:[01]\d|2[0-3]):[0-5]\d|(?i:(?:0?[1-9]|1[0-2]):[0-5]\d\s*(?:AM|PM))))?$"
)


def validate_days(days: list[str]) -> list[str]:
    normalized = [sanitize_plain_text(day).capitalize() for day in days]
    if any(day.lower() not in VALID_WEEKDAYS for day in normalized):
        raise ValueError("days must contain valid weekday names")
    if len(normalized) != len(set(normalized)):
        raise ValueError("days cannot contain duplicates")
    return normalized


class ScheduleTemplateCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    type: ScheduleType
    days: list[str] = Field(min_length=1)
    time: str = Field(pattern=TIME_PATTERN)
    capacity: int = Field(ge=1, le=10000)

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, value: str) -> str:
        return sanitize_plain_text(value)

    @field_validator("days", mode="before")
    @classmethod
    def validate_weekdays(cls, value: list[str]) -> list[str]:
        return validate_days(value)


class ScheduleTemplateUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    type: ScheduleType | None = None
    days: list[str] | None = Field(default=None, min_length=1)
    time: str | None = Field(
        default=None,
        pattern=TIME_PATTERN,
    )
    capacity: int | None = Field(default=None, ge=1, le=10000)

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, value: str | None) -> str | None:
        return sanitize_plain_text(value) if value is not None else None

    @field_validator("days", mode="before")
    @classmethod
    def validate_weekdays(cls, value: list[str] | None) -> list[str] | None:
        return validate_days(value) if value is not None else None

    @model_validator(mode="after")
    def reject_nulls(self) -> "ScheduleTemplateUpdate":
        for field in self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class ScheduleTemplateResponse(ScheduleTemplateCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class SessionCreate(BaseModel):
    template_id: int | None = None
    date: Date
    trainer_name: str
    status: SessionStatus = SessionStatus.upcoming
    checklist_data: dict = Field(default_factory=dict)

    @field_validator("trainer_name", mode="before")
    @classmethod
    def validate_trainer_name(cls, value: str) -> str:
        return validate_person_name(value)

    @field_validator("checklist_data", mode="before")
    @classmethod
    def sanitize_checklist(cls, value: dict) -> dict:
        return sanitize_json_text(value)  # type: ignore[return-value]


class SessionUpdate(BaseModel):
    date: Date | None = None
    trainer_name: str | None = None
    status: SessionStatus | None = None
    checklist_data: dict | list = Field(default_factory=dict)

    @field_validator("trainer_name", mode="before")
    @classmethod
    def validate_trainer_name(cls, value: str | None) -> str | None:
        return validate_person_name(value) if value is not None else None

    @field_validator("checklist_data", mode="before")
    @classmethod
    def sanitize_checklist(cls, value: dict | list) -> dict | list:
        return sanitize_json_text(value)  # type: ignore[return-value]

    @model_validator(mode="after")
    def reject_nulls(self) -> "SessionUpdate":
        for field in self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class SessionStatusUpdate(BaseModel):
    status: SessionStatus


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int | None
    date: Date
    trainer_name: str
    status: SessionStatus
    checklist_data: dict | list
    created_at: datetime
    updated_at: datetime
