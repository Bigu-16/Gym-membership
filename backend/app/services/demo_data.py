"""Development seed for N & T Taekwondo & Karate Center.

Uses the official timetable and package catalog (app.services.catalog) so local data
looks like the real center. Only reachable when APP_ENV allows development endpoints.
"""

from datetime import UTC, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.timeutils import add_months, gym_today, gym_tz
from app.models import (
    AppUser,
    CheckIn,
    Enrollment,
    Family,
    Member,
    MembershipPlan,
    NotificationJob,
    Payment,
    ScheduleTemplate,
    Session,
)
from app.models.enums import (
    Gender,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    PaymentKind,
    PaymentMethod,
    SessionStatus,
    UserRole,
)
from app.services.catalog import OFFICIAL_TIMETABLE, class_key, start_of, sync_official_packages, sync_official_timetable

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "ChangeMe123!"
STAFF_EMAIL = "staff@example.com"
STAFF_PASSWORD = "ChangeMe123!"

# Placeholder data from an earlier gym template that never belonged to this center.
LEGACY_DEMO_TEMPLATES = {"Elite Performance", "Yoga Flow", "Personal Training"}
LEGACY_DEMO_PLANS = {"Family Group"}



async def get_or_create(session: AsyncSession, model, lookup: dict, defaults: dict | None = None):
    item = await session.scalar(select(model).filter_by(**lookup))
    if item is not None:
        for key, value in (defaults or {}).items():
            setattr(item, key, value)
        return item

    item = model(**{**(defaults or {}), **lookup})
    session.add(item)
    await session.flush()
    return item


async def seed_users(session: AsyncSession) -> None:
    await get_or_create(
        session,
        AppUser,
        {"email": ADMIN_EMAIL},
        {
            "full_name": "Center Administrator",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": UserRole.admin,
            "is_active": True,
        },
    )
    await get_or_create(
        session,
        AppUser,
        {"email": STAFF_EMAIL},
        {
            "full_name": "Front Desk",
            "password_hash": hash_password(STAFF_PASSWORD),
            "role": UserRole.staff,
            "is_active": True,
        },
    )


async def retire_legacy_demo_data(session: AsyncSession) -> None:
    """Remove placeholder classes/sessions and deactivate placeholder plans from older seeds."""
    legacy_templates = (
        await session.scalars(select(ScheduleTemplate).where(ScheduleTemplate.title.in_(LEGACY_DEMO_TEMPLATES)))
    ).all()
    for template in legacy_templates:
        for model in (Enrollment, Session):
            rows = (await session.scalars(select(model).where(model.template_id == template.id))).all()
            for row in rows:
                await session.delete(row)
        await session.delete(template)
    legacy_plans = (await session.scalars(select(MembershipPlan).where(MembershipPlan.name.in_(LEGACY_DEMO_PLANS)))).all()
    for plan in legacy_plans:
        plan.is_active = False
    await session.flush()


async def seed_plans(session: AsyncSession) -> dict[str, MembershipPlan]:
    await sync_official_packages(session)
    plans = (await session.scalars(select(MembershipPlan))).all()
    return {plan.name: plan for plan in plans}


async def seed_schedule(session: AsyncSession) -> tuple[dict[str, ScheduleTemplate], dict[str, Session]]:
    """Official timetable plus a week of recorded sessions for those classes."""
    await sync_official_timetable(session)
    all_templates = (await session.scalars(select(ScheduleTemplate))).all()
    by_key = {class_key(t.title, t.days, t.time): t for t in all_templates}

    templates: dict[str, ScheduleTemplate] = {}
    for spec in OFFICIAL_TIMETABLE:
        template = by_key[class_key(spec.title, spec.days, spec.time)]
        key = f"{spec.title.lower().replace(' ', '_')}_{'_'.join(d[:3].lower() for d in spec.days)}_{start_of(spec.time).replace(':', '')}"
        templates[key] = template

    today = gym_today()
    now_local = datetime.now(gym_tz())
    sessions: dict[str, Session] = {}
    for offset in range(7, -1, -1):
        day = today - timedelta(days=offset)
        weekday = day.strftime("%A")
        for key, template in templates.items():
            if weekday not in template.days:
                continue
            start = start_of(template.time)
            end_hour = int(start[:2]) + 1
            end = f"{end_hour:02d}:{start[3:]}"
            class_end = datetime.combine(day, time(end_hour, int(start[3:])), tzinfo=gym_tz())
            if class_end > now_local:
                continue  # only classes that have already happened get a recorded session
            existing = await session.scalar(
                select(Session).where(Session.template_id == template.id, Session.date == day)
            )
            if existing is None:
                existing = Session(
                    template_id=template.id,
                    date=day,
                    start_time=start,
                    end_time=end,
                    trainer_name=template.trainer_name,
                    status=SessionStatus.completed,
                    checklist_data={"items": []},
                )
                session.add(existing)
                await session.flush()
            sessions[f"{key}_{day.isoformat()}"] = existing

    return templates, sessions


