from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import (
    AppUser,
    CheckIn,
    Enrollment,
    Member,
    MembershipPlan,
    NotificationJob,
    ScheduleTemplate,
    Session,
)
from app.models.enums import (
    Gender,
    NotificationStatus,
    NotificationType,
    ScheduleType,
    SessionStatus,
    UserRole,
)

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "ChangeMe123!"
STAFF_EMAIL = "staff@example.com"
STAFF_PASSWORD = "ChangeMe123!"


async def get_or_create(session: AsyncSession, model, lookup: dict, defaults: dict | None = None):
    item = await session.scalar(select(model).filter_by(**lookup))
    if item is not None:
        for key, value in (defaults or {}).items():
            setattr(item, key, value)
        return item

    item = model(**lookup, **(defaults or {}))
    session.add(item)
    await session.flush()
    return item


async def seed_users(session: AsyncSession) -> None:
    await get_or_create(
        session,
        AppUser,
        {"email": ADMIN_EMAIL},
        {
            "full_name": "Admin User",
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
            "full_name": "Front Desk Staff",
            "password_hash": hash_password(STAFF_PASSWORD),
            "role": UserRole.staff,
            "is_active": True,
        },
    )


async def seed_plans(session: AsyncSession) -> dict[str, MembershipPlan]:
    plans = {
        "Starter Access": {"price": Decimal("49.00"), "duration_days": 30},
        "Wellness Pro": {"price": Decimal("89.00"), "duration_days": 45},
        "Elite Performance": {"price": Decimal("149.00"), "duration_days": 60},
        "Family Group": {"price": Decimal("199.00"), "duration_days": 60},
    }
    output = {}
    for name, values in plans.items():
        output[name] = await get_or_create(
            session,
            MembershipPlan,
            {"name": name},
            {**values, "is_active": True},
        )
    return output


async def seed_members(session: AsyncSession, plans: dict[str, MembershipPlan]) -> dict[str, Member]:
    today = date.today()
    member_rows = [
        {
            "name": "Alexander Rossi",
            "phone": "+15550001001",
            "gender": Gender.male,
            "plan": "Elite Performance",
            "expiry_date": today + timedelta(days=21),
        },
        {
            "name": "Elena Vance",
            "phone": "+15550001002",
            "gender": Gender.female,
            "plan": "Wellness Pro",
            "expiry_date": today + timedelta(days=7),
        },
        {
            "name": "Marcus Thorne",
            "phone": "+15550001003",
            "gender": Gender.male,
            "plan": "Elite Performance",
            "expiry_date": today + timedelta(days=2),
        },
        {
            "name": "Sophia Chen",
            "phone": "+15550001004",
            "gender": Gender.female,
            "plan": "Starter Access",
            "expiry_date": today - timedelta(days=4),
        },
        {
            "name": "Julian Drax",
            "phone": "+15550001005",
            "gender": Gender.other,
            "plan": "Wellness Pro",
            "expiry_date": today + timedelta(days=32),
            "is_frozen": True,
        },
        {
            "name": "Maya Johnson",
            "phone": "+15550001006",
            "gender": Gender.female,
            "plan": "Elite Performance",
            "expiry_date": today + timedelta(days=50),
        },
        {
            "name": "Noah Carter",
            "phone": "+15550002001",
            "parent_phone": "+15559990001",
            "gender": Gender.male,
            "plan": "Family Group",
            "expiry_date": today + timedelta(days=45),
        },
        {
            "name": "Ava Carter",
            "phone": "+15550002002",
            "parent_phone": "+15559990001",
            "gender": Gender.female,
            "plan": "Family Group",
            "expiry_date": today + timedelta(days=45),
        },
    ]

    output = {}
    for row in member_rows:
        plan = plans[row.pop("plan")]
        member = await get_or_create(
            session,
            Member,
            {"phone": row["phone"]},
            {
                "name": row["name"],
                "parent_phone": row.get("parent_phone"),
                "gender": row["gender"],
                "medical_issues": row.get("medical_issues"),
                "plan_id": plan.id,
                "expiry_date": row["expiry_date"],
                "is_frozen": row.get("is_frozen", False),
                "messaging_opt_in": True,
            },
        )
        output[member.name] = member
    return output


async def seed_schedule(session: AsyncSession) -> tuple[dict[str, ScheduleTemplate], dict[str, Session]]:
    today = date.today()
    template_rows = [
        {
            "title": "Elite Performance",
            "type": ScheduleType.group,
            "days": ["Monday", "Wednesday", "Friday"],
            "time": "14:00",
            "capacity": 12,
        },
        {
            "title": "Yoga Flow",
            "type": ScheduleType.group,
            "days": ["Tuesday", "Thursday"],
            "time": "16:30",
            "capacity": 16,
        },
        {
            "title": "Personal Training",
            "type": ScheduleType.personal,
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "time": "10:00",
            "capacity": 1,
        },
    ]

    templates = {}
    for row in template_rows:
        templates[row["title"]] = await get_or_create(
            session,
            ScheduleTemplate,
            {"title": row["title"]},
            {
                "type": row["type"],
                "days": row["days"],
                "time": row["time"],
                "capacity": row["capacity"],
            },
        )

    session_rows = [
        {
            "key": "elite_today",
            "template": "Elite Performance",
            "date": today,
            "trainer_name": "Marcus Thorne",
            "status": SessionStatus.in_progress,
        },
        {
            "key": "yoga_today",
            "template": "Yoga Flow",
            "date": today,
            "trainer_name": "Sophia Chen",
            "status": SessionStatus.upcoming,
        },
        {
            "key": "pt_tomorrow",
            "template": "Personal Training",
            "date": today + timedelta(days=1),
            "trainer_name": "Elena Vance",
            "status": SessionStatus.upcoming,
        },
        {
            "key": "elite_yesterday",
            "template": "Elite Performance",
            "date": today - timedelta(days=1),
            "trainer_name": "Marcus Thorne",
            "status": SessionStatus.completed,
        },
    ]

    sessions = {}
    for row in session_rows:
        template = templates[row["template"]]
        existing = await session.scalar(
            select(Session).where(
                Session.template_id == template.id,
                Session.date == row["date"],
                Session.trainer_name == row["trainer_name"],
            )
        )
        if existing is None:
            existing = Session(
                template_id=template.id,
                date=row["date"],
                trainer_name=row["trainer_name"],
                status=row["status"],
                checklist_data={
                    "items": [
                        {"text": "Warm-up completed", "checked": True},
                        {"text": "Main session complete", "checked": row["status"] == SessionStatus.completed},
                        {"text": "Cool-down recorded", "checked": False},
                    ]
                },
            )
            session.add(existing)
            await session.flush()
        else:
            existing.status = row["status"]
        sessions[row["key"]] = existing

    return templates, sessions


