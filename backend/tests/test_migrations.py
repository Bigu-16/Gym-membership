import importlib.util
import io
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations


def render_migration_sql(filename: str) -> str:
    migration_path = Path(__file__).parents[1] / "alembic" / "versions" / filename
    spec = importlib.util.spec_from_file_location("migration_under_test", migration_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    output = io.StringIO()
    context = MigrationContext.configure(
        dialect_name="postgresql",
        opts={"as_sql": True, "output_buffer": output},
    )
    module.op = Operations(context)
    module.upgrade()
    return output.getvalue()


def test_communication_migration_creates_each_enum_once():
    sql = render_migration_sql("20260720_0005_add_communication_channels.py")

    assert sql.count("CREATE TYPE notification_channel_enum") == 1
    assert sql.count("CREATE TYPE announcement_status_enum") == 1


def test_gym_operations_migration_sql():
    sql = render_migration_sql("20261014_0006_gym_operations.py")

    assert "CREATE TABLE business_profiles" in sql
    assert "DROP CONSTRAINT IF EXISTS members_phone_key" in sql
    assert "ALTER TABLE members ALTER COLUMN phone DROP NOT NULL" in sql
    assert sql.count("CREATE TYPE payment_method_enum") == 1
    assert sql.count("CREATE TYPE payment_kind_enum") == 1
    assert "CREATE TABLE payments" in sql
    # Duplicate open visits are closed before the one-open-visit index is created.
    assert sql.index("UPDATE check_ins SET check_out_time") < sql.index("CREATE UNIQUE INDEX uq_check_ins_open_member")
    assert "WHERE check_out_time IS NULL" in sql
