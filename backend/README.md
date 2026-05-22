# Gym Membership Backend

## Run locally

```bash
uv run uvicorn main:app --reload
```

## Health endpoints

- `GET /health/live`
- `GET /health/ready`

## Docker

```bash
cp .env.example .env
docker compose up --build
```