async def seed_enrollments(
    session: AsyncSession,
    members: dict[str, Member],
    templates: dict[str, ScheduleTemplate],
    sessions: dict[str, Session],
) -> None:
    rows = [
        {"member": "Alexander Rossi", "template": templates["Elite Performance"]},
        {"member": "Marcus Thorne", "template": templates["Elite Performance"]},
        {"member": "Maya Johnson", "template": templates["Elite Performance"]},
        {"member": "Elena Vance", "template": templates["Yoga Flow"]},
        {"member": "Sophia Chen", "session": sessions["yoga_today"]},
        {"member": "Noah Carter", "template": templates["Yoga Flow"]},
        {"member": "Ava Carter", "template": templates["Yoga Flow"]},
    ]

    for row in rows:
        member = members[row["member"]]
        template = row.get("template")
        target_session = row.get("session")
        existing = await session.scalar(
            select(Enrollment).where(
                Enrollment.member_id == member.id,
                Enrollment.template_id == (template.id if template else None),
                Enrollment.session_id == (target_session.id if target_session else None),
            )
        )
        if existing is None:
            session.add(
                Enrollment(
                    member_id=member.id,
                    template_id=template.id if template else None,
                    session_id=target_session.id if target_session else None,
                )
            )


async def seed_check_ins(session: AsyncSession, members: dict[str, Member]) -> None:
    today = date.today()
    now = datetime.now(timezone.utc)
    rows = [
        {"member": "Alexander Rossi", "in": now.replace(second=0, microsecond=0) - timedelta(minutes=85), "out": None},
        {
            "member": "Elena Vance",
            "in": datetime.combine(today, time(9, 0), tzinfo=timezone.utc),
            "out": datetime.combine(today, time(10, 10), tzinfo=timezone.utc),
        },
        {"member": "Maya Johnson", "in": now - timedelta(minutes=35), "out": None},
        {
            "member": "Marcus Thorne",
            "in": datetime.combine(today - timedelta(days=1), time(18, 0), tzinfo=timezone.utc),
            "out": datetime.combine(today - timedelta(days=1), time(19, 20), tzinfo=timezone.utc),
        },
        {
            "member": "Noah Carter",
            "in": datetime.combine(today - timedelta(days=2), time(16, 0), tzinfo=timezone.utc),
            "out": datetime.combine(today - timedelta(days=2), time(17, 5), tzinfo=timezone.utc),
        },
    ]

    for row in rows:
        member = members[row["member"]]
        if row["out"] is None:
            existing = await session.scalar(
                select(CheckIn).where(
                    CheckIn.member_id == member.id,
                    CheckIn.check_out_time.is_(None),
                )
            )
        else:
            existing = await session.scalar(
                select(CheckIn).where(
                    CheckIn.member_id == member.id,
                    CheckIn.check_in_time == row["in"],
                )
            )
        if existing is None:
            session.add(
                CheckIn(
                    member_id=member.id,
                    check_in_time=row["in"],
                    check_out_time=row["out"],
                )
            )


async def seed_notifications(session: AsyncSession, members: dict[str, Member]) -> None:
    now = datetime.now(timezone.utc)
    rows = [
        {
            "member": "Marcus Thorne",
            "notification_type": NotificationType.membership_expiry,
            "status": NotificationStatus.pending,
            "scheduled_for": now + timedelta(hours=1),
            "payload": {"message": "Membership expires soon", "days_remaining": 2},
        },
        {
            "member": "Sophia Chen",
            "notification_type": NotificationType.membership_expiry,
            "status": NotificationStatus.failed,
            "scheduled_for": now - timedelta(days=1),
            "payload": {"message": "Membership has expired", "days_overdue": 4},
            "error_message": "Demo failed provider response",
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
            session.add(NotificationJob(member_id=member.id, provider="internal", **row))
        else:
            for key, value in row.items():
                setattr(existing, key, value)


async def seed_demo_data(session: AsyncSession) -> dict[str, int]:
    await seed_users(session)
    plans = await seed_plans(session)
    members = await seed_members(session, plans)
    templates, sessions = await seed_schedule(session)
    await seed_enrollments(session, members, templates, sessions)
    await seed_check_ins(session, members)
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
        "notification_jobs": await count_rows(session, NotificationJob),
    }


async def count_rows(session: AsyncSession, model) -> int:
    return await session.scalar(select(func.count(model.id))) or 0
