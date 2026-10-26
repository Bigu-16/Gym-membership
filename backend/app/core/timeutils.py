"""Gym-local clock helpers.

The server and database run in UTC, but the center operates on Gulf time. Anything
that means "today" (dashboards, expiry checks, reminders, reports) must use these.
"""

import calendar
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.core.config import settings


def gym_tz() -> ZoneInfo:
    return ZoneInfo(settings.gym_timezone)


def gym_now() -> datetime:
    return datetime.now(gym_tz())


def gym_today() -> date:
    return gym_now().date()


def to_gym_time(value: datetime) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(gym_tz())


def gym_day_bounds_utc(day: date) -> tuple[datetime, datetime]:
    """UTC [start, end) instants covering a gym-local calendar day."""
    start = datetime.combine(day, time.min, tzinfo=gym_tz())
    end = start + timedelta(days=1)
    return start.astimezone(UTC), end.astimezone(UTC)


def add_months(start: date, months: int) -> date:
    """Calendar-month addition that clamps to month end (Jan 31 + 1 month = Feb 28/29)."""
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)
