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


def test_official_catalog_migration_loads_once_and_keeps_existing_rows():
    import importlib.util as util

    from sqlalchemy import create_engine, func, insert, select

    import app.models  # noqa: F401 - registers all tables
    from app.core.database import Base
    from app.models import MembershipPlan, ScheduleTemplate

    path = Path(__file__).parents[1] / "alembic" / "versions" / "20261015_0007_load_official_catalog.py"
    spec = util.spec_from_file_location("catalog_migration", path)
    module = util.module_from_spec(spec)
    spec.loader.exec_module(module)

    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        # A class the center already had (same slot written differently) and an old plan.
        conn.execute(insert(ScheduleTemplate).values(title="Kids Taekwondo", type="group", days=["Monday", "Wednesday", "Friday"], time="4:00 PM - 5:00 PM", capacity=20))
        conn.execute(insert(MembershipPlan).values(name="Karate One Month - 3 Classes", program="Karate", price=999, currency="AED", included_items=[], duration_label="x", duration_months=1, duration_days=30, sort_order=0, is_active=True))

        first = module.load_official_catalog(conn)
        second = module.load_official_catalog(conn)

        assert first == {"classes_added": 10, "packages_added": 22, "packages_updated": 1}
        assert second["classes_added"] == 0 and second["packages_added"] == 0
        assert conn.scalar(select(func.count()).select_from(ScheduleTemplate)) == 11
        assert conn.scalar(select(func.count()).select_from(MembershipPlan)) == 23
        assert conn.scalar(select(MembershipPlan.price).where(MembershipPlan.name == "Karate One Month - 3 Classes")) == 350
        # The center's existing class keeps its own settings.
        assert conn.scalar(select(ScheduleTemplate.capacity).where(ScheduleTemplate.time == "4:00 PM - 5:00 PM")) == 20
