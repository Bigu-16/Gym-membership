from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.validation import validate_person_name

MIN_PASSWORD_LENGTH = 10


def validate_password_strength(value: str) -> str:
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"password must be at least {MIN_PASSWORD_LENGTH} characters")
    if len(value.encode()) > 72:
        raise ValueError("password must be at most 72 bytes")
    if value.lower() == value or value.upper() == value or not any(ch.isdigit() for ch in value):
        raise ValueError("password must mix upper- and lower-case letters and include a number")
    return value


class BootstrapAdminRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return validate_person_name(value)

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return validate_password_strength(value)


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
    # Plain str: responses must never fail on an already-stored address.
    email: str
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

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return validate_password_strength(value)


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

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return validate_password_strength(value)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return validate_password_strength(value)
