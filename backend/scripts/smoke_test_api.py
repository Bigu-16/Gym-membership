"""Exercise the backend API against a running local server.

Default target: http://localhost:8000
Default admin: admin@example.com / ChangeMe123!

Example:
    python scripts/smoke_test_api.py
    API_BASE_URL=http://localhost:8000 python scripts/smoke_test_api.py
"""

from __future__ import annotations

import json
import os
import sys
from uuid import uuid4
from datetime import date, datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")


class ApiError(RuntimeError):
    def __init__(self, method: str, path: str, status: int | None, body: str):
        self.method = method
        self.path = path
        self.status = status
        self.body = body
        super().__init__(f"{method} {path} failed with {status}: {body}")


def request(method: str, path: str, *, token: str | None = None, json_body=None, form_body=None):
    headers = {}
    body = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if json_body is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(json_body).encode()
    if form_body is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        body = urlencode(form_body).encode()

    req = Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=20) as response:
            raw = response.read().decode()
            if not raw:
                return None
            return json.loads(raw)
    except HTTPError as exc:
        raise ApiError(method, path, exc.code, exc.read().decode()) from exc
    except URLError as exc:
        raise ApiError(method, path, None, str(exc.reason)) from exc


def expect_error(expected_status: int, method: str, path: str, **kwargs) -> None:
    try:
        request(method, path, **kwargs)
    except ApiError as exc:
        if exc.status == expected_status:
            return
        raise
    raise AssertionError(f"{method} {path} should have returned {expected_status}")


