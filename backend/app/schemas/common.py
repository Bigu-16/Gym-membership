import re
from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator, BeforeValidator, Field

from app.schemas.validation import sanitize_plain_text, validate_person_name

_ET_LOCAL = re.compile(r"^0?([79]\d{8})$")
_ET_INTL = re.compile(r"^\+?251([79]\d{8})$")
_GENERIC = re.compile(r"^\+[1-9]\d{6,14}$")


def normalize_et_phone(value: str | None) -> str | None:
    """Ethiopian mobiles in any common form (0911..., 911..., +251911...) -> +251911...

    Other international numbers (+44..., +1...) are kept as typed, for parents abroad.
    """
    if value is None:
        return None
    cleaned = re.sub(r"[\s\-().]", "", sanitize_plain_text(str(value)))
    if not cleaned:
        return None
    if match := _ET_INTL.fullmatch(cleaned):
        return "+251" + match.group(1)
    if match := _ET_LOCAL.fullmatch(cleaned):
        return "+251" + match.group(1)
    if _GENERIC.fullmatch(cleaned):
        return cleaned
    raise ValueError("phone number is not valid (example: 0911 223 344)")


def _optional_text(value):
    if value is None:
        return None
    cleaned = sanitize_plain_text(str(value))
    return cleaned or None


PersonName = Annotated[str, BeforeValidator(lambda v: validate_person_name(str(v))), Field(max_length=120)]
Phone = Annotated[str, AfterValidator(lambda v: normalize_et_phone(v)), Field(max_length=30)]
OptionalPhone = Annotated[str | None, BeforeValidator(lambda v: normalize_et_phone(v) if v not in (None, "") else None)]
OptionalText = Annotated[str | None, BeforeValidator(_optional_text)]
Money = Annotated[Decimal, Field(ge=0, le=10_000_000, decimal_places=2)]
