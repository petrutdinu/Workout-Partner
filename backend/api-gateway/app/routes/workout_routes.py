from fastapi import APIRouter, Request, Depends
from typing import Dict, Any
import httpx

from app.config import settings
from app.auth import get_current_user, extract_user_info
from app.router import forward_request

router = APIRouter(prefix="/workouts", tags=["workouts"])


async def _get_user_db_id(user_info: Dict[str, Any]) -> str:
    sync_data = {
        "keycloak_id": user_info["keycloak_id"],
        "email": user_info["email"],
        "username": user_info["username"],
        "first_name": user_info["first_name"],
        "last_name": user_info["last_name"],
        "role": user_info["primary_role"]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.USER_SERVICE_URL}/api/v1/users/sync",
            json=sync_data,
            timeout=30.0
        )
        if resp.status_code == 200:
            return resp.json().get("id")
    return None


@router.post("/sessions")
async def create_session(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path="/api/v1/workouts/sessions",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.get("/sessions")
async def get_sessions(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path="/api/v1/workouts/sessions",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.get("/stats/me")
async def get_my_stats(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path="/api/v1/workouts/stats/me",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.post("/calorie-estimate")
async def calorie_estimate(request: Request):
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path="/api/v1/workouts/calorie-estimate",
        request=request
    )


@router.get("/partner/{user_id}/sessions")
async def get_partner_sessions(user_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path=f"/api/v1/workouts/partner/{user_id}/sessions",
        request=request
    )


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path=f"/api/v1/workouts/sessions/{session_id}",
        request=request
    )


@router.post("/sessions/{session_id}/exercises")
async def add_exercise(session_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path=f"/api/v1/workouts/sessions/{session_id}/exercises",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.WORKOUT_SERVICE_URL,
        path=f"/api/v1/workouts/sessions/{session_id}",
        request=request,
        headers={"X-User-Id": user_db_id}
    )
