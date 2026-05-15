from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.user_routes import router as user_router
from app.routes.workout_routes import router as workout_router
from app.routes.matching_routes import router as matching_router
from app.routes.chat_routes import router as chat_router
from app.routes.gym_routes import router as gym_router

app = FastAPI(
    title="Workout Partner API Gateway",
    description="Central API Gateway for Workout Partner platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix="/api/v1")
app.include_router(workout_router, prefix="/api/v1")
app.include_router(matching_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(gym_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api-gateway"}


@app.get("/")
def root():
    return {
        "service": "api-gateway",
        "version": "1.0.0",
        "endpoints": {
            "users": "/api/v1/users",
            "workouts": "/api/v1/workouts",
            "matching": "/api/v1/matching",
            "chat": "/api/v1/chat",
            "gyms": "/api/v1/gyms"
        },
        "docs": "/docs"
    }
