from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "gym_management_backend",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "membership-expiry-reminders-daily": {
            "task": "app.tasks.send_membership_expiry_reminders",
            "schedule": 60 * 60 * 24,
        },
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
