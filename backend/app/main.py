from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.api.router import api_router
from app.core.config import settings

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": settings.app_name, "docs": "/docs", "api": settings.api_v1_prefix, "admin": "/admin"}


@app.get("/admin", include_in_schema=False)
async def admin_dashboard() -> FileResponse:
    return FileResponse(STATIC_DIR / "admin-dashboard.html")
