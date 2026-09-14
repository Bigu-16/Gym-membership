from __future__ import annotations

from app.models import Member, MembershipPlan
from app.services.messaging.base import RenderedMessage


def _plan_lines(plan: MembershipPlan | None) -> list[str]:
    if plan is None:
        return ["Payment plan: not assigned yet"]

    lines = [
        "— Payment Plan —",
        f"Plan: {plan.name} ({plan.program})",
        f"Price: {plan.price} {plan.currency}",
        f"Duration: {plan.duration_label} ({plan.duration_months} month(s), {plan.duration_days} days)",
    ]
    if plan.classes_per_week:
        lines.append(f"Classes per week: {plan.classes_per_week}")
    if plan.included_items:
        lines.append("Included: " + ", ".join(str(item) for item in plan.included_items))
    return lines


def build_enrollment_message(member: Member, plan: MembershipPlan | None) -> RenderedMessage:
    """Confirmation sent when a member registers — echoes all their data + plan."""
    lines = [
        f"Hi {member.name}, welcome to the gym! Here are your registration details:",
        "",
        "— Your Details —",
        f"Name: {member.name}",
        f"Phone: {member.phone}",
        f"Age: {member.age}",
    ]
    if member.gender:
        lines.append(f"Gender: {member.gender.value}")
    if member.email:
        lines.append(f"Email: {member.email}")
    if member.parent_phone:
        lines.append(f"Parent/guardian phone: {member.parent_phone}")
    if member.medical_issues:
        lines.append(f"Medical notes: {member.medical_issues}")
    if member.expiry_date:
        lines.append(f"Membership valid until: {member.expiry_date.isoformat()}")

    lines.append("")
    lines.extend(_plan_lines(plan))
    lines.append("")
    lines.append("Please reply if any detail is incorrect. See you at the gym!")

    return RenderedMessage(subject="Welcome — Registration Confirmed", text="\n".join(lines))


def build_class_enrollment_message(
    member: Member,
    plan: MembershipPlan | None,
    class_label: str,
) -> RenderedMessage:
    """Confirmation sent when a member is enrolled into a class/session."""
    lines = [
        f"Hi {member.name}, you're enrolled in: {class_label}.",
        "",
        "— Your Details —",
        f"Name: {member.name}",
        f"Phone: {member.phone}",
    ]
    if member.expiry_date:
        lines.append(f"Membership valid until: {member.expiry_date.isoformat()}")
    lines.append("")
    lines.extend(_plan_lines(plan))
    lines.append("")
    lines.append("We look forward to seeing you in class!")

    return RenderedMessage(subject=f"Class Enrollment — {class_label}", text="\n".join(lines))


def build_announcement_message(subject: str, body: str) -> RenderedMessage:
    return RenderedMessage(subject=subject, text=body)