async def seed_members(session: AsyncSession, plans: dict[str, MembershipPlan]) -> dict[str, Member]:
    today = gym_today()
    family = await get_or_create(
        session,
        Family,
        {"parent_phone": "+971501110001"},
        {
            "parent_name": "Sample Parent One",
            "parent_email": None,
            "parent_relationship": "mother",
            "notes": "Prefers WhatsApp",
        },
    )
    rows = [
        # name, phone, age, gender, plan, days until expiry (relative to start), family?, extra
        ("Sample Child One", None, 3, Gender.female, "Karate One Month - 3 Classes", 30, True, {}),
        ("Sample Child Two", None, 8, Gender.male, "Taekwondo Three Month - 3 Classes", 75, True, {}),
        ("Rashid Al Ketbi", "+971502220002", 11, Gender.male, "Taekwondo One Month - 3 Classes", 2, False, {}),
        ("Layla Haddad", "+971503330003", 9, Gender.female, "Karate One Month - 2 Classes", 18, False, {"medical_issues": "Mild asthma"}),
        ("Omar Siddiqui", "+971504440004", 29, Gender.male, "Kickboxing Three Month - 3 Classes", 50, False, {}),
        ("Priya Nair", "+971505550005", 34, Gender.female, "Fitness One Month - 3 Classes", -5, False, {}),
        ("Yousef Al Hammadi", "+971506660006", 41, Gender.male, "Karate Six Month - 3 Classes", 140, False, {"is_frozen": True}),
        ("Noura Al Mansoori", "+971507770007", 13, Gender.female, "Taekwondo One Year - 3 Classes", 300, False, {}),
    ]

    output = {}
    for name, phone, age, gender, plan_name, days_left, in_family, extra in rows:
        plan = plans[plan_name]
        expiry = today + timedelta(days=days_left)
        lookup = {"name": name, "family_id": family.id} if in_family else {"phone": phone}
        member = await get_or_create(
            session,
            Member,
            lookup,
            {
                "name": name,
                "phone": phone,
                "whatsapp_number": phone,
                "parent_phone": family.parent_phone if in_family else None,
                "family_id": family.id if in_family else None,
                "gender": gender,
                "age": age,
                "plan_id": plan.id,
                "expiry_date": expiry,
                "is_frozen": extra.get("is_frozen", False),
                "frozen_since": today - timedelta(days=10) if extra.get("is_frozen") else None,
                "freeze_until": today + timedelta(days=20) if extra.get("is_frozen") else None,
                "medical_issues": extra.get("medical_issues"),
                "messaging_opt_in": True,
            },
        )
        output[name] = member

        # The payment that started the current membership period.
        start = add_months(expiry, -plan.duration_months)
        existing_payment = await session.scalar(select(Payment.id).where(Payment.member_id == member.id).limit(1))
        if existing_payment is None:
            session.add(
                Payment(
                    member_id=member.id,
                    plan_id=plan.id,
                    amount=Decimal(plan.price),
                    currency="AED",
                    method=PaymentMethod.card if age >= 18 else PaymentMethod.cash,
                    kind=PaymentKind.renewal if name == "Omar Siddiqui" else PaymentKind.new,
                    paid_on=start,
                    period_start=start,
                    period_end=expiry,
                )
            )
    await session.flush()
    return output


async def seed_enrollments(
    session: AsyncSession,
    members: dict[str, Member],
    templates: dict[str, ScheduleTemplate],
) -> None:
    rows = [
        ("Sample Child One", "little_kids_karate_tue_thu_sat_1600"),
        ("Sample Child Two", "kids_taekwondo_mon_wed_1700"),
        ("Rashid Al Ketbi", "kids_taekwondo_mon_wed_fri_1800"),
        ("Layla Haddad", "kids_karate_tue_thu_sat_1700"),
        ("Omar Siddiqui", "adult_kickboxing_tue_thu_sat_1900"),
        ("Yousef Al Hammadi", "adult_karate_tue_thu_sat_2000"),
        ("Noura Al Mansoori", "kids_taekwondo_mon_wed_fri_1900"),
    ]
    for member_name, template_key in rows:
        member = members[member_name]
        template = templates[template_key]
        existing = await session.scalar(
            select(Enrollment).where(Enrollment.member_id == member.id, Enrollment.template_id == template.id)
        )
        if existing is None:
            session.add(Enrollment(member_id=member.id, template_id=template.id))


