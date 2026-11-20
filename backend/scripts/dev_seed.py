"""Create a local SQLite database with demo data for trying the app.

Never point this at a real database: it refuses anything that is not SQLite.

    DATABASE_URL=sqlite+aiosqlite:///./dev.db uv run python -m scripts.dev_seed

Demo sign-in (local only): owner@demo.local / DemoOwner2026
                           staff@demo.local / DemoStaff2026
"""

import asyncio
import os
import random
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

DB_URL = os.environ.get("DATABASE_URL", "")
if not DB_URL.startswith("sqlite"):
    raise SystemExit("dev_seed only runs against a local SQLite DATABASE_URL")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import (  # noqa: E402
    AppUser, Attendance, ClassSlot, Club, FeePayment, Guardian, Student, UniformOrder, UniformOrderLine, UniformSale, UniformSize,
)
from app.models.enums import AttendanceStatus, FeeMethod, UniformOrderStatus, UserRole  # noqa: E402
from app.services.clubs import new_club, seed_club_defaults  # noqa: E402
from app.services.fees import new_receipt_no  # noqa: E402
from app.services.season import club_today, slot_runs_on  # noqa: E402
from app.core.timeutils import add_months  # noqa: E402

FAMILIES = [
    ("Abebe Kebede", "0911223344", ["Liya Abebe", "Nahom Abebe"]),
    ("Tigist Haile", "0922334455", ["Selam Tesfaye"]),
    ("Dawit Mekonnen", "0933445566", ["Yonas Dawit", "Ruth Dawit", "Eden Dawit"]),
    ("Meron Alemu", "0944556677", ["Kidus Alemu"]),
    ("Samuel Girma", "0955667788", ["Bethel Samuel", "Abel Samuel"]),
    ("Hirut Tadesse", "0966778899", ["Mahlet Tadesse"]),
    ("Yared Bekele", "0977889900", ["Natnael Yared"]),
    ("Almaz Worku", "0711223344", ["Hana Worku", "Biruk Worku"]),
]
SIZES = ["55", "60", "65", "70", "75", "80", "85"]


async def main() -> None:
    random.seed(7)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        club = new_club("Bole", "ቦሌ", Decimal("1200"))
        club.uniform_price = Decimal("1500")
        other = new_club("Piassa", "ፒያሳ", Decimal("1000"))
        db.add_all([club, other])
        await db.flush()
        seed_club_defaults(db, club)
        seed_club_defaults(db, other)
        db.add_all([
            AppUser(full_name="Demo Owner", email="owner@demo.local", password_hash=hash_password("DemoOwner2026"), role=UserRole.admin),
            AppUser(full_name="Bole Desk", email="staff@demo.local", password_hash=hash_password("DemoStaff2026"), role=UserRole.staff, club_id=club.id),
        ])
        await db.flush()

        slots = (await db.scalars(select(ClassSlot).where(ClassSlot.club_id == club.id).order_by(ClassSlot.start_time))).all()
        sizes = {s.label: s for s in (await db.scalars(select(UniformSize).where(UniformSize.club_id == club.id))).all()}
        today = club_today(club)

        # Uniform stock: one delivered order, one still on the way.
        received = UniformOrder(club_id=club.id, supplier="Merkato Sport", ordered_on=today - timedelta(days=60),
                                status=UniformOrderStatus.received, received_on=today - timedelta(days=50),
                                lines=[UniformOrderLine(size_id=sizes[s].id, quantity=q) for s, q in zip(SIZES, [6, 8, 8, 6, 5, 4, 3])])
        pending = UniformOrder(club_id=club.id, supplier="Merkato Sport", ordered_on=today - timedelta(days=5),
                               status=UniformOrderStatus.ordered,
                               lines=[UniformOrderLine(size_id=sizes["60"].id, quantity=10), UniformOrderLine(size_id=sizes["65"].id, quantity=10)])
        db.add_all([received, pending])

        # Families with a spread of expiry dates so every colour shows up.
        offsets = [25, 12, 6, 4, 2, 1, 0, -3, -12, 18, 9, 30, 15, 3]
        methods = list(FeeMethod)
        kid_index = 0
        all_kids: list[Student] = []
        for parent, phone, kids in FAMILIES:
            guardian = Guardian(club_id=club.id, name=parent, phone="+251" + phone[1:])
            db.add(guardian)
            await db.flush()
            receipt = new_receipt_no(today)
            for name in kids:
                expiry = today + timedelta(days=offsets[kid_index % len(offsets)])
                start = add_months(expiry + timedelta(days=1), -1)
                size = random.choice(SIZES)
                kid = Student(club_id=club.id, guardian_id=guardian.id, slot_id=slots[kid_index % len(slots)].id, name=name,
                              age=random.randint(5, 14), uniform_size=size, joined_on=today - timedelta(days=70),
                              expiry_date=expiry, is_active=True)
                db.add(kid)
                await db.flush()
                all_kids.append(kid)
                method = methods[kid_index % len(methods)]
                db.add(FeePayment(club_id=club.id, student_id=kid.id, guardian_id=guardian.id, receipt_no=receipt, amount=Decimal("1200"),
                                  method=method, reference=None if method == FeeMethod.cash else f"TX{kid.id:05d}",
                                  months=1, paid_on=start, period_start=start, period_end=expiry))
                if kid_index % 3 == 0:
                    db.add(UniformSale(club_id=club.id, size_id=sizes[size].id, quantity=1, unit_price=Decimal("1500"), method=method,
                                       sold_on=start, student_id=kid.id, guardian_id=guardian.id, receipt_no=receipt))
                kid_index += 1
        # One kid enrolled but never paid, and a walk-in uniform buyer.
        g = Guardian(club_id=club.id, name="Kebede Tola", phone="+251988776655")
        db.add(g)
        await db.flush()
        db.add(Student(club_id=club.id, guardian_id=g.id, slot_id=slots[0].id, name="Feven Kebede", age=7, uniform_size="60", joined_on=today, is_active=True))
        db.add(UniformSale(club_id=club.id, size_id=sizes["70"].id, quantity=1, unit_price=Decimal("1500"), method=FeeMethod.telebirr,
                           sold_on=today - timedelta(days=3), buyer_name="Walk-in parent", buyer_phone="+251900112233"))

        # Six weeks of attendance with a few habitual absentees.
        absentees = {all_kids[3].id, all_kids[8].id}
        day = today - timedelta(days=42)
        while day < today:
            for slot in slots:
                if not slot_runs_on(club, slot, day):
                    continue
                for kid in all_kids:
                    if kid.slot_id != slot.id:
                        continue
                    chance = 0.25 if kid.id in absentees else 0.85
                    status = AttendanceStatus.present if random.random() < chance else AttendanceStatus.absent
                    db.add(Attendance(club_id=club.id, student_id=kid.id, slot_id=slot.id, class_date=day, status=status))
            day += timedelta(days=1)
        await db.commit()
    await engine.dispose()
    print("Demo database ready.")


if __name__ == "__main__":
    asyncio.run(main())
