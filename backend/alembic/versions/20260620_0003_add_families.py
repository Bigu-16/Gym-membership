"""add families

Revision ID: 20260620_0003
Revises: 20260620_0002
Create Date: 2026-06-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260620_0003"
down_revision: str | None = "20260620_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "families",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("parent_name", sa.String(length=120), nullable=False),
        sa.Column("parent_phone", sa.String(length=30), nullable=False),
        sa.Column("parent_email", sa.String(length=255), nullable=True),
        sa.Column("parent_address", sa.String(length=255), nullable=True),
        sa.Column("parent_relationship", sa.String(length=60), nullable=False, server_default="parent"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("parent_phone"),
    )
    op.create_index(op.f("ix_families_id"), "families", ["id"], unique=False)
    op.create_index(op.f("ix_families_parent_name"), "families", ["parent_name"], unique=False)
    op.create_index(op.f("ix_families_parent_phone"), "families", ["parent_phone"], unique=False)
    op.add_column("members", sa.Column("family_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_members_family_id"), "members", ["family_id"], unique=False)
    op.create_foreign_key(op.f("fk_members_family_id_families"), "members", "families", ["family_id"], ["id"])

    op.execute(
        """
        INSERT INTO families (parent_name, parent_phone, parent_relationship, created_at, updated_at)
        SELECT 'Parent/Guardian ' || parent_phone, parent_phone, 'parent', now(), now()
        FROM (
            SELECT DISTINCT parent_phone
            FROM members
            WHERE parent_phone IS NOT NULL
        ) existing_families
        ON CONFLICT (parent_phone) DO NOTHING
        """
    )
    op.execute(
        """
        UPDATE members
        SET family_id = families.id
        FROM families
        WHERE members.parent_phone = families.parent_phone
          AND members.family_id IS NULL
        """
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_members_family_id_families"), "members", type_="foreignkey")
    op.drop_index(op.f("ix_members_family_id"), table_name="members")
    op.drop_column("members", "family_id")
    op.drop_index(op.f("ix_families_parent_phone"), table_name="families")
    op.drop_index(op.f("ix_families_parent_name"), table_name="families")
    op.drop_index(op.f("ix_families_id"), table_name="families")
    op.drop_table("families")
