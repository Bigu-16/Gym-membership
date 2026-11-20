from datetime import date, time, timedelta
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.db import get_db_session
from app.main import app
from app.models import AppUser, ClassSlot, Club
from app.models.enums import UserRole
from app.services import season
from app.services.fees import coverage_for
from app.models import Student



@pytest_asyncio.fixture
async def branches(client, admin_user):
    """Two branches made through the API (so they get the default slots and sizes)."""
    a = (await client.post("/api/v1/clubs", json={"name": "Bole", "monthly_fee": "1000"})).json()
    b = (await client.post("/api/v1/clubs", json={"name": "Piassa", "monthly_fee": "800"})).json()
    return a, b


def h(club: dict) -> dict:
    return {"X-Club-Id": str(club["id"])}


async def slots_of(client, club):
    return (await client.get("/api/v1/slots", headers=h(club))).json()


async def enrol(client, club, phone="0911223344", kids=None, method="telebirr", months=1, **extra):
    slots = await slots_of(client, club)
    kids = kids or [
        {"name": "Liya Abebe", "uniform_size": "60", "slot_id": slots[0]["id"]},
        {"name": "Nahom Abebe", "age": 9, "uniform_size": "75", "slot_id": slots[3]["id"]},
    ]
    return await client.post(
        "/api/v1/enrolments",
        headers=h(club),
        json={"guardian": {"name": "Abebe Kebede", "phone": phone}, "students": kids,
              "payment": {"method": method, "reference": "TB123", "months": months}, **extra},
    )


# ----- Season rules ---------------------------------------------------------------------


def make_club() -> Club:
    return Club(name="x", summer_start="06-15", summer_end="09-10", term_days=[5, 6], summer_days=[0, 1, 2, 3, 4, 5], timezone="Africa/Addis_Ababa")


def test_school_season_is_weekends_and_summer_is_monday_to_saturday():
    club = make_club()
    assert not season.is_summer(club, date(2026, 11, 21))
    assert season.is_class_day(club, date(2026, 11, 21))  # Saturday
    assert season.is_class_day(club, date(2026, 11, 22))  # Sunday
    assert not season.is_class_day(club, date(2026, 11, 23))  # Monday in term
    assert season.is_summer(club, date(2027, 7, 5))
    assert season.is_class_day(club, date(2027, 7, 5))  # Monday in summer
    assert not season.is_class_day(club, date(2027, 7, 11))  # Sunday in summer


def test_afternoon_slot_does_not_run_on_sunday():
    club = make_club()
    morning = ClassSlot(start_time=time(9), end_time=time(10), weekdays=[0, 1, 2, 3, 4, 5, 6], is_active=True)
    afternoon = ClassSlot(start_time=time(14), end_time=time(15), weekdays=[0, 1, 2, 3, 4, 5], is_active=True)
    sunday = date(2026, 11, 22)
    assert season.slot_runs_on(club, morning, sunday)
    assert not season.slot_runs_on(club, afternoon, sunday)
    # Term weekend count for a month: 4 or 5 Saturdays + Sundays.
    assert len(season.class_dates(club, morning, date(2026, 11, 1), date(2026, 11, 30))) == 9


def test_paying_early_continues_from_the_current_expiry():
    today = date(2026, 11, 20)
    paid_up = Student(expiry_date=date(2026, 11, 25))
    assert coverage_for(paid_up, 1, today) == (date(2026, 11, 26), date(2026, 12, 25))
    expired = Student(expiry_date=date(2026, 11, 1))
    assert coverage_for(expired, 2, today) == (today, date(2027, 1, 19))


# ----- Branches (tenants) ---------------------------------------------------------------


async def test_new_branch_gets_default_slots_and_sizes(client, branches):
    bole, _ = branches
    slots = await slots_of(client, bole)
    assert [(s["start_time"], s["weekdays"]) for s in slots] == [
        ("09:00:00", [0, 1, 2, 3, 4, 5, 6]), ("10:00:00", [0, 1, 2, 3, 4, 5, 6]),
        ("11:00:00", [0, 1, 2, 3, 4, 5, 6]), ("14:00:00", [0, 1, 2, 3, 4, 5]),
    ]
    sizes = (await client.get("/api/v1/uniforms/sizes", headers=h(bole))).json()
    assert [s["label"] for s in sizes] == ["55", "60", "65", "70", "75", "80", "85", "90", "95", "100"]


async def test_owner_must_choose_a_branch(client, branches):
    response = await client.get("/api/v1/students")
    assert response.status_code == 400


