from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ExerciseCreate(BaseModel):
    exercise_name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_sec: Optional[int] = None
    distance_km: Optional[float] = None


class ExerciseResponse(ExerciseCreate):
    id: str
    session_id: str
    calories: Optional[float] = None
    met_value: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    title: str
    workout_type: str
    started_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    is_public: bool = True
    notes: Optional[str] = None
    exercises: Optional[List[ExerciseCreate]] = []


class SessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    workout_type: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_calories: Optional[float] = None
    is_public: bool
    notes: Optional[str] = None
    exercises: List[ExerciseResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalorieEstimateRequest(BaseModel):
    workout_type: str
    duration_minutes: int
    weight_kg: Optional[float] = None


class CalorieEstimateResponse(BaseModel):
    calories_estimate: float
    met_value: float
    workout_type: str
    duration_minutes: int
    weight_kg_used: float


class StatsResponse(BaseModel):
    total_sessions: int
    total_calories: float
    total_duration_minutes: int
    avg_calories_per_session: float
    most_common_workout_type: Optional[str] = None
