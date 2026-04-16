from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.feedback import router as feedback_router
from app.routers.issues import router as issues_router
from app.routers.notes import router as notes_router
from app.routers.reports import router as reports_router
from app.routers.tasks import router as tasks_router
from app.routers.users import router as users_router

__all__ = [
    "auth_router",
    "dashboard_router",
    "feedback_router",
    "issues_router",
    "notes_router",
    "reports_router",
    "tasks_router",
    "users_router",
]
