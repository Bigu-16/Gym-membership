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
