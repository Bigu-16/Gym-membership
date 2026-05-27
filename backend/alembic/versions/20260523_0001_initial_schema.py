"""initial schema"""

from alembic import op
import sqlalchemy as sa


revision = "20260523_0001"
down_revision = None
branch_labels = None
depends_on = None


gender_enum = sa.Enum("male", "female", "other", name="gender_enum")
schedule_type_enum = sa.Enum("group", "personal", name="schedule_type_enum")
session_status_enum = sa.Enum(
    "upcoming",
    "in_progress",
    "completed",
    "cancelled",
    name="session_status_enum",
)
user_role_enum = sa.Enum("admin", "staff", name="user_role_enum")


def upgrade() -> None:
    bind = op.get_bind()
    gender_enum.create(bind, checkfirst=True)
    schedule_type_enum.create(bind, checkfirst=True)
    session_status_enum.create(bind, checkfirst=True)
    user_role_enum.create(bind, checkfirst=True)

    op.create_table(
        "app_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_app_users_id"), "app_users", ["id"], unique=False)
    op.create_index(op.f("ix_app_users_email"), "app_users", ["email"], unique=False)

    op.create_table(
        "membership_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("duration_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_membership_plans_id"), "membership_plans", ["id"], unique=False)

    op.create_table(
        "schedule_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("type", schedule_type_enum, nullable=False),
        sa.Column("days", sa.JSON(), nullable=False),
        sa.Column("time", sa.String(length=20), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_schedule_templates_id"), "schedule_templates", ["id"], unique=False)

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("parent_phone", sa.String(length=30), nullable=True),
        sa.Column("gender", gender_enum, nullable=True),
        sa.Column("medical_issues", sa.Text(), nullable=True),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("membership_plans.id"), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("is_frozen", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("messaging_opt_in", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("phone"),
    )
    op.create_index(op.f("ix_members_id"), "members", ["id"], unique=False)
    op.create_index(op.f("ix_members_name"), "members", ["name"], unique=False)
    op.create_index(op.f("ix_members_phone"), "members", ["phone"], unique=False)
    op.create_index(op.f("ix_members_parent_phone"), "members", ["parent_phone"], unique=False)
    op.create_index(op.f("ix_members_expiry_date"), "members", ["expiry_date"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("schedule_templates.id"), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("trainer_name", sa.String(length=120), nullable=False),
        sa.Column("status", session_status_enum, nullable=False, server_default="upcoming"),
        sa.Column("checklist_data", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_sessions_id"), "sessions", ["id"], unique=False)
    op.create_index(op.f("ix_sessions_date"), "sessions", ["date"], unique=False)

    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id"), nullable=False),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("schedule_templates.id"), nullable=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("member_id", "template_id", "session_id", name="uq_member_template_session"),
    )
    op.create_index(op.f("ix_enrollments_id"), "enrollments", ["id"], unique=False)

    op.create_table(
        "check_ins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id"), nullable=False),
        sa.Column("check_in_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("check_out_time", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "check_out_time IS NULL OR check_out_time >= check_in_time",
            name="ck_check_out_after_check_in",
        ),
    )
    op.create_index(op.f("ix_check_ins_id"), "check_ins", ["id"], unique=False)
    op.create_index(op.f("ix_check_ins_member_id"), "check_ins", ["member_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_app_users_email"), table_name="app_users")
    op.drop_index(op.f("ix_app_users_id"), table_name="app_users")
    op.drop_table("app_users")

    op.drop_index(op.f("ix_check_ins_member_id"), table_name="check_ins")
    op.drop_index(op.f("ix_check_ins_id"), table_name="check_ins")
    op.drop_table("check_ins")

    op.drop_index(op.f("ix_enrollments_id"), table_name="enrollments")
    op.drop_table("enrollments")

    op.drop_index(op.f("ix_sessions_date"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_id"), table_name="sessions")
    op.drop_table("sessions")

    op.drop_index(op.f("ix_members_expiry_date"), table_name="members")
    op.drop_index(op.f("ix_members_parent_phone"), table_name="members")
    op.drop_index(op.f("ix_members_phone"), table_name="members")
    op.drop_index(op.f("ix_members_name"), table_name="members")
    op.drop_index(op.f("ix_members_id"), table_name="members")
    op.drop_table("members")

    op.drop_index(op.f("ix_schedule_templates_id"), table_name="schedule_templates")
    op.drop_table("schedule_templates")

    op.drop_index(op.f("ix_membership_plans_id"), table_name="membership_plans")
    op.drop_table("membership_plans")

    bind = op.get_bind()
    user_role_enum.drop(bind, checkfirst=True)
    session_status_enum.drop(bind, checkfirst=True)
    schedule_type_enum.drop(bind, checkfirst=True)
    gender_enum.drop(bind, checkfirst=True)
