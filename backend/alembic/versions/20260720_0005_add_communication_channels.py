"""add multi-channel communication and announcements

Revision ID: 20260720_0005
Revises: 20260620_0004
Create Date: 2026-07-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260720_0005"
down_revision: str | None = "20260620_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


notification_channel_enum = postgresql.ENUM(
    "whatsapp",
    "telegram",
    "email",
    name="notification_channel_enum",
    create_type=False,
)
announcement_status_enum = postgresql.ENUM(
    "draft",
    "queued",
    "sent",
    name="announcement_status_enum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()

    # New enum types
    notification_channel_enum.create(bind, checkfirst=True)
    announcement_status_enum.create(bind, checkfirst=True)

    # Extend the existing notification_type enum
    for value in ("enrollment", "class_enrollment", "announcement"):
        op.execute(f"ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS '{value}'")

    # Member contact fields
    op.add_column("members", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("members", sa.Column("telegram_chat_id", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_members_email"), "members", ["email"], unique=False)

    # Notification job: channel + delivery bookkeeping
    op.add_column(
        "notification_jobs",
        sa.Column(
            "channel",
            notification_channel_enum,
            nullable=False,
            server_default="whatsapp",
        ),
    )
    op.add_column("notification_jobs", sa.Column("recipient", sa.String(length=255), nullable=True))
    op.add_column(
        "notification_jobs", sa.Column("provider_message_id", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "notification_jobs",
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index(
        op.f("ix_notification_jobs_channel"), "notification_jobs", ["channel"], unique=False
    )
    op.create_index(
        op.f("ix_notification_jobs_status"), "notification_jobs", ["status"], unique=False
    )
    op.alter_column("notification_jobs", "channel", server_default=None)
    op.alter_column("notification_jobs", "attempts", server_default=None)

    # Announcements
    op.create_table(
        "announcements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("channels", sa.JSON(), nullable=False),
        sa.Column("filters", sa.JSON(), nullable=False),
        sa.Column("status", announcement_status_enum, nullable=False, server_default="draft"),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recipient_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("job_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["app_users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_announcements_id"), "announcements", ["id"], unique=False)
    op.create_index(
        op.f("ix_announcements_created_by_id"), "announcements", ["created_by_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_announcements_created_by_id"), table_name="announcements")
    op.drop_index(op.f("ix_announcements_id"), table_name="announcements")
    op.drop_table("announcements")

    op.drop_index(op.f("ix_notification_jobs_status"), table_name="notification_jobs")
    op.drop_index(op.f("ix_notification_jobs_channel"), table_name="notification_jobs")
    op.drop_column("notification_jobs", "attempts")
    op.drop_column("notification_jobs", "provider_message_id")
    op.drop_column("notification_jobs", "recipient")
    op.drop_column("notification_jobs", "channel")

    op.drop_index(op.f("ix_members_email"), table_name="members")
    op.drop_column("members", "telegram_chat_id")
    op.drop_column("members", "email")

    bind = op.get_bind()
    announcement_status_enum.drop(bind, checkfirst=True)
    notification_channel_enum.drop(bind, checkfirst=True)
    # Note: values added to notification_type_enum are left in place;
    # PostgreSQL cannot drop individual enum values.
