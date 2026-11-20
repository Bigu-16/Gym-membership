"""Which days are class days.

School season (default Sep - Jun): weekends only. Summer (default Jun 15 - Sep 10): Monday to
Saturday. A class happens on a day when the day is a class day for the season AND the slot runs
on that weekday (e.g. the afternoon 8-9 slot does not run on Sunday).
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.models import ClassSlot, Club


def _md(value: str) -> tuple[int, int]:
    month, day = value.split("-")
    return int(month), int(day)


def is_summer(club: Club, day: date) -> bool:
    start, end = _md(club.summer_start), _md(club.summer_end)
    current = (day.month, day.day)
    if start <= end:
        return start <= current <= end
    # A window that crosses the new year (not used today, but keep it correct).
    return current >= start or current <= end


def season_days(club: Club, day: date) -> list[int]:
    return list(club.summer_days if is_summer(club, day) else club.term_days)


def is_class_day(club: Club, day: date) -> bool:
    return day.weekday() in season_days(club, day)


def slot_runs_on(club: Club, slot: ClassSlot, day: date) -> bool:
    return slot.is_active and is_class_day(club, day) and day.weekday() in (slot.weekdays or [])


def class_dates(club: Club, slot: ClassSlot | None, start: date, end: date) -> list[date]:
    """Class days for the slot (or any slot when None) from start to end inclusive."""
    if end < start:
        return []
    days: list[date] = []
    current = start
    while current <= end:
        if slot is None:
            if is_class_day(club, current):
                days.append(current)
        elif slot_runs_on(club, slot, current):
            days.append(current)
        current += timedelta(days=1)
    return days


def club_today(club: Club) -> date:
    return datetime.now(ZoneInfo(club.timezone or "Africa/Addis_Ababa")).date()
