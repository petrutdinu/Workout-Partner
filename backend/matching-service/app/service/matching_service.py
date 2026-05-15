import os
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
import httpx

from app.models.match import PartnerConnection
from app.repository.match_repository import MatchRepository
from app.service.matching_algorithm import rank_candidates

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8001")


async def _fetch_all_athletes() -> List[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{USER_SERVICE_URL}/api/v1/users/athletes", timeout=10.0)
        if resp.status_code == 200:
            return resp.json()
    return []


class MatchingService:
    def __init__(self, db: Session):
        self.repo = MatchRepository(db)

    async def get_suggestions(self, current_user_id: UUID, current_user_profile: dict) -> List[dict]:
        all_athletes = await _fetch_all_athletes()

        # Exclude self and already-connected users
        connected_ids = {str(uid) for uid in self.repo.find_accepted_partners(current_user_id)}
        pending = self.repo.find_all_for_user(current_user_id)
        pending_ids = {
            str(c.addressee_id if c.requester_id == current_user_id else c.requester_id)
            for c in pending if c.status in ("pending", "blocked")
        }
        excluded = {str(current_user_id)} | connected_ids | pending_ids

        candidates = [u for u in all_athletes if u.get("id") not in excluded]
        return rank_candidates(current_user_profile, candidates)

    def send_connection(self, requester_id: UUID, addressee_id: UUID, match_score: float = None) -> dict:
        existing = self.repo.find_connection(requester_id, addressee_id)
        if existing:
            return {"error": "Connection already exists", "status": existing.status}

        conn = PartnerConnection(
            requester_id=requester_id,
            addressee_id=addressee_id,
            status="pending",
            match_score=match_score,
            initiated_by="user",
        )
        return self.repo.create(conn).to_dict()

    def update_connection(self, connection_id: UUID, user_id: UUID, new_status: str) -> Optional[dict]:
        conn = self.repo.find_by_id(connection_id)
        if not conn:
            return None
        # Only addressee can accept/decline; either party can block/delete
        if new_status in ("accepted", "declined") and conn.addressee_id != user_id:
            return {"error": "Not authorized"}
        conn.status = new_status
        return self.repo.update(conn).to_dict()

    def delete_connection(self, connection_id: UUID, user_id: UUID) -> bool:
        conn = self.repo.find_by_id(connection_id)
        if not conn:
            return False
        if conn.requester_id != user_id and conn.addressee_id != user_id:
            return False
        self.repo.delete(conn)
        return True

    def get_connections(self, user_id: UUID) -> List[dict]:
        return [c.to_dict() for c in self.repo.find_all_for_user(user_id)]

    def get_partners(self, user_id: UUID) -> List[UUID]:
        return self.repo.find_accepted_partners(user_id)
