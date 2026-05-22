from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
from app.database import Base, engine
from app.routers import (
    auth,
    weekly_plan as weekly_plan_router,
    task,
    journal as journal_router,
    daily_action as daily_action_router,
    deps,
    ai_coach,
    notifications,
    export
)
from app.services.scheduler import start_scheduler, scheduler
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs on startup
    print("Starting BeProductive API...")
    start_scheduler()
    yield
    # Runs on shutdown
    print("Shutting down BeProductive API...")
    scheduler.shutdown()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BeProductive API",
    version="1.0.0",
    description="AI-Powered Productivity Coach",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://beproductive-pied.vercel.app",
        "http://localhost:3000",  # Common React port
        "http://localhost:5000",  # Common development port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
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
    return {
        "message": "Welcome to BeProductive API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "scheduler_running": scheduler.running if hasattr(scheduler, 'running') else False
    }


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title="BeProductive API",
        version="1.0.0",
        description="AI-Powered Productivity Coach API",
        routes=app.routes
    )

    # Add security scheme
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # Apply security to all endpoints
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
