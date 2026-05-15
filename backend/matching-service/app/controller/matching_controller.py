from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
import httpx
import os

from app.database import get_db
from app.service.matching_service import MatchingService
from app.schemas.matching_schema import ConnectionRequest, ConnectionUpdate, ConnectionResponse, MatchSuggestion

router = APIRouter(prefix="/matching", tags=["matching"])

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8001")


def _user_id(x_user_id: str = Header(...)) -> UUID:
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")


async def _get_user_profile(user_id: UUID) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{USER_SERVICE_URL}/api/v1/users/{user_id}", timeout=10.0)
        if resp.status_code == 200:
            return resp.json()
    return {}


async def _enrich_connections(connections: list, current_user_id: UUID) -> list:
    user_cache = {}

    async def fetch(uid_str):
        if uid_str not in user_cache:
            try:
                user_cache[uid_str] = await _get_user_profile(UUID(uid_str))
            except Exception:
                user_cache[uid_str] = {}
        return user_cache[uid_str]

    enriched = []
    for c in connections:
        await fetch(c["requester_id"])
        await fetch(c["addressee_id"])
        c["is_requester"] = c["requester_id"] == str(current_user_id)
        req = user_cache.get(c["requester_id"], {})
        adr = user_cache.get(c["addressee_id"], {})
        c["requester"] = {k: req.get(k) for k in ("id", "username", "first_name", "last_name", "fitness_level", "city")} if req else None
        c["addressee"] = {k: adr.get(k) for k in ("id", "username", "first_name", "last_name", "fitness_level", "city")} if adr else None
        enriched.append(c)
    return enriched


@router.get("/suggestions", response_model=List[MatchSuggestion])
async def get_suggestions(user_id: UUID = Depends(_user_id), db: Session = Depends(get_db)):
    profile = await _get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    service = MatchingService(db)
    results = await service.get_suggestions(user_id, profile)
    return [MatchSuggestion(**r) for r in results if r.get("id")]


@router.get("/browse", response_model=List[MatchSuggestion])
async def browse(user_id: UUID = Depends(_user_id), db: Session = Depends(get_db)):
    profile = await _get_user_profile(user_id)
    service = MatchingService(db)
    results = await service.get_suggestions(user_id, profile)
    return [MatchSuggestion(**r) for r in results if r.get("id")]


@router.get("/partners")
async def get_partners(user_id: UUID = Depends(_user_id), db: Session = Depends(get_db)):
    service = MatchingService(db)
    partner_ids = service.get_partners(user_id)
    partners = []
    for pid in partner_ids:
        p = await _get_user_profile(pid)
        if p:
            partners.append(p)
    return partners


@router.get("/connections", response_model=List[ConnectionResponse])
async def get_connections(user_id: UUID = Depends(_user_id), db: Session = Depends(get_db)):
    service = MatchingService(db)
    raw = service.get_connections(user_id)
    enriched = await _enrich_connections(raw, user_id)
    return [ConnectionResponse(**c) for c in enriched]


@router.post("/connections", response_model=ConnectionResponse, status_code=201)
def send_connection(
    data: ConnectionRequest,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = MatchingService(db)
    result = service.send_connection(user_id, UUID(data.addressee_id), data.match_score)
    if "error" in result:
        raise HTTPException(status_code=409, detail=result["error"])
    return ConnectionResponse(**result)


@router.put("/connections/{connection_id}", response_model=ConnectionResponse)
def update_connection(
    connection_id: UUID,
    data: ConnectionUpdate,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = MatchingService(db)
    result = service.update_connection(connection_id, user_id, data.status)
    if not result:
        raise HTTPException(status_code=404, detail="Connection not found")
    if "error" in result:
        raise HTTPException(status_code=403, detail=result["error"])
    return ConnectionResponse(**result)


@router.delete("/connections/{connection_id}", status_code=204)
def delete_connection(
    connection_id: UUID,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    service = MatchingService(db)
    if not service.delete_connection(connection_id, user_id):
        raise HTTPException(status_code=404, detail="Connection not found or access denied")
