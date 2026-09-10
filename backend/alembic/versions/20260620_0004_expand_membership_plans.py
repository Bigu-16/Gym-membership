"""expand membership plans

Revision ID: 20260620_0004
Revises: 20260620_0003
Create Date: 2026-06-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260620_0004"
down_revision: str | None = "20260620_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("membership_plans", sa.Column("program", sa.String(length=80), nullable=False, server_default="General"))
    op.add_column(
        "membership_plans",
        sa.Column("duration_label", sa.String(length=80), nullable=False, server_default="One Month"),
    )
    op.add_column("membership_plans", sa.Column("duration_months", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("membership_plans", sa.Column("classes_per_week", sa.Integer(), nullable=True))
    op.add_column("membership_plans", sa.Column("currency", sa.String(length=3), nullable=False, server_default="AED"))
    op.add_column(
        "membership_plans",
        sa.Column("included_items", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
    )
    op.add_column("membership_plans", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("membership_plans", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index(op.f("ix_membership_plans_program"), "membership_plans", ["program"], unique=False)
    op.alter_column("membership_plans", "program", server_default=None)
    op.alter_column("membership_plans", "duration_label", server_default=None)
    op.alter_column("membership_plans", "duration_months", server_default=None)
    op.alter_column("membership_plans", "currency", server_default=None)
    op.alter_column("membership_plans", "included_items", server_default=None)
    op.alter_column("membership_plans", "sort_order", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_membership_plans_program"), table_name="membership_plans")
    op.drop_column("membership_plans", "sort_order")
    op.drop_column("membership_plans", "description")
    op.drop_column("membership_plans", "included_items")
    op.drop_column("membership_plans", "currency")
    op.drop_column("membership_plans", "classes_per_week")
    op.drop_column("membership_plans", "duration_months")
    op.drop_column("membership_plans", "duration_label")
    op.drop_column("membership_plans", "program")
