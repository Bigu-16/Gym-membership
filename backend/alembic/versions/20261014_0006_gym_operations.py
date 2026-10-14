"""gym operations: payments, member IDs, session times, business profiles

Revision ID: 20261014_0006
Revises: 20260720_0005
Create Date: 2026-10-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20261014_0006"
down_revision: str | None = "20260720_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


payment_method_enum = postgresql.ENUM(
    "cash", "card", "bank_transfer", "other", name="payment_method_enum", create_type=False
)
payment_kind_enum = postgresql.ENUM("new", "renewal", name="payment_kind_enum", create_type=False)


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    bind = op.get_bind()
    offline = op.get_context().as_sql

    # business_profiles existed as a model but was never migrated, so /business 500'd.
    if offline or not sa.inspect(bind).has_table("business_profiles"):
        op.create_table(
            "business_profiles",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("account_details", sa.JSON(), nullable=False),
            *_timestamps(),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_business_profiles_id"), "business_profiles", ["id"], unique=False)

    # Members: children no longer need a fake unique phone; capture registration-form IDs.
    op.execute("ALTER TABLE members DROP CONSTRAINT IF EXISTS members_phone_key")
    op.alter_column("members", "phone", existing_type=sa.String(length=30), nullable=True)
    op.add_column("members", sa.Column("whatsapp_number", sa.String(length=30), nullable=True))
    op.add_column("members", sa.Column("emirates_id", sa.String(length=32), nullable=True))

    # Sessions keep their own clock time (personal sessions have no class slot).
    op.add_column("sessions", sa.Column("start_time", sa.String(length=5), nullable=True))
    op.add_column("sessions", sa.Column("end_time", sa.String(length=5), nullable=True))
    op.add_column("schedule_templates", sa.Column("trainer_name", sa.String(length=120), nullable=True))

    # Payments actually collected, so revenue reporting uses real money.
    payment_method_enum.create(bind, checkfirst=True)
    payment_kind_enum.create(bind, checkfirst=True)
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="AED"),
        sa.Column("method", payment_method_enum, nullable=False, server_default="cash"),
        sa.Column("kind", payment_kind_enum, nullable=False, server_default="new"),
        sa.Column("paid_on", sa.Date(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=True),
        sa.Column("period_end", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        *_timestamps(),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["membership_plans.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_id"), "payments", ["id"], unique=False)
    op.create_index(op.f("ix_payments_member_id"), "payments", ["member_id"], unique=False)
    op.create_index(op.f("ix_payments_plan_id"), "payments", ["plan_id"], unique=False)
    op.create_index(op.f("ix_payments_paid_on"), "payments", ["paid_on"], unique=False)

    # Close duplicate open check-ins (keep each member's latest) before enforcing one open visit.
    op.execute(
        """
        UPDATE check_ins SET check_out_time = check_in_time
        WHERE check_out_time IS NULL
          AND id NOT IN (
            SELECT max_id FROM (
              SELECT MAX(id) AS max_id FROM check_ins WHERE check_out_time IS NULL GROUP BY member_id
            ) AS latest_open
          )
        """
    )
    op.create_index(
        "uq_check_ins_open_member",
        "check_ins",
        ["member_id"],
        unique=True,
        postgresql_where=sa.text("check_out_time IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_check_ins_open_member", table_name="check_ins")
    op.drop_index(op.f("ix_payments_paid_on"), table_name="payments")
    op.drop_index(op.f("ix_payments_plan_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_member_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_id"), table_name="payments")
    op.drop_table("payments")
    payment_kind_enum.drop(op.get_bind(), checkfirst=True)
    payment_method_enum.drop(op.get_bind(), checkfirst=True)
    op.drop_column("schedule_templates", "trainer_name")
    op.drop_column("sessions", "end_time")
    op.drop_column("sessions", "start_time")
    op.drop_column("members", "emirates_id")
    op.drop_column("members", "whatsapp_number")
    op.alter_column("members", "phone", existing_type=sa.String(length=30), nullable=False)
    op.drop_index(op.f("ix_business_profiles_id"), table_name="business_profiles")
    op.drop_table("business_profiles")
