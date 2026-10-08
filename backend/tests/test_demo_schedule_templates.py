from app.services.demo_data import seed_schedule


async def test_demo_schedule_matches_supplied_weekly_timetable(db_session):
    templates, _ = await seed_schedule(db_session)

    expected = {
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "16:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday"), "17:00"),
        ("Kids Karate", ("Friday",), "17:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "18:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "19:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "20:00"),
        ("Little Kids Karate", ("Tuesday", "Thursday", "Saturday"), "16:00"),
        ("Kids Karate", ("Tuesday", "Thursday", "Saturday"), "17:00"),
        ("Kids Karate", ("Tuesday", "Thursday", "Saturday"), "18:00"),
        ("Adult Kickboxing", ("Tuesday", "Thursday", "Saturday"), "19:00"),
        ("Adult Karate", ("Tuesday", "Thursday", "Saturday"), "20:00"),
    }
    photo_templates = {
        (template.title, tuple(template.days), template.time)
        for key, template in templates.items()
        if key not in {"Elite Performance", "Yoga Flow", "Personal Training"}
    }

    assert photo_templates == expected
