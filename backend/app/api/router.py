from fastapi import APIRouter

from app.api.routes.attendance import router as attendance_router
from app.api.routes.audit import router as audit_router
from app.api.routes.auth import router as auth_router
from app.api.routes.client_errors import router as client_errors_router
from app.api.routes.clubs import router as clubs_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.students import router as students_router
from app.api.routes.uniforms import router as uniforms_router
from app.api.routes.users import router as users_router

api_router = APIRouter()
for router in (
    health_router,
    auth_router,
    audit_router,
    client_errors_router,
    users_router,
    clubs_router,
    dashboard_router,
    students_router,
    uniforms_router,
    attendance_router,
):
    api_router.include_router(router)