async def test_staff_only_see_their_own_branch(client, branches, session_factory):
    bole, piassa = branches
    assert (await enrol(client, bole)).status_code == 201
    async with session_factory() as db:
        staff = AppUser(full_name="Piassa Desk", email="piassa@test.local", password_hash="x", role=UserRole.staff, club_id=piassa["id"])
        db.add(staff)
        await db.commit()
        await db.refresh(staff)
    app.dependency_overrides[get_current_user] = lambda: staff

    assert (await client.get("/api/v1/students")).json() == []
    assert (await client.get("/api/v1/students", headers=h(bole))).status_code == 403
    assert [c["name"] for c in (await client.get("/api/v1/clubs")).json()] == ["Piassa"]
    # Another branch's records are invisible even by id.
    assert (await client.get("/api/v1/guardians/1")).status_code == 404
    assert (await client.patch("/api/v1/clubs/current", json={"is_active": False})).status_code == 403


# ----- Enrolment and fees ---------------------------------------------------------------


async def test_one_parent_enrols_several_kids_with_one_payment(client, branches):
    bole, _ = branches
    response = await enrol(client, bole)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["guardian"]["phone"] == "+251911223344"
    assert [s["name"] for s in body["guardian"]["students"]] == ["Liya Abebe", "Nahom Abebe"]
    assert {p["receipt_no"] for p in body["payments"]} == {body["receipt_no"]}
    assert all(p["method"] == "telebirr" and p["amount"] == "1000.00" for p in body["payments"])
    assert body["total"] == "2000.00"
    kid = body["guardian"]["students"][0]
    assert kid["status"] == "active" and kid["days_left"] >= 27
    assert kid["classes_left"] is not None


async def test_same_phone_is_offered_the_existing_family(client, branches):
    bole, piassa = branches
    await enrol(client, bole)
    again = await enrol(client, bole, phone="+251 911 223 344")
    assert again.status_code == 409
    assert again.json()["detail"]["code"] == "parent_exists"
    # The same parent may also train at another branch.
    assert (await enrol(client, piassa)).status_code == 201

    # Adding a third kid to the existing family.
    family = again.json()["detail"]["guardian_id"]
    slots = await slots_of(client, bole)
    added = await client.post("/api/v1/enrolments", headers=h(bole), json={
        "guardian_id": family, "students": [{"name": "Saba Abebe", "slot_id": slots[1]["id"], "amount": "700"}],
        "payment": {"method": "cash"},
    })
    assert added.status_code == 201
    assert len(added.json()["guardian"]["students"]) == 3
    assert added.json()["payments"][0]["amount"] == "700.00"


async def test_renewing_extends_expiry_and_can_be_undone(client, branches):
    bole, _ = branches
    body = (await enrol(client, bole)).json()
    kid = body["guardian"]["students"][0]
    renewed = await client.post("/api/v1/fees/renew", headers=h(bole), json={
        "items": [{"student_id": kid["id"]}], "payment": {"method": "cbe", "months": 2, "reference": "FT26"},
    })
    assert renewed.status_code == 201
    payment = renewed.json()[0]
    assert date.fromisoformat(payment["period_start"]) == date.fromisoformat(kid["expiry_date"]) + timedelta(days=1)
    assert payment["amount"] == "2000.00"
    after = (await client.get(f"/api/v1/students/{kid['id']}", headers=h(bole))).json()
    assert after["student"]["expiry_date"] == payment["period_end"]

    assert (await client.delete(f"/api/v1/fees/{payment['id']}", headers=h(bole))).status_code == 204
    restored = (await client.get(f"/api/v1/students/{kid['id']}", headers=h(bole))).json()
    assert restored["student"]["expiry_date"] == kid["expiry_date"]


async def test_expiry_colours_follow_branch_settings(client, branches):
    bole, _ = branches
    kid = (await enrol(client, bole)).json()["guardian"]["students"][0]
    today = date.fromisoformat((await client.get("/api/v1/dashboard", headers=h(bole))).json()["today"])
    for days, expected in ((10, "active"), (5, "expiring"), (1, "critical"), (-1, "expired")):
        await client.patch(f"/api/v1/students/{kid['id']}", headers=h(bole), json={"expiry_date": (today + timedelta(days=days)).isoformat()})
        listed = (await client.get("/api/v1/students", headers=h(bole))).json()
        assert next(s for s in listed if s["id"] == kid["id"])["status"] == expected


# ----- Uniforms -------------------------------------------------------------------------


