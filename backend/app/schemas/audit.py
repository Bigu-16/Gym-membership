from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    actor_user_id: int | None
    actor_email: str | None
    action: str
    entity_type: str
    entity_id: str | None
    summary: str
    details: dict | None
