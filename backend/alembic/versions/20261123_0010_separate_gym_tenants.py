"""separate tenants: the existing gym and the taekwondo club never share data or accounts

* clubs.kind says which app a tenant uses: "gym" (the existing N & T Center app) or
  "taekwondo" (the kids' taekwondo club app).
* The existing gym becomes tenant "N & T Center" (kind gym). All of its existing data and
  every existing login are stamped with it. Nothing is deleted.
* Every gym table gets a required club_id, and "unique" rules (parent phone, package name)
  apply per tenant instead of across all tenants.
* Every login belongs to exactly one tenant (app_users.club_id becomes required).

The taekwondo club tenant and its first admin are created with
`python -m scripts.create_tenant` (see backend/scripts/create_tenant.py).

Revision ID: 20261123_0010
Revises: 20261120_0009
Create Date: 2026-11-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261123_0010"
down_revision: str | None = "20261120_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

GYM_TABLES = (
    "members",
    "families",
    "payments",
    "enrollments",
    "sessions",
    "check_ins",
    "membership_plans",
    "schedule_templates",
    "notification_jobs",
    "announcements",
    "business_profiles",
)
GYM = "(SELECT id FROM clubs WHERE kind = 'gym' ORDER BY id LIMIT 1)"


def upgrade() -> None:
    op.add_column("clubs", sa.Column("kind", sa.String(20), nullable=False, server_default="taekwondo"))

    # Migration 0009 created a placeholder "Main branch". If nobody has used it for taekwondo
    # yet, it becomes the gym tenant; otherwise it stays a taekwondo club and a new gym tenant is made.
    op.execute(
        "UPDATE clubs SET name = 'N & T Center', kind = 'gym', currency = 'AED', timezone = 'Asia/Dubai' "
        "WHERE name = 'Main branch' AND NOT EXISTS (SELECT 1 FROM students WHERE students.club_id = clubs.id) "
        "AND NOT EXISTS (SELECT 1 FROM clubs other WHERE other.name = 'N & T Center')"
    )
    op.execute(
        "INSERT INTO clubs (name, kind, currency, timezone) "
        "SELECT 'N & T Center', 'gym', 'AED', 'Asia/Dubai' WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE kind = 'gym')"
    )
    # The gym app does not use taekwondo class slots or uniform sizes: drop the unused placeholders.
    op.execute(
        f"DELETE FROM class_slots WHERE club_id = {GYM} "
        "AND id NOT IN (SELECT slot_id FROM students WHERE slot_id IS NOT NULL) "
        "AND id NOT IN (SELECT slot_id FROM attendance WHERE slot_id IS NOT NULL)"
    )
    op.execute(
        f"DELETE FROM uniform_sizes WHERE club_id = {GYM} "
        "AND id NOT IN (SELECT size_id FROM uniform_sales) "
        "AND id NOT IN (SELECT size_id FROM uniform_order_lines) "
        "AND id NOT IN (SELECT size_id FROM uniform_adjustments)"
    )

    # Every existing gym record belongs to the gym tenant.
    for table in GYM_TABLES:
        op.add_column(table, sa.Column("club_id", sa.Integer(), nullable=True))
        op.execute(f"UPDATE {table} SET club_id = {GYM}")
        op.alter_column(table, "club_id", nullable=False)
        op.create_foreign_key(f"fk_{table}_club_id", table, "clubs", ["club_id"], ["id"], ondelete="CASCADE")
        op.create_index(f"ix_{table}_club_id", table, ["club_id"])

    # "Unique" now means unique within one gym.
    op.execute("ALTER TABLE families DROP CONSTRAINT IF EXISTS families_parent_phone_key")
    op.create_unique_constraint("uq_families_club_parent_phone", "families", ["club_id", "parent_phone"])
    op.execute("ALTER TABLE membership_plans DROP CONSTRAINT IF EXISTS membership_plans_name_key")
    op.create_unique_constraint("uq_membership_plans_club_name", "membership_plans", ["club_id", "name"])

    # Every login belongs to exactly one gym. Existing logins are the gym's.
    op.execute(f"UPDATE app_users SET club_id = {GYM} WHERE club_id IS NULL")
    op.execute("ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_club_id_fkey")
    op.alter_column("app_users", "club_id", nullable=False)
    op.create_foreign_key("fk_app_users_club_id", "app_users", "clubs", ["club_id"], ["id"], ondelete="CASCADE")
    op.execute(f"UPDATE audit_logs SET club_id = {GYM} WHERE club_id IS NULL")


def downgrade() -> None:
    op.drop_constraint("fk_app_users_club_id", "app_users", type_="foreignkey")
    op.alter_column("app_users", "club_id", nullable=True)
    op.create_foreign_key("app_users_club_id_fkey", "app_users", "clubs", ["club_id"], ["id"], ondelete="SET NULL")
    op.drop_constraint("uq_membership_plans_club_name", "membership_plans", type_="unique")
    op.create_unique_constraint("membership_plans_name_key", "membership_plans", ["name"])
    op.drop_constraint("uq_families_club_parent_phone", "families", type_="unique")
    op.create_unique_constraint("families_parent_phone_key", "families", ["parent_phone"])
    for table in reversed(GYM_TABLES):
        op.drop_index(f"ix_{table}_club_id", table_name=table)
        op.drop_constraint(f"fk_{table}_club_id", table, type_="foreignkey")
        op.drop_column(table, "club_id")
    op.drop_column("clubs", "kind")
