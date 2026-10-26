import logging
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings

STATIC_DIR = Path(__file__).resolve().parent / "static"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("app.requests")

# Refuse to run a production deployment with unsafe settings (e.g. the placeholder
# signing key, which would let anyone forge an admin login).
if settings.is_production and settings.production_problems():
    raise RuntimeError("Unsafe production settings: " + "; ".join(settings.production_problems()))

if settings.sentry_dsn:
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        send_default_pii=False,  # members are children; never ship personal data to a third party
        traces_sample_rate=0.0,
    )

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    # The interactive API docs list every endpoint; keep them out of production.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Local development servers may land on any port (Vite moves to 5174 when 5173 is busy).
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?" if settings.allows_development_endpoints else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}


@app.middleware("http")
async def request_context(request: Request, call_next):
    """Request id, access log (no bodies or query strings — they can contain personal data) and security headers."""
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled error request_id=%s %s %s", request_id, request.method, request.url.path)
        response = JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong on the server.", "request_id": request_id},
        )
    duration_ms = (time.perf_counter() - started) * 1000
    logger.info("%s %s -> %s %.0fms request_id=%s", request.method, request.url.path, response.status_code, duration_ms, request_id)
    response.headers["X-Request-ID"] = request_id
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    if settings.is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


app.include_router(api_router, prefix=settings.api_v1_prefix)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": settings.app_name, "docs": "/docs", "api": settings.api_v1_prefix, "admin": "/admin"}


@app.get("/admin", include_in_schema=False)
async def admin_dashboard() -> FileResponse:
    return FileResponse(STATIC_DIR / "admin-dashboard.html")
