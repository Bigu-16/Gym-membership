from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class MembershipPlanBase(BaseModel):
    name: str
    program: str = "General"
    duration_label: str = "One Month"
    duration_months: int = Field(default=1, ge=1, le=120)
    classes_per_week: int | None = Field(default=None, ge=1, le=14)
    price: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = Field(default="AED", min_length=3, max_length=3)
    included_items: list[str] = Field(default_factory=list)
    description: str | None = None
    duration_days: int = Field(default=30, ge=1)
    sort_order: int = 0
    is_active: bool = True

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("included_items")
    @classmethod
    def normalize_included_items(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item.strip()]


class MembershipPlanCreate(MembershipPlanBase):
    pass


class MembershipPlanUpdate(BaseModel):
    name: str | None = None
    program: str | None = None
    duration_label: str | None = None
    duration_months: int | None = Field(default=None, ge=1, le=120)
    classes_per_week: int | None = Field(default=None, ge=1, le=14)
    price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    included_items: list[str] | None = None
    description: str | None = None
    duration_days: int | None = Field(default=None, ge=1)
    sort_order: int | None = None
    is_active: bool | None = None

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        return value.upper() if value is not None else value

    @field_validator("included_items")
    @classmethod
    def normalize_included_items(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        return [item.strip() for item in value if item.strip()]

    @model_validator(mode="after")
    def reject_null_required_fields(self) -> "MembershipPlanUpdate":
        nullable_fields = {"classes_per_week", "description"}
        for field in self.model_fields_set - nullable_fields:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class MembershipPlanResponse(MembershipPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
