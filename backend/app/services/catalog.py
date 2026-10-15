"""Official N & T Taekwondo & Karate Center catalog.

Single source of truth for the weekly class timetable and the package price list.
Used by the demo seed and by the admin "load official schedule/packages" endpoints,
so production and development always agree.

Pricing reconciles the two printed sources:
* Front-desk price card (authoritative for 1- and 3-month packages):
  2 classes/week 300 AED, 3 classes/week 350 AED, 3 months 900 AED with a perk.
* Registration form (adds the longer packages the card does not list):
  6 months 1400 AED (Zumba fitness 1450 AED) and 1 year 2550 AED.
Where the two disagree (form: 1 month 300 / 3 months 800) the price card wins.
Kung Fu is only on the price card, so it only has the 1- and 3-month packages.
Class sizes are not printed anywhere, so official classes have no capacity limit.
"""

from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MembershipPlan, ScheduleTemplate
from app.models.enums import ScheduleType

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


async def sync_official_packages(session: AsyncSession) -> dict[str, int]:
    """Create missing official packages and correct drifted prices. Never deletes plans."""
    created = updated = 0
    for spec in official_packages():
        plan = await session.scalar(select(MembershipPlan).where(MembershipPlan.name == spec.name))
        values = {
            "program": spec.program,
            "duration_label": spec.duration_label,
            "duration_months": spec.duration_months,
            "duration_days": spec.duration_days,
            "classes_per_week": spec.classes_per_week,
            "price": spec.price,
            "currency": "AED",
            "included_items": list(spec.included_items),
            "description": spec.description,
            "sort_order": spec.sort_order,
        }
        if plan is None:
            session.add(MembershipPlan(name=spec.name, is_active=True, **values))
            created += 1
            continue
        changed = False
        for key, value in values.items():
            if getattr(plan, key) != value:
                setattr(plan, key, value)
                changed = True
        if changed:
            updated += 1
    await session.flush()
    return {"created": created, "updated": updated, "total": len(official_packages())}


async def sync_official_timetable(session: AsyncSession) -> dict[str, int]:
    """Create any missing timetable slots. Existing slots (even edited ones) are kept."""
    existing = (await session.scalars(select(ScheduleTemplate))).all()
    existing_keys = {class_key(item.title, item.days, item.time) for item in existing}
    created = 0
    for spec in OFFICIAL_TIMETABLE:
        if class_key(spec.title, spec.days, spec.time) in existing_keys:
            continue
        session.add(
            ScheduleTemplate(
                title=spec.title,
                type=ScheduleType.group,
                days=list(spec.days),
                time=spec.time,
                capacity=spec.capacity,
            )
        )
        created += 1
    await session.flush()
    return {"created": created, "total": len(OFFICIAL_TIMETABLE)}
