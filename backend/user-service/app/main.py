from fastapi import FastAPI
from app.controller.user_controller import router as user_router

app = FastAPI(
    title="Workout Partner User Service",
    description="User profile management with fitness data",
    version="1.0.0"
)

app.include_router(user_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "user-service"}


@app.get("/")
def root():
    return {"service": "user-service", "version": "1.0.0"}
