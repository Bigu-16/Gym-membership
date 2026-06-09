# Gym Management Backend

## Run locally

```bash
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

## API prefix

All endpoints are served under `/api/v1`.

## Initial endpoints

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/bootstrap-admin`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/users/`
- `POST /api/v1/users/`
- `GET /api/v1/users/{id}`
- `PATCH /api/v1/users/{id}`
- `PATCH /api/v1/users/{id}/password`
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/active-members`
- `GET /api/v1/members/`
- `POST /api/v1/members/`
- `POST /api/v1/members/families`
- `PATCH /api/v1/members/{id}/freeze`
- `GET /api/v1/schedule/templates`
- `POST /api/v1/schedule/templates`
- `GET /api/v1/schedule/sessions`
- `POST /api/v1/schedule/sessions`
- `PATCH /api/v1/schedule/sessions/{id}/status`
- `GET /api/v1/enrollments/`
- `POST /api/v1/enrollments/`
- `GET /api/v1/check-ins/`
- `POST /api/v1/check-ins/`
- `PATCH /api/v1/check-ins/{id}/check-out`
- `GET /api/v1/notifications/jobs`
- `GET /api/v1/analytics/growth`
- `GET /api/v1/analytics/attendance`
- `POST /api/v1/tasks/membership-expiry-reminders`
- `POST /api/v1/tasks/process-notification-jobs`
- `POST /api/v1/tasks/seed-demo-data`

## Demo data and smoke tests

Start the backend stack first:

```bash
docker compose up --build
```

In a second terminal, seed realistic dashboard data:

```bash
docker compose exec api uv run python scripts/seed_demo_data.py
```

The seed creates:

- admin login: `admin@example.com` / `ChangeMe123!`
- staff login: `staff@example.com` / `ChangeMe123!`
- membership plans, individual members, family members, class templates, sessions, enrollments, check-ins, and notification jobs

Then run API smoke tests from the host:

```bash
python scripts/smoke_test_api.py
```

If the API is not on `localhost:8000`, override the base URL:

```bash
API_BASE_URL=http://localhost:8000 python scripts/smoke_test_api.py
```

The smoke test exercises auth, users, members, families, schedule, enrollments, check-ins, dashboard, analytics, notifications, and task enqueue endpoints.

## Backend dashboard

The backend serves a standalone HTML/CSS/JS console at:

```text
http://localhost:8000/admin
```

Use it to log in, inspect dashboard stats, create members and families, create classes and sessions, check members in/out, enroll members, manage users, inspect notification jobs, queue background tasks, and send raw API requests. This page is served by FastAPI from `app/static`; it does not use or modify the React frontend.

## Neon/Render database

Local Docker Compose uses the `POSTGRES_*` variables and connects to the compose service host `db`.

For Render + Neon, set a single environment variable instead:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

The app converts that to the async SQLAlchemy driver URL internally. The Docker image runs `alembic upgrade head` before starting Uvicorn, so a fresh Neon database gets the schema on deploy.

After the first deploy, create an admin with `/api/v1/auth/bootstrap-admin`, log in, then seed demo data:

```bash
curl -X POST https://YOUR-RENDER-APP.onrender.com/api/v1/tasks/seed-demo-data \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

You can also do this from `https://YOUR-RENDER-APP.onrender.com/admin` with the “Seed demo data” button after logging in.

## Auth

Create the first admin once:

```bash
curl -X POST http://localhost:8000/api/v1/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Admin User","email":"admin@example.com","password":"ChangeMe123!"}'
```

Then log in with form data and use the bearer token on protected endpoints.

Admin users can then create and manage staff/admin accounts through `/api/v1/users/*`.

## Background Jobs

The backend now queues internal notification jobs for:

- welcome messages on member creation
- membership expiry reminders

These are stored in `notification_jobs` and processed by Celery worker/beat services. External providers are not wired yet.

## Docker

```bash
docker compose up --build
```
