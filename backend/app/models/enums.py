from enum import StrEnum


class UserRole(StrEnum):
    # admin = owner: manages every branch and the staff accounts.
    admin = "admin"
    # staff = works in one branch only.
    staff = "staff"


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
