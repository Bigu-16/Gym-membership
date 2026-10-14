from collections import Counter, defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.timeutils import add_months, gym_day_bounds_utc, gym_today, to_gym_time
from app.db import get_db_session
from app.models import AppUser
from app.models import CheckIn, Enrollment, Family, Member, MembershipPlan, NotificationJob, Payment, ScheduleTemplate
from app.models.enums import NotificationStatus, PaymentKind
from app.schemas.analytics import (
    AnalyticsSummary,
    AttendancePoint,
    ClassFill,
    GrowthPoint,
    HeatCell,
    LabelValue,
    MembershipTotals,
    MonthValue,
    NotificationAnalytics,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

PAYMENT_METHOD_LABELS = {"cash": "Cash", "card": "Card", "bank_transfer": "Bank transfer", "other": "Other"}


def month_key(value: date) -> str:
    return f"{value.year:04d}-{value.month:02d}"


def last_months(today: date, count: int) -> list[str]:
    first = today.replace(day=1)
    return [month_key(add_months(first, offset)) for offset in range(-(count - 1), 1)]


def sorted_labels(counter: Counter) -> list[LabelValue]:
    return [LabelValue(label=label, value=float(value)) for label, value in counter.most_common()]


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> AnalyticsSummary:
    """Everything the Analytics page shows, computed from real records on the gym's clock."""
    today = gym_today()
    months = last_months(today, 12)

    plans = {plan.id: plan for plan in (await db.scalars(select(MembershipPlan))).all()}
    members = (await db.scalars(select(Member))).all()
    payments = (await db.scalars(select(Payment).where(Payment.paid_on >= date.fromisoformat(f"{months[0]}-01")))).all()

    # Membership status
    active = [m for m in members if not m.is_frozen and m.expiry_date is not None and m.expiry_date >= today]
    totals = MembershipTotals(
        total=len(members),
        active=len(active),
        expired=sum(1 for m in members if m.expiry_date is not None and m.expiry_date < today),
        frozen=sum(1 for m in members if m.is_frozen),
        expiring_7_days=sum(1 for m in active if m.expiry_date <= today + timedelta(days=7)),
        no_package=sum(1 for m in members if m.plan_id is None),
        families=await db.scalar(select(func.count(Family.id))) or 0,
    )

    # Revenue (only money actually recorded at the desk)
    revenue_month: dict[str, float] = defaultdict(float)
    revenue_program: Counter = Counter()
    revenue_method: Counter = Counter()
    for payment in payments:
        amount = float(payment.amount)
        revenue_month[month_key(payment.paid_on)] += amount
        plan = plans.get(payment.plan_id) if payment.plan_id else None
        revenue_program[plan.program if plan else "Other"] += amount
        revenue_method[PAYMENT_METHOD_LABELS.get(payment.method.value, payment.method.value)] += amount

    # Growth
    joined: Counter = Counter(month_key(to_gym_time(m.created_at).date()) for m in members if m.created_at)

    # Who is training what (active members only)
    by_program: Counter = Counter()
    by_plan: Counter = Counter()
    for member in active:
        plan = plans.get(member.plan_id) if member.plan_id else None
        by_program[plan.program if plan else "No package"] += 1
        by_plan[plan.name if plan else "No package"] += 1

    age_groups: Counter = Counter()
    gender: Counter = Counter()
    for member in active:
        if member.age <= 6:
            age_groups["Little kids (≤6)"] += 1
        elif member.age <= 12:
            age_groups["Kids (7–12)"] += 1
        elif member.age <= 17:
            age_groups["Teens (13–17)"] += 1
        else:
            age_groups["Adults (18+)"] += 1
        gender[(member.gender.value if member.gender else "unspecified").capitalize()] += 1

    # Attendance: last 30 days per day, and an 8-week weekday x hour heatmap
    heat_start, _ = gym_day_bounds_utc(today - timedelta(weeks=8))
    check_ins = (await db.scalars(select(CheckIn).where(CheckIn.check_in_time >= heat_start))).all()
    per_day: Counter = Counter()
    heat: Counter = Counter()
    for check_in in check_ins:
        local = to_gym_time(check_in.check_in_time)
        heat[(local.weekday(), local.hour)] += 1
        if local.date() > today - timedelta(days=30):
            per_day[local.date()] += 1
    check_ins_by_day = [
        AttendancePoint(date=day, attendance_count=per_day.get(day, 0))
        for day in (today - timedelta(days=offset) for offset in range(29, -1, -1))
    ]

    # Class fill from real class enrollments
    templates = (await db.scalars(select(ScheduleTemplate).order_by(ScheduleTemplate.time))).all()
    enrollment_counts = dict(
        (await db.execute(
            select(Enrollment.template_id, func.count(Enrollment.id))
            .where(Enrollment.template_id.is_not(None))
            .group_by(Enrollment.template_id)
        )).all()
    )

    # Renewals vs lapsed memberships over the last 90 days
    window_start = today - timedelta(days=90)
    renewed_members = set(
        (await db.scalars(
            select(Payment.member_id).where(Payment.kind == PaymentKind.renewal, Payment.paid_on >= window_start)
        )).all()
    )
    lapsed = {
        m.id for m in members
        if m.expiry_date is not None and window_start <= m.expiry_date < today and m.id not in renewed_members
    }
    decided = len(renewed_members) + len(lapsed)

    return AnalyticsSummary(
        generated_on=today,
        currency="AED",
        totals=totals,
        revenue_this_month=round(revenue_month.get(months[-1], 0.0), 2),
        revenue_last_month=round(revenue_month.get(months[-2], 0.0), 2),
        revenue_by_month=[MonthValue(month=m, value=round(revenue_month.get(m, 0.0), 2)) for m in months],
        revenue_by_program=sorted_labels(revenue_program),
        revenue_by_method=sorted_labels(revenue_method),
        new_members_by_month=[MonthValue(month=m, value=joined.get(m, 0)) for m in months],
        members_by_program=sorted_labels(by_program),
        members_by_plan=sorted_labels(by_plan),
        age_groups=sorted_labels(age_groups),
        gender_split=sorted_labels(gender),
        check_ins_last_30_days=sum(point.attendance_count for point in check_ins_by_day),
        check_ins_by_day=check_ins_by_day,
        attendance_heatmap=[HeatCell(weekday=wd, hour=hr, count=count) for (wd, hr), count in sorted(heat.items())],
        class_fill=[
            ClassFill(
                template_id=t.id,
                title=t.title,
                days=list(t.days),
                time=t.time,
                capacity=t.capacity,
                enrolled=enrollment_counts.get(t.id, 0),
            )
            for t in templates
        ],
        renewals_last_90_days=len(renewed_members),
        expired_unrenewed_last_90_days=len(lapsed),
        renewal_rate=round(len(renewed_members) / decided, 4) if decided else None,
    )


@router.get("/growth", response_model=list[GrowthPoint])
async def get_growth_analytics(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[GrowthPoint]:
    created = (await db.scalars(select(Member.created_at))).all()
    counts = Counter(to_gym_time(value).date() for value in created if value)
    return [GrowthPoint(date=day, new_members=count) for day, count in sorted(counts.items())]


@router.get("/attendance", response_model=list[AttendancePoint])
async def get_attendance_analytics(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> list[AttendancePoint]:
    times = (await db.scalars(select(CheckIn.check_in_time))).all()
    counts = Counter(to_gym_time(value).date() for value in times)
    return [AttendancePoint(date=day, attendance_count=count) for day, count in sorted(counts.items())]


@router.get("/notifications", response_model=NotificationAnalytics)
async def get_notification_analytics(
    db: AsyncSession = Depends(get_db_session),
    _: AppUser = Depends(get_current_user),
) -> NotificationAnalytics:
    by_channel_rows = await db.execute(
        select(NotificationJob.channel, func.count(NotificationJob.id)).group_by(NotificationJob.channel)
    )
    by_channel = {row[0].value: row[1] for row in by_channel_rows.all()}

    by_type_rows = await db.execute(
        select(NotificationJob.notification_type, func.count(NotificationJob.id)).group_by(
            NotificationJob.notification_type
        )
    )
    by_type = {row[0].value: row[1] for row in by_type_rows.all()}

    by_status_rows = await db.execute(
        select(NotificationJob.status, func.count(NotificationJob.id)).group_by(NotificationJob.status)
    )
    by_status = {row[0].value: row[1] for row in by_status_rows.all()}

    pending = by_status.get(NotificationStatus.pending.value, 0)
    processed = by_status.get(NotificationStatus.processed.value, 0)
    failed = by_status.get(NotificationStatus.failed.value, 0)
    total = pending + processed + failed
    finalized = processed + failed
    delivery_rate = round(processed / finalized, 4) if finalized else 0.0

    return NotificationAnalytics(
        total=total,
        pending=pending,
        processed=processed,
        failed=failed,
        delivery_rate=delivery_rate,
        by_channel=by_channel,
        by_type=by_type,
        by_status=by_status,
    )
