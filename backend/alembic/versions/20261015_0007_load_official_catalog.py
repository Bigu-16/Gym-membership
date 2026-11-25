"""load the official N & T timetable and price list

Runs once on deploy so the live database has the classes from the registration form
and the packages from the price card / registration form without anyone pressing
"Load official ...". Same rules as the in-app buttons: only adds what is missing and
corrects prices of official packages; never deletes or edits other rows.

Revision ID: 20261015_0007
Revises: 20261014_0006
Create Date: 2026-10-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.services.catalog import OFFICIAL_TIMETABLE, class_key, official_packages

revision: str = "20261015_0007"
down_revision: str | None = "20261014_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


schedule_templates = sa.table(
    "schedule_templates",
    sa.column("id", sa.Integer),
    sa.column("title", sa.String),
    sa.column("type", sa.Enum("group", "personal", name="schedule_type_enum")),
    sa.column("days", sa.JSON),
    sa.column("time", sa.String),
    sa.column("capacity", sa.Integer),
)

membership_plans = sa.table(
    "membership_plans",
    sa.column("id", sa.Integer),
    sa.column("name", sa.String),
    sa.column("program", sa.String),
    sa.column("duration_label", sa.String),
    sa.column("duration_months", sa.Integer),
    sa.column("duration_days", sa.Integer),
    sa.column("classes_per_week", sa.Integer),
    sa.column("price", sa.Numeric(10, 2)),
    sa.column("currency", sa.String),
    sa.column("included_items", sa.JSON),
    sa.column("description", sa.Text),
    sa.column("sort_order", sa.Integer),
    sa.column("is_active", sa.Boolean),
)


def load_official_catalog(bind: sa.engine.Connection) -> dict[str, int]:
    existing = bind.execute(sa.select(schedule_templates.c.title, schedule_templates.c.days, schedule_templates.c.time)).all()
    existing_keys = {class_key(title, days or [], time) for title, days, time in existing}
    classes_added = 0
    for spec in OFFICIAL_TIMETABLE:
        if class_key(spec.title, spec.days, spec.time) in existing_keys:
            continue
        bind.execute(
            schedule_templates.insert().values(
                title=spec.title, type="group", days=list(spec.days), time=spec.time, capacity=spec.capacity
            )
        )
        classes_added += 1

    packages_added = packages_updated = 0
    for spec in official_packages():
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
        plan_id = bind.scalar(sa.select(membership_plans.c.id).where(membership_plans.c.name == spec.name))
        if plan_id is None:
            bind.execute(membership_plans.insert().values(name=spec.name, is_active=True, **values))
            packages_added += 1
        else:
            bind.execute(membership_plans.update().where(membership_plans.c.id == plan_id).values(**values))
            packages_updated += 1
    return {"classes_added": classes_added, "packages_added": packages_added, "packages_updated": packages_updated}


def upgrade() -> None:
    if op.get_context().as_sql:
        return  # data load needs a live database; nothing to render offline
    load_official_catalog(op.get_bind())


def downgrade() -> None:
    # Data-only migration: rows may already be in use by members, so nothing is removed.
    pass
