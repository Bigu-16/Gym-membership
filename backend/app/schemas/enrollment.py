from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class EnrollmentCreate(BaseModel):
    member_id: int
    template_id: int | None = None
    session_id: int | None = None

    @model_validator(mode="after")
    def validate_target(self) -> "EnrollmentCreate":
        has_template = self.template_id is not None
        has_session = self.session_id is not None
        if has_template == has_session:
            raise ValueError("Provide exactly one of template_id or session_id")
        return self


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    template_id: int | None
    session_id: int | None
    created_at: datetime
    updated_at: datetime
