from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.include_router(health_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": settings.app_name}
