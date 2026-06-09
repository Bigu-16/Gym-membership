"""Seed realistic demo data for local dashboard/API testing.

Run inside the API container:
    uv run python scripts/seed_demo_data.py

Run from the host when Postgres is exposed on localhost:
    POSTGRES_HOST=localhost uv run python scripts/seed_demo_data.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.services.demo_data import ADMIN_EMAIL, ADMIN_PASSWORD, STAFF_EMAIL, STAFF_PASSWORD, seed_demo_data


async def main() -> None:
    async with SessionLocal() as session:
        counts = await seed_demo_data(session)

    print("Demo data seeded.")
    print(f"Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print(f"Staff login: {STAFF_EMAIL} / {STAFF_PASSWORD}")
    print(f"Counts: {counts}")


if __name__ == "__main__":
    asyncio.run(main())
