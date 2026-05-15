from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.workout import WorkoutSession, WorkoutExercise
from app.repository.workout_repository import WorkoutRepository
from app.service.calorie_service import (
    estimate_session_calories,
    estimate_exercise_calories,
    DEFAULT_WEIGHT_KG,
)


class WorkoutService:
    def __init__(self, db: Session):
        self.repo = WorkoutRepository(db)

    def create_session(self, user_id: UUID, data: dict, user_weight_kg: float = None) -> WorkoutSession:
        exercises_data = data.pop("exercises", []) or []

        session = WorkoutSession(
            user_id=user_id,
            title=data["title"],
            workout_type=data["workout_type"],
            started_at=data.get("started_at") or datetime.utcnow(),
            duration_minutes=data.get("duration_minutes"),
            is_public=data.get("is_public", True),
            notes=data.get("notes"),
        )

        if session.duration_minutes:
            session.total_calories = estimate_session_calories(
                session.workout_type, session.duration_minutes, user_weight_kg
            )

        session = self.repo.create_session(session)

        total_calories = 0.0
        for ex_data in exercises_data:
            exercise, cal = self._build_exercise(session.id, ex_data, user_weight_kg)
            self.repo.add_exercise(exercise)
            total_calories += cal

        if total_calories > 0 and not session.duration_minutes:
            session.total_calories = round(total_calories * 1.1, 2)  # +10% overhead
            self.repo.update_session(session)

        return self.repo.find_session_by_id(session.id)

    def add_exercise(self, session_id: UUID, user_id: UUID, data: dict, user_weight_kg: float = None) -> Optional[WorkoutExercise]:
        session = self.repo.find_session_by_id(session_id)
        if not session or session.user_id != user_id:
            return None

        exercise, cal = self._build_exercise(session_id, data, user_weight_kg)
        exercise = self.repo.add_exercise(exercise)

        # Update session total_calories
        current = float(session.total_calories or 0)
        session.total_calories = round(current + cal, 2)
        self.repo.update_session(session)

        return exercise

    def _build_exercise(self, session_id: UUID, data: dict, user_weight_kg: float = None):
        calories, met = estimate_exercise_calories(
            exercise_name=data.get("exercise_name", "general"),
            sets=data.get("sets"),
            reps=data.get("reps"),
            weight_kg=data.get("weight_kg"),
            duration_sec=data.get("duration_sec"),
            user_weight_kg=user_weight_kg,
        )
        exercise = WorkoutExercise(
            session_id=session_id,
            exercise_name=data["exercise_name"],
            sets=data.get("sets"),
            reps=data.get("reps"),
            weight_kg=data.get("weight_kg"),
            duration_sec=data.get("duration_sec"),
            distance_km=data.get("distance_km"),
            calories=calories,
            met_value=met,
        )
        return exercise, calories

    def get_session(self, session_id: UUID) -> Optional[WorkoutSession]:
        return self.repo.find_session_by_id(session_id)

    def get_user_sessions(self, user_id: UUID, limit: int = 50, offset: int = 0) -> List[WorkoutSession]:
        return self.repo.find_sessions_by_user(user_id, limit, offset)

    def get_partner_sessions(self, partner_id: UUID) -> List[WorkoutSession]:
        return self.repo.find_public_sessions_by_user(partner_id)

    def delete_session(self, session_id: UUID, user_id: UUID) -> bool:
        session = self.repo.find_session_by_id(session_id)
        if not session or session.user_id != user_id:
            return False
        self.repo.delete_session(session)
        return True

    def get_stats(self, user_id: UUID) -> dict:
        return self.repo.get_user_stats(user_id)
