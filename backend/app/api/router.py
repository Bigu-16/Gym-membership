from fastapi import APIRouter

from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.check_ins import router as check_ins_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.enrollments import router as enrollments_router
from app.api.routes.health import router as health_router
from app.api.routes.members import router as members_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.schedule import router as schedule_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(dashboard_router)
api_router.include_router(members_router)
api_router.include_router(notifications_router)
api_router.include_router(schedule_router)
api_router.include_router(enrollments_router)
api_router.include_router(check_ins_router)
api_router.include_router(analytics_router)
api_router.include_router(tasks_router)
