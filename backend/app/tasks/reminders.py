from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.send_welcome_message")
def send_welcome_message(member_id: int) -> dict[str, int | str]:
    return {"status": "queued", "member_id": member_id, "task": "welcome_message"}


@celery_app.task(name="app.tasks.send_membership_expiry_reminders")
def send_membership_expiry_reminders() -> dict[str, str]:
    return {"status": "queued", "task": "membership_expiry_reminders"}
