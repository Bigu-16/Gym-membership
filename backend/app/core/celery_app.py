from celery import Celery
from celery.schedules import crontab

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
    timezone=settings.gym_timezone,
    enable_utc=True,
    task_track_started=True,
    # Publishing happens inside HTTP requests (e.g. welcome messages on registration).
    # If Redis is unreachable, fail fast instead of blocking the request for ~20s per call.
    broker_connection_timeout=2,
    task_publish_retry_policy={"max_retries": 1, "interval_start": 0, "interval_step": 0.2, "interval_max": 0.5},
    broker_transport_options={"socket_connect_timeout": 2, "socket_timeout": 2},
    # Tasks are fire-and-forget; nobody reads their results.
    task_ignore_result=True,
    redis_socket_connect_timeout=2,
    redis_socket_timeout=2,
    result_backend_max_retries=1,
    beat_schedule={
        "membership-expiry-reminders-daily": {
            "task": "app.tasks.send_membership_expiry_reminders",
            # 09:00 gym time every day, rather than 24h after whenever beat started.
            "schedule": crontab(hour=9, minute=0),
        },
        "process-notification-jobs-every-minute": {
            "task": "app.tasks.process_pending_notification_jobs",
            "schedule": 60,
        },
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
