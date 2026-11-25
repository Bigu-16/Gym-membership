from sqlalchemy import select

from app.models import MembershipPlan
from app.services.catalog import official_packages
from app.services.demo_data import seed_plans

PROGRAMS = ["Taekwondo", "Kickboxing", "Karate", "Kung Fu", "Fitness"]


async def test_seeded_packages_merge_price_card_and_registration_form(db_session):
    await seed_plans(db_session)
    await db_session.commit()

    plans = (await db_session.scalars(select(MembershipPlan).where(MembershipPlan.program.in_(PROGRAMS)))).all()
    assert len(plans) == len(official_packages()) == 23
    actual = {
        (plan.program, plan.duration_months, plan.classes_per_week, int(plan.price), tuple(plan.included_items))
        for plan in plans
    }

    for program in PROGRAMS:
        # Front-desk price card (wins where the two sources disagree)
        assert (program, 1, 2, 300, ()) in actual
        assert (program, 1, 3, 350, ()) in actual

    assert ("Taekwondo", 3, 3, 900, ("Free uniform",)) in actual
    assert ("Kickboxing", 3, 3, 900, ("Free gloves",)) in actual
    assert ("Karate", 3, 3, 900, ("Free uniform",)) in actual
    # Registration form long-term packages (Kung Fu is only on the price card)
    for program in ["Taekwondo", "Kickboxing", "Karate", "Fitness"]:
        assert (program, 12, 3, 2550, ()) in actual
    assert not any(plan.program == "Kung Fu" and plan.duration_months > 3 for plan in plans)
    assert ("Karate", 6, 3, 1400, ()) in actual
    assert ("Fitness", 6, 3, 1450, ()) in actual
    # The form's conflicting 3-month price (800) is not used.
    assert not any(plan.duration_months == 3 and int(plan.price) == 800 for plan in plans)


async def test_package_sync_is_idempotent_and_repairs_prices(db_session):
    await seed_plans(db_session)
    plan = await db_session.scalar(select(MembershipPlan).where(MembershipPlan.name == "Karate One Month - 3 Classes"))
    plan.price = 1
    await db_session.flush()

    from app.services.catalog import sync_official_packages

    result = await sync_official_packages(db_session)
    assert result == {"created": 0, "updated": 1, "total": 23}
    assert int(plan.price) == 350