def login() -> str:
    try:
        request(
            "POST",
            "/api/v1/auth/bootstrap-admin",
            json_body={
                "full_name": "Admin User",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
            },
        )
        print("created bootstrap admin")
    except ApiError as exc:
        if exc.status != 409:
            raise

    response = request(
        "POST",
        "/api/v1/auth/login",
        form_body={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    return response["access_token"]


def run() -> None:
    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + uuid4().hex[:8]
    phone_suffix = suffix[-10:]
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    next_month = (date.today() + timedelta(days=30)).isoformat()

    checks: list[str] = []

    request("GET", "/")
    checks.append("root")
    request("GET", "/api/v1/health/live")
    checks.append("health live")
    request("GET", "/api/v1/health/ready")
    checks.append("health ready")

    token = login()
    me = request("GET", "/api/v1/auth/me", token=token)
    assert me["email"] == ADMIN_EMAIL
    checks.append("auth bootstrap/login/me")

    staff = request(
        "POST",
        "/api/v1/users/",
        token=token,
        json_body={
            "full_name": f"Smoke Staff {suffix}",
            "email": f"smoke.staff.{suffix}@example.com",
            "password": "ChangeMe123!",
            "role": "staff",
            "is_active": True,
        },
    )
    request("GET", "/api/v1/users/", token=token)
    request("GET", f"/api/v1/users/{staff['id']}", token=token)
    request("PATCH", f"/api/v1/users/{staff['id']}", token=token, json_body={"full_name": f"Smoke Staff Updated {suffix}"})
    request("PATCH", f"/api/v1/users/{staff['id']}/password", token=token, json_body={"password": "ChangeMe456!"})
    checks.append("users CRUD/update password")

    plan = request(
        "POST",
        "/api/v1/plans/",
        token=token,
        json_body={
            "name": f"Smoke Taekwondo Plan {suffix}",
            "program": "Taekwondo",
            "duration_label": "One Month",
            "duration_months": 1,
            "duration_days": 30,
            "classes_per_week": 3,
            "price": "350.00",
            "currency": "AED",
            "included_items": ["Trial assessment"],
            "description": "Smoke test package",
            "sort_order": 99,
            "is_active": True,
        },
    )
    temp_plan = request(
        "POST",
        "/api/v1/plans/",
        token=token,
        json_body={
            "name": f"Smoke Temp Plan {suffix}",
            "program": "Fitness",
            "duration_label": "3 Month",
            "duration_months": 3,
            "duration_days": 90,
            "classes_per_week": 3,
            "price": "900.00",
            "currency": "AED",
            "included_items": ["Free gloves"],
            "is_active": True,
        },
    )
    request("GET", "/api/v1/plans/", token=token)
    request("GET", "/api/v1/plans/?program=Taekwondo&is_active=true", token=token)
    request("GET", f"/api/v1/plans/{plan['id']}", token=token)
    request("PUT", f"/api/v1/plans/{plan['id']}", token=token, json_body={"is_active": False, "sort_order": 100})
    expect_error(409, "POST", "/api/v1/plans/", token=token, json_body={
        "name": plan["name"],
        "program": "Taekwondo",
        "duration_label": "One Month",
        "duration_months": 1,
        "duration_days": 30,
        "price": "350.00",
    })
    request("DELETE", f"/api/v1/plans/{temp_plan['id']}", token=token)
    checks.append("plans CRUD/filter/duplicate/delete")

    template = request(
        "POST",
        "/api/v1/schedule/templates",
        token=token,
        json_body={
            "title": f"Smoke Boxing {suffix}",
            "type": "group",
            "days": ["Monday", "Wednesday"],
            "time": "18:00",
            "capacity": 3,
        },
    )
    session = request(
        "POST",
        "/api/v1/schedule/sessions",
        token=token,
        json_body={
            "template_id": template["id"],
            "date": today,
            "trainer_name": "Smoke Trainer",
            "status": "upcoming",
            "checklist_data": {"items": [{"text": "Setup", "checked": False}]},
        },
    )
    request("GET", "/api/v1/schedule/templates", token=token)
    request("GET", "/api/v1/schedule/sessions", token=token)
    request("PATCH", f"/api/v1/schedule/sessions/{session['id']}/status", token=token, json_body={"status": "in_progress"})
    checks.append("schedule templates/sessions/status")

    member = request(
        "POST",
        "/api/v1/members/",
        token=token,
        json_body={
            "name": f"Smoke Member {suffix}",
            "phone": f"+15559{phone_suffix}",
            "age": 33,
            "gender": "other",
            "plan_id": plan["id"],
            "expiry_date": next_month,
            "messaging_opt_in": True,
        },
    )
    request("GET", "/api/v1/members/", token=token)
    request("GET", f"/api/v1/members/{member['id']}", token=token)
    request("PUT", f"/api/v1/members/{member['id']}", token=token, json_body={"medical_issues": "Smoke test note"})
    request("PATCH", f"/api/v1/members/{member['id']}/freeze", token=token, json_body={"is_frozen": False})
    expect_error(409, "POST", "/api/v1/members/", token=token, json_body={
        "name": "Duplicate Smoke",
        "phone": member["phone"],
        "age": 33,
        "gender": "other",
    })
    checks.append("members CRUD/search/errors")

    family_phone = f"+15558{phone_suffix}"
    family = request(
        "POST",
        "/api/v1/members/families",
        token=token,
        json_body={
            "parent": {
                "name": f"Smoke Parent {suffix}",
                "phone": family_phone,
                "email": f"parent-{suffix}@example.com",
                "address": "100 Smoke Test Ave",
                "relationship": "parent",
                "notes": "Created by smoke test",
            },
            "members": [
                {
                    "name": f"Smoke Family A {suffix}",
                    "phone": f"+15557{phone_suffix}",
                    "parent_phone": family_phone,
                    "age": 11,
                    "gender": "female",
                    "expiry_date": tomorrow,
                },
                {
                    "name": f"Smoke Family B {suffix}",
                    "phone": f"+15556{phone_suffix}",
                    "parent_phone": family_phone,
                    "age": 9,
                    "gender": "male",
                    "expiry_date": tomorrow,
                },
            ]
        },
    )
    request("GET", f"/api/v1/members/families?parent_phone={family_phone}", token=token)
    request("PATCH", f"/api/v1/members/families/{family['id']}/freeze", token=token, json_body={"is_frozen": True})
    checks.append("family create/list/freeze")

    enrollment = request(
        "POST",
        "/api/v1/enrollments/",
        token=token,
        json_body={"member_id": member["id"], "template_id": template["id"]},
    )
    request("GET", "/api/v1/enrollments/", token=token)
    expect_error(409, "POST", "/api/v1/enrollments/", token=token, json_body={"member_id": member["id"], "template_id": template["id"]})
    expect_error(400, "POST", "/api/v1/enrollments/", token=token, json_body={"member_id": family["members"][0]["id"], "template_id": template["id"]})
    request("DELETE", f"/api/v1/enrollments/{enrollment['id']}", token=token)
    checks.append("enrollments create/list/duplicate/delete/frozen-error")

    check_in = request("POST", "/api/v1/check-ins/", token=token, json_body={"member_id": member["id"]})
    request("GET", "/api/v1/check-ins/", token=token)
    expect_error(409, "POST", "/api/v1/check-ins/", token=token, json_body={"member_id": member["id"]})
    request("PATCH", f"/api/v1/check-ins/{check_in['id']}/check-out", token=token, json_body={})
    checks.append("check-ins create/list/duplicate/check-out")

    request("GET", "/api/v1/dashboard/stats", token=token)
    request("GET", "/api/v1/dashboard/active-members", token=token)
    request("GET", "/api/v1/dashboard/recent-activities", token=token)
    request("GET", "/api/v1/analytics/growth", token=token)
    request("GET", "/api/v1/analytics/attendance", token=token)
    request("GET", "/api/v1/notifications/jobs", token=token)
    seed_result = request("POST", "/api/v1/tasks/seed-demo-data", token=token)
    assert seed_result["status"] == "seeded"
    checks.append("dashboard/analytics/notifications/demo seed")

    request("POST", "/api/v1/tasks/membership-expiry-reminders", token=token)
    request("POST", "/api/v1/tasks/process-notification-jobs", token=token)
    checks.append("task enqueue endpoints")

    request("DELETE", f"/api/v1/members/{member['id']}", token=token)
    checks.append("member delete cleanup")

    print(f"Smoke tests passed against {BASE_URL}")
    for check in checks:
        print(f"- {check}")


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        print(f"Smoke tests failed: {exc}", file=sys.stderr)
        sys.exit(1)
