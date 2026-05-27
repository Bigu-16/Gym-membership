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
- `GET /api/v1/analytics/growth`
- `GET /api/v1/analytics/attendance`
- `POST /api/v1/tasks/membership-expiry-reminders`

## Auth

Create the first admin once:

```bash
curl -X POST http://localhost:8000/api/v1/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Admin User","email":"admin@example.com","password":"ChangeMe123!"}'
```

Then log in with form data and use the bearer token on protected endpoints.

## Docker

```bash
docker compose up --build
```
