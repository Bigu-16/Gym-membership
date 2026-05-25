from enum import StrEnum


class Gender(StrEnum):
    male = "male"
    female = "female"
    other = "other"


class ScheduleType(StrEnum):
    group = "group"
    personal = "personal"


class SessionStatus(StrEnum):
    upcoming = "upcoming"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
