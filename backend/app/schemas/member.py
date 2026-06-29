from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import Gender


class MemberBase(BaseModel):
    name: str
    phone: str
    parent_phone: str | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    plan_id: int | None = None
    expiry_date: date | None = None
    messaging_opt_in: bool = True


class MemberCreate(MemberBase):
    is_frozen: bool = False


class MemberUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    parent_phone: str | None = None
    gender: Gender | None = None
    medical_issues: str | None = None
    plan_id: int | None = None
    expiry_date: date | None = None
    is_frozen: bool | None = None
    messaging_opt_in: bool | None = None


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


class FamilyCreate(BaseModel):
    members: list[MemberCreate]


class FamilyGroupResponse(BaseModel):
    parent_phone: str
    members: list[MemberResponse]
