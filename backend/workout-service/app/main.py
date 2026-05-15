from fastapi import FastAPI
from app.controller.workout_controller import router as workout_router

app = FastAPI(
    title="Workout Partner - Workout Service",
    description="Workout session logging and calorie estimation",
    version="1.0.0"
)

app.include_router(workout_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "workout-service"}


@app.get("/")
def root():
    return {"service": "workout-service", "version": "1.0.0"}
