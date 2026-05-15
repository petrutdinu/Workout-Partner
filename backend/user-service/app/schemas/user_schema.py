from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class UserSyncRequest(BaseModel):
    keycloak_id: str
    email: Optional[str] = None
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str


class FitnessProfileUpdate(BaseModel):
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    fitness_level: Optional[str] = None
    primary_goal: Optional[str] = None
    workout_types: Optional[List[str]] = None
    preferred_days: Optional[List[str]] = None
    preferred_time: Optional[str] = None
    weight_kg: Optional[float] = None
    certifications: Optional[List[str]] = None
    hourly_rate: Optional[float] = None


class UserResponse(BaseModel):
    id: str
    keycloak_id: str
    email: Optional[str] = None
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    fitness_level: Optional[str] = None
    primary_goal: Optional[str] = None
    workout_types: List[str] = []
    preferred_days: List[str] = []
    preferred_time: Optional[str] = None
    weight_kg: Optional[float] = None
    certifications: List[str] = []
    hourly_rate: Optional[float] = None
    profile_complete: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
