from fastapi import APIRouter, Request, Depends
from typing import Dict, Any
import httpx

from app.config import settings
from app.auth import get_current_user, extract_user_info
from app.router import forward_request

router = APIRouter(prefix="/matching", tags=["matching"])


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


@router.get("/suggestions")
async def get_suggestions(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path="/api/v1/matching/suggestions",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.get("/browse")
async def browse_athletes(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path="/api/v1/matching/browse",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.get("/partners")
async def get_partners(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path="/api/v1/matching/partners",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.get("/connections")
async def get_connections(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path="/api/v1/matching/connections",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.post("/connections")
async def send_connection(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path="/api/v1/matching/connections",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.put("/connections/{connection_id}")
async def update_connection(connection_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path=f"/api/v1/matching/connections/{connection_id}",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.delete("/connections/{connection_id}")
async def delete_connection(connection_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path=f"/api/v1/matching/connections/{connection_id}",
        request=request,
        headers={"X-User-Id": user_db_id}
    )
