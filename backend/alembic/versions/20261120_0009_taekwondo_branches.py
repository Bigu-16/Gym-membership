"""taekwondo club: branches (tenants), class slots, parents, kids, fees, uniforms, attendance

Additive only: the previous gym tables (members, families, payments, ...) are left in place
untouched so nothing is lost; the app no longer reads them.

Revision ID: 20261120_0009
Revises: 20261016_0008
Create Date: 2026-11-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20261120_0009"
down_revision: str | None = "20261016_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

FEE_METHOD = postgresql.ENUM("cash", "telebirr", "cbe", "boa", name="fee_method_enum", create_type=False)
ORDER_STATUS = postgresql.ENUM("ordered", "received", "cancelled", name="uniform_order_status_enum", create_type=False)
ATTENDANCE_STATUS = postgresql.ENUM("present", "absent", name="attendance_status_enum", create_type=False)


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def _club_fk() -> sa.Column:
    return sa.Column("club_id", sa.Integer(), sa.ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)


def upgrade() -> None:
    op.execute("CREATE TYPE fee_method_enum AS ENUM ('cash', 'telebirr', 'cbe', 'boa')")
    op.execute("CREATE TYPE uniform_order_status_enum AS ENUM ('ordered', 'received', 'cancelled')")
    op.execute("CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent')")

    op.create_table(
        "clubs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False, unique=True),
        sa.Column("name_am", sa.String(120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Africa/Addis_Ababa"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="ETB"),
        sa.Column("monthly_fee", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("uniform_price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("summer_start", sa.String(5), nullable=False, server_default="06-15"),
        sa.Column("summer_end", sa.String(5), nullable=False, server_default="09-10"),
        sa.Column("term_days", sa.JSON(), nullable=False, server_default=sa.text("'[5, 6]'")),
        sa.Column("summer_days", sa.JSON(), nullable=False, server_default=sa.text("'[0, 1, 2, 3, 4, 5]'")),
        sa.Column("expiring_days", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("critical_days", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="3"),
        *_timestamps(),
    )
    op.create_index("ix_clubs_id", "clubs", ["id"])

    op.add_column("app_users", sa.Column("club_id", sa.Integer(), sa.ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True))
    op.create_index("ix_app_users_club_id", "app_users", ["club_id"])
    op.add_column("audit_logs", sa.Column("club_id", sa.Integer(), sa.ForeignKey("clubs.id", ondelete="CASCADE"), nullable=True))
    op.create_index("ix_audit_logs_club_id", "audit_logs", ["club_id"])

    op.create_table(
        "class_slots",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("weekdays", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *_timestamps(),
    )
    op.create_index("ix_class_slots_id", "class_slots", ["id"])
    op.create_index("ix_class_slots_club_id", "class_slots", ["club_id"])

    op.create_table(
        "guardians",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("phone_alt", sa.String(30), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        *_timestamps(),
        sa.UniqueConstraint("club_id", "phone", name="uq_guardians_club_phone"),
    )
    for col in ("id", "club_id", "name", "phone"):
        op.create_index(f"ix_guardians_{col}", "guardians", [col])

    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("guardian_id", sa.Integer(), sa.ForeignKey("guardians.id"), nullable=False),
        sa.Column("slot_id", sa.Integer(), sa.ForeignKey("class_slots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("uniform_size", sa.String(10), nullable=True),
        sa.Column("joined_on", sa.Date(), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notes", sa.Text(), nullable=True),
        *_timestamps(),
    )
    for col in ("id", "club_id", "guardian_id", "slot_id", "name", "expiry_date"):
        op.create_index(f"ix_students_{col}", "students", [col])

    op.create_table(
        "fee_payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
        sa.Column("guardian_id", sa.Integer(), sa.ForeignKey("guardians.id"), nullable=False),
        sa.Column("receipt_no", sa.String(32), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("method", FEE_METHOD, nullable=False),
        sa.Column("reference", sa.String(64), nullable=True),
        sa.Column("months", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("paid_on", sa.Date(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True),
        *_timestamps(),
    )
    for col in ("id", "club_id", "student_id", "guardian_id", "receipt_no", "paid_on"):
        op.create_index(f"ix_fee_payments_{col}", "fee_payments", [col])

    op.create_table(
        "uniform_sizes",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("label", sa.String(10), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *_timestamps(),
        sa.UniqueConstraint("club_id", "label", name="uq_uniform_sizes_club_label"),
    )
    op.create_index("ix_uniform_sizes_id", "uniform_sizes", ["id"])
    op.create_index("ix_uniform_sizes_club_id", "uniform_sizes", ["club_id"])

    op.create_table(
        "uniform_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("supplier", sa.String(120), nullable=True),
        sa.Column("ordered_on", sa.Date(), nullable=False),
        sa.Column("status", ORDER_STATUS, nullable=False, server_default="ordered"),
        sa.Column("received_on", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_uniform_orders_id", "uniform_orders", ["id"])
    op.create_index("ix_uniform_orders_club_id", "uniform_orders", ["club_id"])

    op.create_table(
        "uniform_order_lines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("uniform_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("size_id", sa.Integer(), sa.ForeignKey("uniform_sizes.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
    )
    for col in ("id", "order_id", "size_id"):
        op.create_index(f"ix_uniform_order_lines_{col}", "uniform_order_lines", [col])

    op.create_table(
        "uniform_sales",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("size_id", sa.Integer(), sa.ForeignKey("uniform_sizes.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("method", FEE_METHOD, nullable=False),
        sa.Column("reference", sa.String(64), nullable=True),
        sa.Column("sold_on", sa.Date(), nullable=False),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id", ondelete="SET NULL"), nullable=True),
        sa.Column("guardian_id", sa.Integer(), sa.ForeignKey("guardians.id", ondelete="SET NULL"), nullable=True),
        sa.Column("buyer_name", sa.String(120), nullable=True),
        sa.Column("buyer_phone", sa.String(30), nullable=True),
        sa.Column("receipt_no", sa.String(32), nullable=True),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True),
        *_timestamps(),
    )
    for col in ("id", "club_id", "size_id", "sold_on", "student_id", "guardian_id", "receipt_no"):
        op.create_index(f"ix_uniform_sales_{col}", "uniform_sales", [col])

    op.create_table(
        "uniform_adjustments",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("size_id", sa.Integer(), sa.ForeignKey("uniform_sizes.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(200), nullable=False),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True),
        *_timestamps(),
    )
    for col in ("id", "club_id", "size_id"):
        op.create_index(f"ix_uniform_adjustments_{col}", "uniform_adjustments", [col])

    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer(), primary_key=True),
        _club_fk(),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slot_id", sa.Integer(), sa.ForeignKey("class_slots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("class_date", sa.Date(), nullable=False),
        sa.Column("status", ATTENDANCE_STATUS, nullable=False),
        sa.Column("recorded_by_id", sa.Integer(), sa.ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True),
        *_timestamps(),
        sa.UniqueConstraint("student_id", "class_date", name="uq_attendance_student_date"),
    )
    for col in ("id", "club_id", "student_id", "slot_id", "class_date"):
        op.create_index(f"ix_attendance_{col}", "attendance", [col])

    # A first branch with the default timetable and sizes, so the app works right after deploy.
    op.execute("INSERT INTO clubs (name) VALUES ('Main branch')")
    op.execute(
        "INSERT INTO class_slots (club_id, start_time, end_time, weekdays) "
        "SELECT c.id, v.s::time, v.e::time, v.d::json FROM clubs c, (VALUES "
        "('09:00', '10:00', '[0, 1, 2, 3, 4, 5, 6]'), ('10:00', '11:00', '[0, 1, 2, 3, 4, 5, 6]'), "
        "('11:00', '12:00', '[0, 1, 2, 3, 4, 5, 6]'), ('14:00', '15:00', '[0, 1, 2, 3, 4, 5]')) AS v(s, e, d) "
        "WHERE c.name = 'Main branch'"
    )
    op.execute(
        "INSERT INTO uniform_sizes (club_id, label, sort_order) "
        "SELECT c.id, v.label, v.ord FROM clubs c, (VALUES ('55', 10), ('60', 20), ('65', 30), ('70', 40), ('75', 50), "
        "('80', 60), ('85', 70), ('90', 80), ('95', 90), ('100', 100)) AS v(label, ord) WHERE c.name = 'Main branch'"
    )
    # Existing staff accounts work in the first branch; owners (admin) stay branch-free.
    op.execute("UPDATE app_users SET club_id = (SELECT id FROM clubs WHERE name = 'Main branch') WHERE role = 'staff'")


def downgrade() -> None:
    for table in ("attendance", "uniform_adjustments", "uniform_sales", "uniform_order_lines", "uniform_orders",
                  "uniform_sizes", "fee_payments", "students", "guardians", "class_slots"):
        op.drop_table(table)
    op.drop_index("ix_audit_logs_club_id", table_name="audit_logs")
    op.drop_column("audit_logs", "club_id")
    op.drop_index("ix_app_users_club_id", table_name="app_users")
    op.drop_column("app_users", "club_id")
    op.drop_table("clubs")
    op.execute("DROP TYPE attendance_status_enum")
    op.execute("DROP TYPE uniform_order_status_enum")
    op.execute("DROP TYPE fee_method_enum")
