from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.service.workout_service import WorkoutService
from app.service.calorie_service import estimate_session_calories, get_met, DEFAULT_WEIGHT_KG
from app.schemas.workout_schema import (
    SessionCreate, SessionResponse, ExerciseCreate, ExerciseResponse,
    CalorieEstimateRequest, CalorieEstimateResponse, StatsResponse
)

router = APIRouter(prefix="/workouts", tags=["workouts"])


def _user_id(x_user_id: str = Header(...)) -> UUID:
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")


@router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(
    data: SessionCreate,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = WorkoutService(db)
    session = service.create_session(user_id, data.model_dump())
    return SessionResponse(**session.to_dict(include_exercises=True))


@router.get("/sessions", response_model=List[SessionResponse])
def get_sessions(
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = WorkoutService(db)
    sessions = service.get_user_sessions(user_id, limit, offset)
    return [SessionResponse(**s.to_dict(include_exercises=True)) for s in sessions]


@router.get("/stats/me", response_model=StatsResponse)
def get_my_stats(user_id: UUID = Depends(_user_id), db: Session = Depends(get_db)):
    service = WorkoutService(db)
    return StatsResponse(**service.get_stats(user_id))


@router.get("/partner/{partner_id}/sessions", response_model=List[SessionResponse])
def get_partner_sessions(partner_id: UUID, db: Session = Depends(get_db)):
    service = WorkoutService(db)
    sessions = service.get_partner_sessions(partner_id)
    return [SessionResponse(**s.to_dict(include_exercises=True)) for s in sessions]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    service = WorkoutService(db)
    session = service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(**session.to_dict(include_exercises=True))


@router.post("/sessions/{session_id}/exercises", response_model=ExerciseResponse, status_code=201)
def add_exercise(
    session_id: UUID,
    data: ExerciseCreate,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = WorkoutService(db)
    exercise = service.add_exercise(session_id, user_id, data.model_dump())
    if not exercise:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    return ExerciseResponse(**exercise.to_dict())


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: UUID,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = WorkoutService(db)
    if not service.delete_session(session_id, user_id):
        raise HTTPException(status_code=404, detail="Session not found or access denied")


@router.post("/calorie-estimate", response_model=CalorieEstimateResponse)
def calorie_estimate(data: CalorieEstimateRequest):
    weight = data.weight_kg or DEFAULT_WEIGHT_KG
    calories = estimate_session_calories(data.workout_type, data.duration_minutes, weight)
    met = get_met(data.workout_type)
    return CalorieEstimateResponse(
        calories_estimate=calories,
        met_value=met,
        workout_type=data.workout_type,
        duration_minutes=data.duration_minutes,
        weight_kg_used=weight
    )
