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
    # admin: manages the tenant's settings and staff. staff: day-to-day work. Both see only their own tenant.
    admin = "admin"
    staff = "staff"


class PaymentMethod(StrEnum):
    cash = "cash"
    card = "card"
    bank_transfer = "bank_transfer"
    other = "other"


class PaymentKind(StrEnum):
    new = "new"
    renewal = "renewal"


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


class ClubKind(StrEnum):
    """Which app a tenant uses. Tenants never share data or accounts."""

    gym = "gym"  # the N & T Center gym app (members, packages, schedule, check-ins)
    taekwondo = "taekwondo"  # the kids' taekwondo club app (families, uniforms, seasons)


class FeeMethod(StrEnum):
    cash = "cash"
    telebirr = "telebirr"
    cbe = "cbe"
    boa = "boa"  # Bank of Abyssinia


class UniformOrderStatus(StrEnum):
    ordered = "ordered"
    received = "received"
    cancelled = "cancelled"


class AttendanceStatus(StrEnum):
    present = "present"
    absent = "absent"
