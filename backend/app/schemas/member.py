from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import Gender


class MemberBase(BaseModel):
    name: str
    phone: str
    parent_phone: str | None = None
    family_id: int | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    age: int = Field(ge=0, le=130)
    plan_id: int | None = None
    expiry_date: date | None = None
    messaging_opt_in: bool = True


class MemberCreate(MemberBase):
    is_frozen: bool = False


class MemberUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    parent_phone: str | None = None
    family_id: int | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    age: int | None = Field(default=None, ge=0, le=130)
    plan_id: int | None = None
    expiry_date: date | None = None
    is_frozen: bool | None = None
    messaging_opt_in: bool | None = None

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: int | None) -> int:
        if value is None:
            raise ValueError("age cannot be null")
        return value


class MemberResponse(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_frozen: bool
    created_at: datetime
    updated_at: datetime


class FreezeRequest(BaseModel):
    is_frozen: bool


class FamilyFreezeRequest(BaseModel):
    is_frozen: bool


class FamilyParentCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str | None = None
    relationship: str = "parent"
    notes: str | None = None


class FamilyParentResponse(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str | None = None
    relationship: str
    notes: str | None = None


class FamilyCreate(BaseModel):
    parent: FamilyParentCreate
    members: list[MemberCreate]


class FamilyGroupResponse(BaseModel):
    id: int
    parent: FamilyParentResponse
    members: list[MemberResponse]
