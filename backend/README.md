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
- `GET /api/v1/analytics/growth`
- `GET /api/v1/analytics/attendance`

## Docker

```bash
docker compose up --build
```