async def seed_check_ins(
    session: AsyncSession, members: dict[str, Member], templates: dict[str, ScheduleTemplate]
) -> None:
    """Realistic past visits: each enrolled member attended most of their classes."""
    today = gym_today()
    tz = gym_tz()
    enrollments = (await session.scalars(select(Enrollment).where(Enrollment.template_id.is_not(None)))).all()
    template_by_id = {t.id: t for t in templates.values()}
    member_ids = {m.id for m in members.values()}
    now = datetime.now(UTC)

    for enrollment in enrollments:
        template = template_by_id.get(enrollment.template_id)
        if template is None or enrollment.member_id not in member_ids:
            continue
        start = start_of(template.time)
        for offset in range(1, 29):
            day = today - timedelta(days=offset)
            if day.strftime("%A") not in template.days or (offset + enrollment.member_id) % 5 == 0:
                continue  # skip roughly one class in five
            check_in_at = datetime.combine(day, time(int(start[:2]), int(start[3:])), tzinfo=tz) - timedelta(minutes=10)
            check_out_at = check_in_at + timedelta(minutes=75)
            existing = await session.scalar(
                select(CheckIn.id).where(
                    CheckIn.member_id == enrollment.member_id,
                    CheckIn.check_in_time == check_in_at.astimezone(UTC),
                )
            )
            if existing is None and check_out_at.astimezone(UTC) < now:
                session.add(
                    CheckIn(
                        member_id=enrollment.member_id,
                        check_in_time=check_in_at.astimezone(UTC),
                        check_out_time=check_out_at.astimezone(UTC),
                    )
                )


async def seed_notifications(session: AsyncSession, members: dict[str, Member]) -> None:
    now = datetime.now(UTC)
    rows = [
        {
            "member": "Rashid Al Ketbi",
            "notification_type": NotificationType.membership_expiry,
            "status": NotificationStatus.pending,
            "scheduled_for": now + timedelta(hours=1),
            "payload": {"subject": "Membership Expiry Reminder", "text": "Membership expires in 2 days"},
        },
        {
            "member": "Priya Nair",
            "notification_type": NotificationType.membership_expiry,
            "status": NotificationStatus.failed,
            "scheduled_for": now - timedelta(days=1),
            "payload": {"subject": "Membership Expiry Reminder", "text": "Membership has expired"},
            "error_message": "whatsapp channel is not configured",
        },
    ]

    for row in rows:
        member = members[row.pop("member")]
        existing = await session.scalar(
            select(NotificationJob).where(
                NotificationJob.member_id == member.id,
                NotificationJob.notification_type == row["notification_type"],
                NotificationJob.status == row["status"],
            )
        )
        if existing is None:
            session.add(
                NotificationJob(
                    member_id=member.id,
                    provider="whatsapp",
                    channel=NotificationChannel.whatsapp,
                    recipient=member.whatsapp_number or member.phone or member.parent_phone,
                    **row,
                )
            )
        else:
            for key, value in row.items():
                setattr(existing, key, value)


async def seed_demo_data(session: AsyncSession) -> dict[str, int]:
    await seed_users(session)
    await retire_legacy_demo_data(session)
    plans = await seed_plans(session)
    templates, _ = await seed_schedule(session)
    members = await seed_members(session, plans)
    await seed_enrollments(session, members, templates)
    await session.flush()
    await seed_check_ins(session, members, templates)
    await seed_notifications(session, members)
    await session.commit()

    return {
        "users": await count_rows(session, AppUser),
        "plans": await count_rows(session, MembershipPlan),
        "members": await count_rows(session, Member),
        "schedule_templates": await count_rows(session, ScheduleTemplate),
        "sessions": await count_rows(session, Session),
        "enrollments": await count_rows(session, Enrollment),
        "check_ins": await count_rows(session, CheckIn),
        "payments": await count_rows(session, Payment),
        "notification_jobs": await count_rows(session, NotificationJob),
    }


async def count_rows(session: AsyncSession, model) -> int:
    return await session.scalar(select(func.count(model.id))) or 0