async def test_uniform_order_receive_sell_and_count(client, branches):
    bole, _ = branches
    sizes = {s["label"]: s["id"] for s in (await client.get("/api/v1/uniforms/sizes", headers=h(bole))).json()}
    await client.patch("/api/v1/clubs/current", headers=h(bole), json={"uniform_price": "1200"})

    order = (await client.post("/api/v1/uniforms/orders", headers=h(bole), json={
        "supplier": "Merkato", "lines": [{"size_id": sizes["60"], "quantity": 5}, {"size_id": sizes["75"], "quantity": 2}],
    })).json()
    stock = {s["label"]: s for s in (await client.get("/api/v1/uniforms/sizes", headers=h(bole))).json()}
    assert stock["60"]["pending"] == 5 and stock["60"]["in_stock"] == 0

    # Nothing to sell before the order arrives.
    blocked = await client.post("/api/v1/uniforms/sales", headers=h(bole), json={"size_id": sizes["60"], "method": "cash", "buyer_name": "Walk In"})
    assert blocked.status_code == 409

    assert (await client.post(f"/api/v1/uniforms/orders/{order['id']}/receive", headers=h(bole), json={})).json()["status"] == "received"
    sale = await client.post("/api/v1/uniforms/sales", headers=h(bole), json={
        "size_id": sizes["60"], "quantity": 2, "method": "boa", "buyer_name": "Walk In Buyer", "buyer_phone": "0922000000",
    })
    assert sale.status_code == 201
    assert sale.json()["total"] == "2400.00"

    counted = await client.post("/api/v1/uniforms/stock-count", headers=h(bole), json={"size_id": sizes["55"], "counted": 4})
    assert counted.json()["in_stock"] == 4

    stock = {s["label"]: s for s in (await client.get("/api/v1/uniforms/sizes", headers=h(bole))).json()}
    assert (stock["60"]["pending"], stock["60"]["received"], stock["60"]["sold"], stock["60"]["in_stock"]) == (0, 5, 2, 3)
    assert stock["60"]["low"] is True  # 3 left = at the low-stock threshold
    assert stock["55"]["in_stock"] == 4

    # Enrolment with "buy uniform" takes from the same stock.
    slots = await slots_of(client, bole)
    enrolled = await enrol(client, bole, phone="0933000000", kids=[{"name": "Hana Tesfaye", "uniform_size": "60", "slot_id": slots[0]["id"], "buy_uniform": True}])
    assert enrolled.status_code == 201, enrolled.text
    assert enrolled.json()["uniform_sales"][0]["total"] == "1200.00"
    assert enrolled.json()["total"] == "2200.00"
    stock = {s["label"]: s for s in (await client.get("/api/v1/uniforms/sizes", headers=h(bole))).json()}
    assert stock["60"]["sold"] == 3 and stock["60"]["in_stock"] == 2

    # Out of stock for size 100: enrolment is refused rather than overselling.
    refused = await enrol(client, bole, phone="0944000000", kids=[{"name": "Dawit Alemu", "uniform_size": "100", "slot_id": slots[0]["id"], "buy_uniform": True}])
    assert refused.status_code == 409


# ----- Attendance -----------------------------------------------------------------------


async def test_register_marks_present_and_absent_and_feeds_the_report(client, branches):
    bole, _ = branches
    slots = await slots_of(client, bole)
    first = slots[0]["id"]
    kids = [{"name": n, "slot_id": first} for n in ("Abel Girma", "Bethel Girma", "Kalkidan Girma")]
    body = (await enrol(client, bole, kids=kids, start_date=(date.today() - timedelta(days=30)).isoformat())).json()
    ids = [s["id"] for s in body["guardian"]["students"]]
    day = (date.today() - timedelta(days=7)).isoformat()

    register = (await client.get(f"/api/v1/attendance/register?day={day}&slot_id={first}", headers=h(bole))).json()
    assert len(register["rows"]) == 3 and not register["saved"]

    saved = await client.put("/api/v1/attendance/register", headers=h(bole), json={"date": day, "slot_id": first, "present_ids": ids[:2]})
    assert saved.status_code == 200
    statuses = {r["student_id"]: r["status"] for r in saved.json()["rows"]}
    assert statuses == {ids[0]: "present", ids[1]: "present", ids[2]: "absent"}

    # Saving again corrects the register instead of duplicating it.
    await client.put("/api/v1/attendance/register", headers=h(bole), json={"date": day, "slot_id": first, "present_ids": ids})
    report = (await client.get("/api/v1/reports/attendance", headers=h(bole))).json()
    assert (report["present"], report["absent"], report["rate"]) == (3, 0, 1.0)

    future = (date.today() + timedelta(days=3)).isoformat()
    assert (await client.put("/api/v1/attendance/register", headers=h(bole), json={"date": future, "slot_id": first, "present_ids": []})).status_code == 422


async def test_dashboard_and_money_report(client, branches):
    bole, _ = branches
    await enrol(client, bole)
    dash = (await client.get("/api/v1/dashboard", headers=h(bole))).json()
    assert dash["counts"]["active"] == 2
    assert dash["money_month"]["fees"] == "2000.00"
    assert dash["money_month"]["by_method"]["telebirr"]["fees"] == "2000.00"
    assert "uniform_price" in dash["setup_needed"]
    assert {s["label"] for s in dash["low_stock"]} >= {"55", "100"}
