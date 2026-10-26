"""freezes pause the membership: remember when each freeze started and ends

Revision ID: 20261016_0008
Revises: 20261015_0007
Create Date: 2026-10-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261016_0008"
down_revision: str | None = "20261015_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("members", sa.Column("frozen_since", sa.Date(), nullable=True))
    op.add_column("members", sa.Column("freeze_until", sa.Date(), nullable=True))
    op.create_index(op.f("ix_members_freeze_until"), "members", ["freeze_until"], unique=False)
    # Members frozen before this release: their pause is counted from the deploy day.
    op.execute("UPDATE members SET frozen_since = CURRENT_DATE WHERE is_frozen")


def downgrade() -> None:
    op.drop_index(op.f("ix_members_freeze_until"), table_name="members")
    op.drop_column("members", "freeze_until")
    op.drop_column("members", "frozen_since")
