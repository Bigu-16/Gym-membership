import re
from datetime import time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.common import Money, OptionalText

_MD = re.compile(r"^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")


def _weekdays(value: list[int]) -> list[int]:
    days = sorted(set(value))
    if any(d < 0 or d > 6 for d in days):
        raise ValueError("weekdays are 0 (Monday) to 6 (Sunday)")
    return days


class ClubResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    name_am: str | None
    is_active: bool
    timezone: str
    currency: str
    monthly_fee: Decimal
    uniform_price: Decimal
    summer_start: str
    summer_end: str
    term_days: list[int]
    summer_days: list[int]
    expiring_days: int
    critical_days: int
    low_stock_threshold: int


class ClubCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    name_am: OptionalText = None
    monthly_fee: Money = Decimal("0")


class ClubUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    name_am: OptionalText = None
    is_active: bool | None = None
    monthly_fee: Money | None = None
    uniform_price: Money | None = None
    summer_start: str | None = None
    summer_end: str | None = None
    term_days: list[int] | None = None
    summer_days: list[int] | None = None
    expiring_days: int | None = Field(default=None, ge=1, le=60)
    critical_days: int | None = Field(default=None, ge=0, le=30)
    low_stock_threshold: int | None = Field(default=None, ge=0, le=500)

    @field_validator("summer_start", "summer_end")
    @classmethod
    def month_day(cls, value: str | None) -> str | None:
        if value is not None and not _MD.fullmatch(value):
            raise ValueError("use MM-DD, e.g. 06-15")
        return value

    @field_validator("term_days", "summer_days")
    @classmethod
    def days(cls, value: list[int] | None) -> list[int] | None:
        return _weekdays(value) if value is not None else None


class SlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_time: time
    end_time: time
    weekdays: list[int]
    is_active: bool


class SlotWrite(BaseModel):
    start_time: time
    end_time: time
    weekdays: list[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    is_active: bool = True

    @field_validator("weekdays")
    @classmethod
    def days(cls, value: list[int]) -> list[int]:
        return _weekdays(value)

    @model_validator(mode="after")
    def ordered(self):
        if self.end_time <= self.start_time:
            raise ValueError("end time must be after start time")
        return self
