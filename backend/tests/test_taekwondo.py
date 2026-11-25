from datetime import date, time, timedelta

import pytest_asyncio
from fastapi import HTTPException

from app.api.deps import get_current_admin_user, get_current_user
from app.core.tenancy import bind_tenant
from app.main import app
from app.models import AppUser, ClassSlot, Club, Student
from app.models.enums import UserRole
from app.services import season
from app.services.clubs import new_club, seed_club_defaults
from app.services.fees import coverage_for

API = "/api/v1/tkd"


async def make_tenant(session_factory, name: str, fee: str) -> tuple[Club, AppUser, AppUser]:
    """A taekwondo tenant with its default class times and sizes, plus an admin and a staff login."""
    async with session_factory() as db:
        club = new_club(name, monthly_fee=fee)
        db.add(club)
        await db.flush()
        bind_tenant(db, club.id)
        seed_club_defaults(db, club)
        slug = name.lower().replace(" ", "")
        admin = AppUser(full_name=f"{name} Admin", email=f"admin@{slug}.test", password_hash="x", role=UserRole.admin, club_id=club.id)
        staff = AppUser(full_name=f"{name} Desk", email=f"desk@{slug}.test", password_hash="x", role=UserRole.staff, club_id=club.id)
        db.add_all([admin, staff])
        await db.commit()
        for row in (club, admin, staff):
            await db.refresh(row)
        return club, admin, staff


def act_as(user: AppUser) -> None:
    """Every following request is made by this login."""
    def admin_only():
        if user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_admin_user] = admin_only


@pytest_asyncio.fixture
async def tenants(client, session_factory):
    """Two separate taekwondo clubs. Requests start as the first club's admin."""
    bole = await make_tenant(session_factory, "Bole Club", "1000")
    piassa = await make_tenant(session_factory, "Piassa Club", "800")
    act_as(bole[1])
    return bole, piassa


async def slots(client):
    return (await client.get(f"{API}/slots")).json()


