# Gym portal (two separate gyms)

One website and one server for two gyms that are completely separate tenants:

| Tenant | App | What it has |
|---|---|---|
| **N & T Center** (`kind = gym`) | The original gym app (`src/GymApp.jsx`, `src/components/…`) | Members, families, packages, schedule, check-ins, freezes, messages and reminders |
| **Taekwondo club** (`kind = taekwondo`) | The taekwondo app (`src/tkd/…`) | Parents with several kids, Telebirr/CBE/Abyssinia/cash fees, uniform stock, weekend/summer seasons, attendance reports, English/Amharic |

## How the separation works

- Every account belongs to exactly one tenant (`app_users.club_id`). There is no owner account and no switching.
- After sign-in the server says which tenant the account belongs to (`GET /auth/me` → `club_kind`), and only that tenant's app is loaded.
- Every gym table has a `club_id`. The server limits every query to the signed-in account's tenant automatically, stamps new rows with it, and refuses any row that points at another tenant's record (`backend/app/core/tenancy.py`). A request without a tenant sees nothing.
- The gym app's API is at `/api/v1/…` (as before) and the taekwondo app's at `/api/v1/tkd/…`. Each tenant gets "Not found" for the other app's API.
- Staff lists, activity logs, reminders and settings are per tenant.

## Creating a tenant

Tenants and their first admin are created on the server (never from the app):

```bash
cd backend && uv run python -m scripts.create_tenant --kind taekwondo --name "Taekwondo Club" --name-am "ቴኳንዶ ክለብ" --admin-name "Full Name" --admin-email admin@example.com
```

The password is asked for twice. `--list` shows the existing tenants. The admin then adds staff in the app.

## Deploying

`alembic upgrade head` runs two migrations:

- `20261120_0009` adds the taekwondo tables.
- `20261123_0010` makes the existing gym the tenant **N & T Center**, stamps all of its existing data and every existing login with it, and makes the tenant required. Nothing is deleted.

Then create the taekwondo tenant with the command above.

## Run it locally

This uses a throwaway SQLite file, never the database in `backend/.env`.

```bash
cd backend && DATABASE_URL=sqlite+aiosqlite:///./dev.db uv run python -m scripts.dev_seed
```

```bash
cd backend && DATABASE_URL=sqlite+aiosqlite:///./dev.db APP_ENV=development uv run uvicorn main:app --port 8010
```

```bash
VITE_API_URL=http://127.0.0.1:8010/api/v1 npm run dev
```

The demo creates both tenants. Their demo logins are listed in `backend/scripts/dev_seed.py`.

## Tests

```bash
npm run lint && npm test
```

```bash
cd backend && uv run pytest
```
