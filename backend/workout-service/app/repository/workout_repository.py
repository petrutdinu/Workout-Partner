from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.workout import WorkoutSession, WorkoutExercise


class WorkoutRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, session: WorkoutSession) -> WorkoutSession:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def find_session_by_id(self, session_id: UUID) -> Optional[WorkoutSession]:
        return self.db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()

    def find_sessions_by_user(self, user_id: UUID, limit: int = 50, offset: int = 0) -> List[WorkoutSession]:
        return (
            self.db.query(WorkoutSession)
            .filter(WorkoutSession.user_id == user_id)
            .order_by(WorkoutSession.started_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def find_public_sessions_by_user(self, user_id: UUID, limit: int = 20) -> List[WorkoutSession]:
        return (
            self.db.query(WorkoutSession)
            .filter(WorkoutSession.user_id == user_id, WorkoutSession.is_public == True)
            .order_by(WorkoutSession.started_at.desc())
            .limit(limit)
            .all()
        )

    def delete_session(self, session: WorkoutSession) -> None:
        self.db.delete(session)
        self.db.commit()

    def update_session(self, session: WorkoutSession) -> WorkoutSession:
        self.db.commit()
        self.db.refresh(session)
        return session

    def add_exercise(self, exercise: WorkoutExercise) -> WorkoutExercise:
        self.db.add(exercise)
        self.db.commit()
        self.db.refresh(exercise)
        return exercise

    def get_user_stats(self, user_id: UUID) -> dict:
        result = (
            self.db.query(
                func.count(WorkoutSession.id).label("total_sessions"),
                func.coalesce(func.sum(WorkoutSession.total_calories), 0).label("total_calories"),
                func.coalesce(func.sum(WorkoutSession.duration_minutes), 0).label("total_duration_minutes"),
            )
            .filter(WorkoutSession.user_id == user_id)
            .one()
        )

        most_common = (
            self.db.query(WorkoutSession.workout_type, func.count(WorkoutSession.id).label("cnt"))
            .filter(WorkoutSession.user_id == user_id)
            .group_by(WorkoutSession.workout_type)
            .order_by(func.count(WorkoutSession.id).desc())
            .first()
        )

        total = result.total_sessions or 0
        total_cal = float(result.total_calories or 0)

        return {
            "total_sessions": total,
            "total_calories": total_cal,
            "total_duration_minutes": int(result.total_duration_minutes or 0),
            "avg_calories_per_session": round(total_cal / total, 2) if total > 0 else 0.0,
            "most_common_workout_type": most_common.workout_type if most_common else None,
        }
