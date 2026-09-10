"""add member age

Revision ID: 20260620_0002
Revises: 20260523_0001
Create Date: 2026-06-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260620_0002"
down_revision: str | None = "20260523_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("members", sa.Column("age", sa.Integer(), nullable=False, server_default="0"))
    op.alter_column("members", "age", server_default=None)


def downgrade() -> None:
    op.drop_column("members", "age")
