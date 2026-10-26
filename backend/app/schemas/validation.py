import re
from html.parser import HTMLParser


# Any script's letters (Latin, Arabic, ...) plus spaces, hyphens, apostrophes and periods.
NAME_PATTERN = re.compile(r"^[^\W\d_](?:[^\W\d_]|[\s\-'.])*$")


class _PlainTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._ignored_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"script", "style"}:
            self._ignored_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style"} and self._ignored_depth:
            self._ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self._ignored_depth:
            self.parts.append(data)


def sanitize_plain_text(value: str) -> str:
    """Remove HTML markup and normalize surrounding whitespace before persistence."""
    if not isinstance(value, str):
        raise ValueError("value must be a string")
    parser = _PlainTextExtractor()
    parser.feed(value)
    parser.close()
    return "".join(parser.parts).strip()


def validate_person_name(value: str) -> str:
    sanitized = sanitize_plain_text(value)
    if not sanitized:
        raise ValueError("name cannot be empty")
    if not NAME_PATTERN.fullmatch(sanitized):
        raise ValueError("name may contain only letters, spaces, hyphens, and apostrophes")
    return sanitized


PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9\s\-()]{5,28}$")
EMIRATES_ID_PATTERN = re.compile(r"^784-?\d{4}-?\d{7}-?\d$")


def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    sanitized = sanitize_plain_text(value)
    if not sanitized:
        return None
    if not PHONE_PATTERN.fullmatch(sanitized):
        raise ValueError("phone number is not valid")
    return sanitized


def normalize_emirates_id(value: str | None) -> str | None:
    if value is None:
        return None
    sanitized = sanitize_plain_text(value).replace(" ", "")
    if not sanitized:
        return None
    if not EMIRATES_ID_PATTERN.fullmatch(sanitized):
        raise ValueError("Emirates ID must look like 784-YYYY-NNNNNNN-N")
    digits = sanitized.replace("-", "")
    return f"{digits[:3]}-{digits[3:7]}-{digits[7:14]}-{digits[14]}"


def sanitize_json_text(value: object) -> object:
    """Recursively sanitize string values in client-controlled JSON structures."""
    if isinstance(value, str):
        return sanitize_plain_text(value)
    if isinstance(value, list):
        return [sanitize_json_text(item) for item in value]
    if isinstance(value, dict):
        return {key: sanitize_json_text(item) for key, item in value.items()}
    return value
