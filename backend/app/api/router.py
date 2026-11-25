from fastapi import APIRouter

from app.api.routes.analytics import router as analytics_router
from app.api.routes.audit import router as audit_router
from app.api.routes.auth import router as auth_router
from app.api.routes.client_errors import router as client_errors_router
from app.api.routes.business import router as business_router
from app.api.routes.check_ins import router as check_ins_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.enrollments import router as enrollments_router
from app.api.routes.health import router as health_router
from app.api.routes.members import router as members_router
from app.api.routes.membership_plans import router as membership_plans_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.payments import router as payments_router
from app.api.routes.schedule import router as schedule_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(audit_router)
api_router.include_router(client_errors_router)
api_router.include_router(business_router)
api_router.include_router(users_router)
api_router.include_router(dashboard_router)
api_router.include_router(members_router)
api_router.include_router(membership_plans_router)
api_router.include_router(notifications_router)
api_router.include_router(payments_router)
api_router.include_router(schedule_router)
api_router.include_router(enrollments_router)
api_router.include_router(check_ins_router)
api_router.include_router(analytics_router)
api_router.include_router(tasks_router)

# The taekwondo club app lives under /tkd so its paths never collide with the gym app's.
from app.api.routes.tkd.attendance import router as tkd_attendance_router  # noqa: E402
from app.api.routes.tkd.clubs import router as tkd_clubs_router  # noqa: E402
from app.api.routes.tkd.dashboard import router as tkd_dashboard_router  # noqa: E402
from app.api.routes.tkd.students import router as tkd_students_router  # noqa: E402
from app.api.routes.tkd.uniforms import router as tkd_uniforms_router  # noqa: E402

tkd_router = APIRouter(prefix="/tkd")
for _router in (tkd_clubs_router, tkd_dashboard_router, tkd_students_router, tkd_uniforms_router, tkd_attendance_router):
    tkd_router.include_router(_router)
api_router.include_router(tkd_router)
