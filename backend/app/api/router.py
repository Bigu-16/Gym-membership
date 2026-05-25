from fastapi import APIRouter

from app.api.routes.analytics import router as analytics_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.members import router as members_router
from app.api.routes.schedule import router as schedule_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(members_router)
api_router.include_router(schedule_router)
api_router.include_router(analytics_router)
