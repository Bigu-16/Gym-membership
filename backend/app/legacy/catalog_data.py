"""Frozen data used only by the historical 20261015_0007 migration. Do not import elsewhere."""
from dataclasses import dataclass, field
from decimal import Decimal


PROGRAMS = ["Taekwondo", "Karate", "Kickboxing", "Kung Fu", "Fitness"]

THREE_MONTH_PERKS = {
    "Taekwondo": ["Free uniform"],
    "Karate": ["Free uniform"],
    "Kickboxing": ["Free gloves"],
}

PROGRAM_DESCRIPTIONS = {
    "Fitness": "Zumba fitness",
}

SIX_MONTH_PRICE_OVERRIDES = {"Fitness": Decimal("1450.00")}
# Programs that appear on the registration form's 6-month / 1-year price table.
LONG_TERM_PROGRAMS = {"Taekwondo", "Karate", "Kickboxing", "Fitness"}


@dataclass(frozen=True)
class PackageSpec:
    name: str
    program: str
    duration_label: str
    duration_months: int
    duration_days: int
    classes_per_week: int
    price: Decimal
    sort_order: int
    included_items: list[str] = field(default_factory=list)
    description: str | None = None


def official_packages() -> list[PackageSpec]:
    packages: list[PackageSpec] = []
    for index, program in enumerate(PROGRAMS):
        base = (index + 1) * 10
        description = PROGRAM_DESCRIPTIONS.get(program)
        long_term = [
            PackageSpec(
                name=f"{program} Six Month - 3 Classes",
                program=program,
                duration_label="6 Months",
                duration_months=6,
                duration_days=180,
                classes_per_week=3,
                price=SIX_MONTH_PRICE_OVERRIDES.get(program, Decimal("1400.00")),
                sort_order=base + 3,
                description=description,
            ),
            PackageSpec(
                name=f"{program} One Year - 3 Classes",
                program=program,
                duration_label="1 Year",
                duration_months=12,
                duration_days=365,
                classes_per_week=3,
                price=Decimal("2550.00"),
                sort_order=base + 4,
                description=description,
            ),
        ]
        packages.extend(
            [
                PackageSpec(
                    name=f"{program} One Month - 2 Classes",
                    program=program,
                    duration_label="One Month",
                    duration_months=1,
                    duration_days=30,
                    classes_per_week=2,
                    price=Decimal("300.00"),
                    sort_order=base,
                    description=description,
                ),
                PackageSpec(
                    name=f"{program} One Month - 3 Classes",
                    program=program,
                    duration_label="One Month",
                    duration_months=1,
                    duration_days=30,
                    classes_per_week=3,
                    price=Decimal("350.00"),
                    sort_order=base + 1,
                    description=description,
                ),
                PackageSpec(
                    name=f"{program} Three Month - 3 Classes",
                    program=program,
                    duration_label="3 Months",
                    duration_months=3,
                    duration_days=90,
                    classes_per_week=3,
                    price=Decimal("900.00"),
                    sort_order=base + 2,
                    included_items=list(THREE_MONTH_PERKS.get(program, [])),
                    description=description,
                ),
            ]
            + (long_term if program in LONG_TERM_PROGRAMS else [])
        )
    return packages


@dataclass(frozen=True)
class ClassSpec:
    title: str
    days: list[str]
    time: str
    capacity: int | None = None


MWF = ["Monday", "Wednesday", "Friday"]
TTS = ["Tuesday", "Thursday", "Saturday"]

# Mirrors the timetable printed on the official registration form (Mon–Sat, 4–9 PM).
OFFICIAL_TIMETABLE: list[ClassSpec] = [
    ClassSpec("Kids Taekwondo", MWF, "16:00 - 17:00"),
    ClassSpec("Kids Taekwondo", ["Monday", "Wednesday"], "17:00 - 18:00"),
    ClassSpec("Kids Karate", ["Friday"], "17:00 - 18:00"),
    ClassSpec("Kids Taekwondo", MWF, "18:00 - 19:00"),
    ClassSpec("Kids Taekwondo", MWF, "19:00 - 20:00"),
    ClassSpec("Kids Taekwondo", MWF, "20:00 - 21:00"),
    ClassSpec("Little Kids Karate", TTS, "16:00 - 17:00"),
    ClassSpec("Kids Karate", TTS, "17:00 - 18:00"),
    ClassSpec("Kids Karate", TTS, "18:00 - 19:00"),
    ClassSpec("Adult Kickboxing", TTS, "19:00 - 20:00"),
    ClassSpec("Adult Karate", TTS, "20:00 - 21:00"),
]


def start_of(time_value: str) -> str:
    """'16:00 - 17:00', '16:00' or '4:00 PM' -> '16:00'."""
    raw = time_value.split("-")[0].strip().upper()
    if raw.endswith(("AM", "PM")):
        clock, meridiem = raw[:-2].strip(), raw[-2:]
        hour, _, minute = clock.partition(":")
        hour_value = int(hour) % 12 + (12 if meridiem == "PM" else 0)
        return f"{hour_value:02d}:{(minute or '00')[:2]}"
    hour, _, minute = raw.partition(":")
    return f"{int(hour):02d}:{(minute or '00')[:2]}"


def class_key(title: str, days: list[str], time_value: str) -> tuple[str, tuple[str, ...], str]:
    return (title.strip().lower(), tuple(sorted(day.lower() for day in days)), start_of(time_value))


