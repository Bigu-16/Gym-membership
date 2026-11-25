"""Create a new gym (tenant) and its first admin login.

Tenants never see each other, so there is deliberately no page in the app for this:
it is run once on the server by whoever deploys the system.

    uv run python -m scripts.create_tenant --kind taekwondo --name "Taekwondo Club" \\
        --name-am "ቴኳንዶ ክለብ" --admin-name "Abebe Kebede" --admin-email admin@example.com

The password is asked for twice (not echoed). For automation, set TENANT_ADMIN_PASSWORD instead.
List existing tenants with --list.
"""

import argparse
import asyncio
import getpass
import os
import sys

from sqlalchemy import func, select

from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.core.tenancy import bind_tenant
from app.models import AppUser, Club
from app.models.enums import ClubKind, UserRole
from app.schemas.auth import validate_password_strength
from app.services.clubs import new_club, seed_club_defaults


def ask_password() -> str:
    password = os.environ.get("TENANT_ADMIN_PASSWORD")
    if password is None:
        password = getpass.getpass("Password for the first admin: ")
        if getpass.getpass("Type it again: ") != password:
            sys.exit("The two passwords are different.")
    try:
        return validate_password_strength(password)
    except ValueError as exc:
        sys.exit(f"Password not accepted: {exc}")


async def list_tenants() -> None:
    async with SessionLocal() as db:
        rows = (await db.execute(
            select(Club.id, Club.name, Club.kind, Club.is_active, func.count(AppUser.id))
            .outerjoin(AppUser, AppUser.club_id == Club.id)
            .group_by(Club.id)
            .order_by(Club.id)
        )).all()
    for club_id, name, kind, active, users in rows:
        print(f"{club_id:>4}  {kind.value:<10} {'active' if active else 'off':<7} {users:>3} logins  {name}")
    await engine.dispose()


async def create(args: argparse.Namespace) -> None:
    password = ask_password()
    async with SessionLocal() as db:
        if await db.scalar(select(Club.id).where(func.lower(Club.name) == args.name.strip().lower())):
            sys.exit(f"A tenant called {args.name!r} already exists.")
        if await db.scalar(select(AppUser.id).where(AppUser.email == args.admin_email.strip().lower())):
            sys.exit(f"The email {args.admin_email!r} is already used by another login.")

        kind = ClubKind(args.kind)
        if kind == ClubKind.taekwondo:
            club = new_club(args.name.strip(), args.name_am, kind=kind)
        else:
            club = Club(name=args.name.strip(), name_am=args.name_am, kind=kind,
                        timezone=args.timezone or "Asia/Dubai", currency=args.currency or "AED")
        if args.timezone:
            club.timezone = args.timezone
        if args.currency:
            club.currency = args.currency.upper()
        db.add(club)
        await db.flush()
        bind_tenant(db, club.id)
        if kind == ClubKind.taekwondo:
            seed_club_defaults(db, club)  # 4 class times and sizes 55-100, editable in the app
        db.add(AppUser(
            full_name=args.admin_name.strip(),
            email=args.admin_email.strip().lower(),
            password_hash=hash_password(password),
            role=UserRole.admin,
            is_active=True,
            club_id=club.id,
        ))
        await db.commit()
        print(f"Created tenant #{club.id} {club.name!r} ({kind.value}) with admin {args.admin_email.strip().lower()}.")
    await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="show existing tenants and exit")
    parser.add_argument("--kind", choices=[k.value for k in ClubKind])
    parser.add_argument("--name")
    parser.add_argument("--name-am", default=None, help="Amharic name (taekwondo app)")
    parser.add_argument("--admin-name")
    parser.add_argument("--admin-email")
    parser.add_argument("--timezone", default=None, help="e.g. Africa/Addis_Ababa or Asia/Dubai")
    parser.add_argument("--currency", default=None, help="e.g. ETB or AED")
    args = parser.parse_args()
    if args.list:
        asyncio.run(list_tenants())
        return
    missing = [flag for flag in ("kind", "name", "admin_name", "admin_email") if not getattr(args, flag)]
    if missing:
        parser.error("missing: " + ", ".join("--" + m.replace("_", "-") for m in missing))
    asyncio.run(create(args))


if __name__ == "__main__":
    main()
