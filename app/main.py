from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
from app.database import Base, engine
from app.models import user, weekly_plan, task, daily_action, journal
from app.routers import auth, weekly_plan as weekly_plan_router, task
from app.routers import journal as journal_router, daily_action as daily_action_router
from app.routers import deps, ai_coach, notifications, export
from app.services.scheduler import start_scheduler, scheduler
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs on startup
    start_scheduler()
    yield
    # Runs on shutdown
    scheduler.shutdown()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BeProductive API",
    version="1.0.0",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://beproductive-pied.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(deps.router)
app.include_router(weekly_plan_router.router)
app.include_router(task.router)
app.include_router(journal_router.router)
app.include_router(daily_action_router.router)
app.include_router(ai_coach.router)
app.include_router(notifications.router)
app.include_router(export.router)


@app.get("/")
def root():
    return {"message": "Welcome to BeProductive API"}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title="BeProductive API",
                         version="1.0.0", routes=app.routes)
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
