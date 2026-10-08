from sqlalchemy import select

from app.models import MembershipPlan
from app.services.demo_data import seed_plans


async def test_seeded_photo_packages_match_official_price_sheet(db_session):
    await seed_plans(db_session)
    await db_session.commit()

    result = await db_session.scalars(
        select(MembershipPlan).where(
            MembershipPlan.program.in_(["Taekwondo", "Kickboxing", "Karate", "Kung Fu", "Fitness"])
        )
    )
    plans = result.all()

    assert len(plans) == 15
    actual = {
        (
            plan.program,
            plan.duration_months,
            plan.classes_per_week,
            int(plan.price),
            tuple(plan.included_items),
        )
        for plan in plans
    }

    for program in ["Taekwondo", "Kickboxing", "Karate", "Kung Fu", "Fitness"]:
        assert (program, 1, 2, 300, ()) in actual
        assert (program, 1, 3, 350, ()) in actual

    assert ("Taekwondo", 3, 3, 900, ("Free uniform",)) in actual
    assert ("Kickboxing", 3, 3, 900, ("Free gloves",)) in actual
    assert ("Karate", 3, 3, 900, ("Free uniform",)) in actual
    assert ("Kung Fu", 3, 3, 900, ()) in actual
    assert ("Fitness", 3, 3, 900, ()) in actual

    assert not any(int(plan.price) in {800, 1400, 1450, 2550} for plan in plans)
