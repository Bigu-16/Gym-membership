from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.networks import validate_email

from app.models.enums import Gender, PaymentMethod
from app.schemas.validation import (
    normalize_emirates_id,
    normalize_phone,
    sanitize_plain_text,
    validate_person_name,
)

def normalize_email(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    try:
        return validate_email(str(value).strip())[1].lower()
    except Exception as exc:  # pydantic raises PydanticCustomError
        raise ValueError("email address is not valid") from exc


# Little Kids Karate takes children from age 3; allow a little headroom below that.
MIN_MEMBER_AGE = 2
MAX_MEMBER_AGE = 100


class MemberBase(BaseModel):
    name: str
    phone: str | None = None
    whatsapp_number: str | None = None
    emirates_id: str | None = None
    email: str | None = None
    telegram_chat_id: str | None = None
    parent_phone: str | None = None
    family_id: int | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    age: int = Field(ge=MIN_MEMBER_AGE, le=MAX_MEMBER_AGE)
    plan_id: int | None = None
    expiry_date: date | None = None
    messaging_opt_in: bool = True

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return validate_person_name(value)

    @field_validator("phone", "whatsapp_number", "parent_phone", mode="before")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return normalize_phone(value)

    @field_validator("emirates_id", mode="before")
    @classmethod
    def validate_emirates_id(cls, value: str | None) -> str | None:
        return normalize_emirates_id(value)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email_address(cls, value: str | None) -> str | None:
        return normalize_email(value)

    @field_validator("medical_issues", mode="before")
    @classmethod
    def sanitize_medical_issues(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return sanitize_plain_text(value) or None


class PaymentInput(BaseModel):
    """Fee collected together with a registration or renewal."""

    amount: Decimal = Field(ge=0)
    method: PaymentMethod = PaymentMethod.cash
    currency: str = Field(default="AED", min_length=3, max_length=3)
    note: str | None = None


class MemberCreate(MemberBase):
    is_frozen: bool = False
    payment: PaymentInput | None = None
    # Ticked when the student/parent agrees to the terms on the registration form.
    terms_accepted: bool = False

    @model_validator(mode="after")
    def require_contact(self) -> "MemberCreate":
        if not self.phone and not self.parent_phone and self.family_id is None:
            raise ValueError("phone is required for members registered without a parent/guardian")
        return self


class MemberUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    whatsapp_number: str | None = None
    emirates_id: str | None = None
    email: str | None = None
    telegram_chat_id: str | None = None
    parent_phone: str | None = None
    family_id: int | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    age: int | None = Field(default=None, ge=MIN_MEMBER_AGE, le=MAX_MEMBER_AGE)
    plan_id: int | None = None
    expiry_date: date | None = None
    is_frozen: bool | None = None
    messaging_opt_in: bool | None = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return validate_person_name(value) if value is not None else None

    @field_validator("phone", "whatsapp_number", "parent_phone", mode="before")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return normalize_phone(value)

    @field_validator("emirates_id", mode="before")
    @classmethod
    def validate_emirates_id(cls, value: str | None) -> str | None:
        return normalize_emirates_id(value)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email_address(cls, value: str | None) -> str | None:
        return normalize_email(value)

    @field_validator("medical_issues", mode="before")
    @classmethod
    def sanitize_medical_issues(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return sanitize_plain_text(value) or None

    @model_validator(mode="after")
    def reject_null_required(self) -> "MemberUpdate":
        for field in {"name", "age", "is_frozen", "messaging_opt_in"} & self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str | None
    whatsapp_number: str | None = None
    emirates_id: str | None = None
    email: str | None = None
    telegram_chat_id: str | None = None
    parent_phone: str | None = None
    family_id: int | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    age: int
    plan_id: int | None = None
    expiry_date: date | None = None
    messaging_opt_in: bool
    is_frozen: bool
    frozen_since: date | None = None
    freeze_until: date | None = None
    terms_accepted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class FreezeRequest(BaseModel):
    is_frozen: bool
    # Day the member comes back; their remaining days continue from then. None = open-ended.
    until: date | None = None


class FamilyFreezeRequest(FreezeRequest):
    pass


class RenewRequest(BaseModel):
    plan_id: int | None = None
    # "expiry" keeps any remaining days (renew early); "today" restarts from today.
    start_from: Literal["expiry", "today"] = "expiry"
    payment: PaymentInput | None = None


class FamilyParentCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str | None = None
    relationship: str = "parent"
    notes: str | None = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return validate_person_name(value)

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = normalize_phone(value)
        if not normalized:
            raise ValueError("parent phone is required")
        return normalized

    @field_validator("email", mode="before")
    @classmethod
    def validate_email_address(cls, value: str | None) -> str | None:
        return normalize_email(value)

    @field_validator("address", "relationship", "notes", mode="before")
    @classmethod
    def sanitize_text(cls, value: str | None) -> str | None:
        return sanitize_plain_text(value) if value is not None else None


class FamilyParentResponse(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str | None = None
    relationship: str
    notes: str | None = None


class FamilyMemberCreate(MemberCreate):
    @model_validator(mode="after")
    def require_contact(self) -> "FamilyMemberCreate":
        # Family trainees are reached through the parent/guardian.
        return self


class FamilyCreate(BaseModel):
    parent: FamilyParentCreate
    members: list[FamilyMemberCreate] = Field(min_length=1)


class FamilyGroupResponse(BaseModel):
    id: int
    parent: FamilyParentResponse
    members: list[MemberResponse]
