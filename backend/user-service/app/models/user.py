import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, SmallInteger, Boolean, Numeric, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keycloak_id = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    role = Column(String(50), nullable=False, default="Athlete")

    # Fitness profile
    bio = Column(Text, nullable=True)
    age = Column(SmallInteger, nullable=True)
    gender = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    fitness_level = Column(String(20), nullable=True)      # Beginner/Intermediate/Advanced/Elite
    primary_goal = Column(String(50), nullable=True)       # weight_loss/muscle_gain/endurance/flexibility/general
    workout_types = Column(ARRAY(String), nullable=True)   # ['gym','running','yoga','crossfit',...]
    preferred_days = Column(ARRAY(String), nullable=True)  # ['Mon','Tue',...]
    preferred_time = Column(String(20), nullable=True)     # morning/afternoon/evening/flexible
    weight_kg = Column(Numeric(5, 2), nullable=True)

    # Trainer-specific
    certifications = Column(ARRAY(String), nullable=True)
    hourly_rate = Column(Numeric(8, 2), nullable=True)

    profile_complete = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "keycloak_id": self.keycloak_id,
            "email": self.email,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "bio": self.bio,
            "age": self.age,
            "gender": self.gender,
            "city": self.city,
            "fitness_level": self.fitness_level,
            "primary_goal": self.primary_goal,
            "workout_types": self.workout_types or [],
            "preferred_days": self.preferred_days or [],
            "preferred_time": self.preferred_time,
            "weight_kg": float(self.weight_kg) if self.weight_kg else None,
            "certifications": self.certifications or [],
            "hourly_rate": float(self.hourly_rate) if self.hourly_rate else None,
            "profile_complete": self.profile_complete,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
