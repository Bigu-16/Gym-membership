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


class UserRole(StrEnum):
    admin = "admin"
    staff = "staff"


class NotificationType(StrEnum):
    welcome = "welcome"
    membership_expiry = "membership_expiry"
    session_reminder = "session_reminder"
    enrollment = "enrollment"
    class_enrollment = "class_enrollment"
    announcement = "announcement"


class NotificationStatus(StrEnum):
    pending = "pending"
    processed = "processed"
    failed = "failed"


class NotificationChannel(StrEnum):
    whatsapp = "whatsapp"
    telegram = "telegram"
    email = "email"


class AnnouncementStatus(StrEnum):
    draft = "draft"
    queued = "queued"
    sent = "sent"
