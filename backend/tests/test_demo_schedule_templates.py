from app.services.demo_data import seed_schedule


async def test_demo_schedule_matches_supplied_weekly_timetable(db_session):
    templates, _ = await seed_schedule(db_session)

    expected = {
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "16:00 - 17:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday"), "17:00 - 18:00"),
        ("Kids Karate", ("Friday",), "17:00 - 18:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "18:00 - 19:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "19:00 - 20:00"),
        ("Kids Taekwondo", ("Monday", "Wednesday", "Friday"), "20:00 - 21:00"),
        ("Little Kids Karate", ("Tuesday", "Thursday", "Saturday"), "16:00 - 17:00"),
        ("Kids Karate", ("Tuesday", "Thursday", "Saturday"), "17:00 - 18:00"),
        ("Kids Karate", ("Tuesday", "Thursday", "Saturday"), "18:00 - 19:00"),
        ("Adult Kickboxing", ("Tuesday", "Thursday", "Saturday"), "19:00 - 20:00"),
        ("Adult Karate", ("Tuesday", "Thursday", "Saturday"), "20:00 - 21:00"),
    }
    actual = {(t.title, tuple(t.days), t.time) for t in templates.values()}

    assert actual == expected
    titles = {t.title for t in templates.values()}
    assert not titles & {"Elite Performance", "Yoga Flow", "Personal Training"}


async def test_demo_sessions_only_cover_real_classes_that_already_happened(db_session):
    templates, sessions = await seed_schedule(db_session)
    template_ids = {t.id for t in templates.values()}

    assert sessions, "a week of recorded class sessions is seeded"
    for session in sessions.values():
        assert session.template_id in template_ids
        assert session.start_time and session.end_time
        assert int(session.end_time[:2]) - int(session.start_time[:2]) == 1


async def test_full_demo_seed_runs_twice_without_duplicates(db_session):
    from app.services.demo_data import seed_demo_data

    first = await seed_demo_data(db_session)
    second = await seed_demo_data(db_session)

    assert first == second
    assert first["payments"] == first["members"] == 8
    assert first["check_ins"] > 0
