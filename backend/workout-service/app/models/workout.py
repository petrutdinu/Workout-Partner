import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, SmallInteger, Boolean, Numeric, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    workout_type = Column(String(50), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(SmallInteger, nullable=True)
    total_calories = Column(Numeric(8, 2), nullable=True)
    is_public = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    exercises = relationship("WorkoutExercise", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self, include_exercises=False):
        d = {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "workout_type": self.workout_type,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_minutes": self.duration_minutes,
            "total_calories": float(self.total_calories) if self.total_calories else None,
            "is_public": self.is_public,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_exercises:
            d["exercises"] = [e.to_dict() for e in self.exercises]
        return d


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False)
    exercise_name = Column(String(100), nullable=False)
    sets = Column(SmallInteger, nullable=True)
    reps = Column(SmallInteger, nullable=True)
    weight_kg = Column(Numeric(6, 2), nullable=True)
    duration_sec = Column(Integer, nullable=True)
    distance_km = Column(Numeric(8, 3), nullable=True)
    calories = Column(Numeric(6, 2), nullable=True)
    met_value = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("WorkoutSession", back_populates="exercises")

    def to_dict(self):
        return {
            "id": str(self.id),
            "session_id": str(self.session_id),
            "exercise_name": self.exercise_name,
            "sets": self.sets,
            "reps": self.reps,
            "weight_kg": float(self.weight_kg) if self.weight_kg else None,
            "duration_sec": self.duration_sec,
            "distance_km": float(self.distance_km) if self.distance_km else None,
            "calories": float(self.calories) if self.calories else None,
            "met_value": float(self.met_value) if self.met_value else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