async def enrol(client, phone="0911223344", kids=None, method="telebirr", months=1, **extra):
    current = await slots(client)
    kids = kids or [
        {"name": "Liya Abebe", "uniform_size": "60", "slot_id": current[0]["id"]},
        {"name": "Nahom Abebe", "age": 9, "uniform_size": "75", "slot_id": current[3]["id"]},
    ]
    return await client.post(
        f"{API}/enrolments",
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


# ----- Tenants ----------------------------------------------------------------------


async def test_new_club_gets_default_slots_and_sizes(client, tenants):
    assert [(s["start_time"], s["weekdays"]) for s in await slots(client)] == [
        ("09:00:00", [0, 1, 2, 3, 4, 5, 6]), ("10:00:00", [0, 1, 2, 3, 4, 5, 6]),
        ("11:00:00", [0, 1, 2, 3, 4, 5, 6]), ("14:00:00", [0, 1, 2, 3, 4, 5]),
    ]
    sizes = (await client.get(f"{API}/uniforms/sizes")).json()
    assert [s["label"] for s in sizes] == ["55", "60", "65", "70", "75", "80", "85", "90", "95", "100"]
    assert (await client.get(f"{API}/clubs/current")).json()["kind"] == "taekwondo"


async def test_two_clubs_never_see_each_other(client, tenants):
    (bole, bole_admin, _), (piassa, piassa_admin, piassa_desk) = tenants
    body = (await enrol(client)).json()
    kid_id = body["guardian"]["students"][0]["id"]
    guardian_id = body["guardian"]["id"]
    payment_id = body["payments"][0]["id"]

    act_as(piassa_desk)
    assert (await client.get(f"{API}/students")).json() == []
    assert (await client.get(f"{API}/guardians")).json() == []
    assert (await client.get(f"{API}/students/{kid_id}")).status_code == 404
    assert (await client.get(f"{API}/guardians/{guardian_id}")).status_code == 404
    assert (await client.patch(f"{API}/students/{kid_id}", json={"name": "Taken Over"})).status_code == 404
    assert (await client.delete(f"{API}/fees/{payment_id}")).status_code == 404
    # A header naming the other club changes nothing: the login decides the tenant.
    assert (await client.get(f"{API}/students", headers={"X-Club-Id": str(bole.id)})).json() == []
    assert (await client.get(f"{API}/clubs/current", headers={"X-Club-Id": str(bole.id)})).json()["name"] == "Piassa Club"
    # Paying for, or selling to, the other club's kid is refused.
    renew = await client.post(f"{API}/fees/renew", json={"items": [{"student_id": kid_id}], "payment": {"method": "cash"}})
    assert renew.status_code == 404
    sizes = (await client.get(f"{API}/uniforms/sizes")).json()
    await client.post(f"{API}/uniforms/stock-count", json={"size_id": sizes[0]["id"], "counted": 5})
    sale = await client.post(f"{API}/uniforms/sales", json={"size_id": sizes[0]["id"], "method": "cash", "student_id": kid_id})
    assert sale.status_code == 404
    # Registers and reports only ever list this club's kids.
    my_slot = (await slots(client))[0]["id"]
    assert (await client.get(f"{API}/attendance/register?day={date.today()}&slot_id={my_slot}")).json()["rows"] == []
    assert (await client.get(f"{API}/reports/attendance")).json()["students"] == []
    assert (await client.get(f"{API}/dashboard")).json()["counts"]["active"] == 0

    # Each club's staff list and activity log are its own.
    act_as(piassa_admin)
    assert {u["email"] for u in (await client.get("/api/v1/users/")).json()} == {"admin@piassaclub.test", "desk@piassaclub.test"}
    assert (await client.patch(f"/api/v1/users/{bole_admin.id}", json={"is_active": False})).status_code == 404
    assert (await client.get(f"/api/v1/users/{bole_admin.id}")).status_code == 404
    assert all(row["club_id"] == piassa.id for row in (await client.get("/api/v1/audit-logs/")).json())

    act_as(bole_admin)
    assert len((await client.get(f"{API}/students")).json()) == 2


async def test_new_logins_always_join_the_admins_own_club(client, tenants):
    (bole, _, _), (piassa, _, _) = tenants
    created = await client.post("/api/v1/users/", json={
        "full_name": "New Coach", "email": "coach@example.com", "password": "CoachDesk2026", "role": "staff", "club_id": piassa.id,
    })
    assert created.status_code == 201
    assert created.json()["club_id"] == bole.id


async def test_taekwondo_and_gym_apps_are_closed_to_each_other(client, tenants, admin_user):
    # A taekwondo login cannot use the gym app...
    for path in ("/api/v1/members/", "/api/v1/plans/", "/api/v1/dashboard/stats", "/api/v1/payments/", "/api/v1/schedule/templates"):
        assert (await client.get(path)).status_code == 404, path
    # ...and a gym login cannot use the taekwondo app.
    act_as(admin_user)
    for path in (f"{API}/students", f"{API}/slots", f"{API}/dashboard", f"{API}/uniforms/sizes", f"{API}/clubs/current"):
        assert (await client.get(path)).status_code == 404, path


async def test_staff_cannot_change_club_settings(client, tenants):
    (_, _, bole_desk), _ = tenants
    act_as(bole_desk)
    assert (await client.patch(f"{API}/clubs/current", json={"monthly_fee": "1"})).status_code == 403


# ----- Enrolment and fees ---------------------------------------------------------------


async def test_one_parent_enrols_several_kids_with_one_payment(client, tenants):
    response = await enrol(client)
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


async def test_same_phone_is_offered_the_existing_family(client, tenants):
    await enrol(client)
    again = await enrol(client, phone="+251 911 223 344")
    assert again.status_code == 409
    assert again.json()["detail"]["code"] == "parent_exists"
    # The same parent may also register at another club, which never sees this one.
    act_as(tenants[1][2])
    assert (await enrol(client)).status_code == 201
    act_as(tenants[0][1])

    # Adding a third kid to the existing family.
    family = again.json()["detail"]["guardian_id"]
    current = await slots(client)
    added = await client.post(f"{API}/enrolments", json={
        "guardian_id": family, "students": [{"name": "Saba Abebe", "slot_id": current[1]["id"], "amount": "700"}],
        "payment": {"method": "cash"},
    })
    assert added.status_code == 201
    assert len(added.json()["guardian"]["students"]) == 3
    assert added.json()["payments"][0]["amount"] == "700.00"


async def test_renewing_extends_expiry_and_can_be_undone(client, tenants):
    body = (await enrol(client)).json()
    kid = body["guardian"]["students"][0]
    renewed = await client.post(f"{API}/fees/renew", json={
        "items": [{"student_id": kid["id"]}], "payment": {"method": "cbe", "months": 2, "reference": "FT26"},
    })
    assert renewed.status_code == 201
    payment = renewed.json()[0]
    assert date.fromisoformat(payment["period_start"]) == date.fromisoformat(kid["expiry_date"]) + timedelta(days=1)
    assert payment["amount"] == "2000.00"
    after = (await client.get(f"{API}/students/{kid['id']}")).json()
    assert after["student"]["expiry_date"] == payment["period_end"]

    assert (await client.delete(f"{API}/fees/{payment['id']}")).status_code == 204
    restored = (await client.get(f"{API}/students/{kid['id']}")).json()
    assert restored["student"]["expiry_date"] == kid["expiry_date"]


async def test_expiry_colours_follow_branch_settings(client, tenants):
    kid = (await enrol(client)).json()["guardian"]["students"][0]
    today = date.fromisoformat((await client.get(f"{API}/dashboard")).json()["today"])
    for days, expected in ((10, "active"), (5, "expiring"), (1, "critical"), (-1, "expired")):
        await client.patch(f"{API}/students/{kid['id']}", json={"expiry_date": (today + timedelta(days=days)).isoformat()})
        listed = (await client.get(f"{API}/students")).json()
        assert next(s for s in listed if s["id"] == kid["id"])["status"] == expected


# ----- Uniforms -------------------------------------------------------------------------


async def test_uniform_order_receive_sell_and_count(client, tenants):
    sizes = {s["label"]: s["id"] for s in (await client.get(f"{API}/uniforms/sizes")).json()}
    await client.patch(f"{API}/clubs/current", json={"uniform_price": "1200"})

    order = (await client.post(f"{API}/uniforms/orders", json={
        "supplier": "Merkato", "lines": [{"size_id": sizes["60"], "quantity": 5}, {"size_id": sizes["75"], "quantity": 2}],
    })).json()
    stock = {s["label"]: s for s in (await client.get(f"{API}/uniforms/sizes")).json()}
    assert stock["60"]["pending"] == 5 and stock["60"]["in_stock"] == 0

    # Nothing to sell before the order arrives.
    blocked = await client.post(f"{API}/uniforms/sales", json={"size_id": sizes["60"], "method": "cash", "buyer_name": "Walk In"})
    assert blocked.status_code == 409

    assert (await client.post(f"{API}/uniforms/orders/{order['id']}/receive", json={})).json()["status"] == "received"
    sale = await client.post(f"{API}/uniforms/sales", json={
        "size_id": sizes["60"], "quantity": 2, "method": "boa", "buyer_name": "Walk In Buyer", "buyer_phone": "0922000000",
    })
    assert sale.status_code == 201
    assert sale.json()["total"] == "2400.00"

    counted = await client.post(f"{API}/uniforms/stock-count", json={"size_id": sizes["55"], "counted": 4})
    assert counted.json()["in_stock"] == 4

    stock = {s["label"]: s for s in (await client.get(f"{API}/uniforms/sizes")).json()}
    assert (stock["60"]["pending"], stock["60"]["received"], stock["60"]["sold"], stock["60"]["in_stock"]) == (0, 5, 2, 3)
    assert stock["60"]["low"] is True  # 3 left = at the low-stock threshold
    assert stock["55"]["in_stock"] == 4

    # Enrolment with "buy uniform" takes from the same stock.
    current = await slots(client)
    enrolled = await enrol(client, phone="0933000000", kids=[{"name": "Hana Tesfaye", "uniform_size": "60", "slot_id": current[0]["id"], "buy_uniform": True}])
    assert enrolled.status_code == 201, enrolled.text
    assert enrolled.json()["uniform_sales"][0]["total"] == "1200.00"
    assert enrolled.json()["total"] == "2200.00"
    stock = {s["label"]: s for s in (await client.get(f"{API}/uniforms/sizes")).json()}
    assert stock["60"]["sold"] == 3 and stock["60"]["in_stock"] == 2

    # Out of stock for size 100: enrolment is refused rather than overselling.
    refused = await enrol(client, phone="0944000000", kids=[{"name": "Dawit Alemu", "uniform_size": "100", "slot_id": current[0]["id"], "buy_uniform": True}])
    assert refused.status_code == 409


# ----- Attendance -----------------------------------------------------------------------


async def test_register_marks_present_and_absent_and_feeds_the_report(client, tenants):
    current = await slots(client)
    first = current[0]["id"]
    kids = [{"name": n, "slot_id": first} for n in ("Abel Girma", "Bethel Girma", "Kalkidan Girma")]
    body = (await enrol(client, kids=kids, start_date=(date.today() - timedelta(days=30)).isoformat())).json()
    ids = [s["id"] for s in body["guardian"]["students"]]
    day = (date.today() - timedelta(days=7)).isoformat()

    register = (await client.get(f"{API}/attendance/register?day={day}&slot_id={first}")).json()
    assert len(register["rows"]) == 3 and not register["saved"]

    saved = await client.put(f"{API}/attendance/register", json={"date": day, "slot_id": first, "present_ids": ids[:2]})
    assert saved.status_code == 200
    statuses = {r["student_id"]: r["status"] for r in saved.json()["rows"]}
    assert statuses == {ids[0]: "present", ids[1]: "present", ids[2]: "absent"}

    # Saving again corrects the register instead of duplicating it.
    await client.put(f"{API}/attendance/register", json={"date": day, "slot_id": first, "present_ids": ids})
    report = (await client.get(f"{API}/reports/attendance")).json()
    assert (report["present"], report["absent"], report["rate"]) == (3, 0, 1.0)

    future = (date.today() + timedelta(days=3)).isoformat()
    assert (await client.put(f"{API}/attendance/register", json={"date": future, "slot_id": first, "present_ids": []})).status_code == 422


async def test_dashboard_and_money_report(client, tenants):
    await enrol(client)
    dash = (await client.get(f"{API}/dashboard")).json()
    assert dash["counts"]["active"] == 2
    assert dash["money_month"]["fees"] == "2000.00"
    assert dash["money_month"]["by_method"]["telebirr"]["fees"] == "2000.00"
    assert "uniform_price" in dash["setup_needed"]
    assert {s["label"] for s in dash["low_stock"]} >= {"55", "100"}
