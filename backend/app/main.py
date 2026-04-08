from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.feedback import router as feedback_router
from app.routers.issues import router as issues_router
from app.routers.notes import router as notes_router
from app.routers.reports import router as reports_router
from app.routers.tasks import router as tasks_router

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(issues_router)
app.include_router(feedback_router)
app.include_router(notes_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
