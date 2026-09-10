from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.validation import validate_person_name


class BootstrapAdminRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return validate_person_name(value)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CheckEmailRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)


class CheckEmailResponse(BaseModel):
    success: bool = True
    exists: bool


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.staff
    is_active: bool = True

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return validate_person_name(value)


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, value: str | None) -> str | None:
        return validate_person_name(value) if value is not None else None


class UserPasswordResetRequest(BaseModel):
    password: str
