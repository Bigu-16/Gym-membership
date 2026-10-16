from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AppUser, AuditLog


def record_audit(
    db: AsyncSession,
    actor: AppUser | None,
    action: str,
    entity_type: str,
    entity_id: object,
    summary: str,
    details: dict | None = None,
) -> None:
    """Add an activity-log row to the caller's transaction (committed with the change itself)."""
    db.add(
        AuditLog(
            actor_user_id=actor.id if actor else None,
            actor_email=actor.email if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            summary=summary[:500],
            details=details,
        )
    )
