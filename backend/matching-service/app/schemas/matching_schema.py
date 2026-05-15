from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ConnectionRequest(BaseModel):
    addressee_id: str
    match_score: Optional[float] = None


class ConnectionUpdate(BaseModel):
    status: str  # accepted / declined / blocked


class UserSummary(BaseModel):
    id: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    fitness_level: Optional[str] = None
    city: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: str
    requester_id: str
    addressee_id: str
    status: str
    match_score: Optional[float] = None
    initiated_by: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_requester: Optional[bool] = None
    requester: Optional[UserSummary] = None
    addressee: Optional[UserSummary] = None


class MatchSuggestion(BaseModel):
    id: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    fitness_level: Optional[str] = None
    primary_goal: Optional[str] = None
    workout_types: List[str] = []
    preferred_days: List[str] = []
    preferred_time: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    match_score: float
