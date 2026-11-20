import secrets
from datetime import date, timedelta
from decimal import Decimal

from app.core.timeutils import add_months
from app.models import Student


def new_receipt_no(day: date) -> str:
    return f"R{day:%y%m%d}-{secrets.token_hex(2).upper()}"


def coverage_for(student: Student, months: int, today: date, start: date | None = None) -> tuple[date, date]:
    """The period a payment of `months` covers.

    A kid who is still paid up continues from the day after the current expiry, so paying early
    never loses days. An expired (or new) kid starts today, or on the chosen start date.
    """
    if start is None:
        if student.expiry_date is not None and student.expiry_date >= today:
            start = student.expiry_date + timedelta(days=1)
        else:
            start = today
    end = add_months(start, months) - timedelta(days=1)
    return start, end


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"))
