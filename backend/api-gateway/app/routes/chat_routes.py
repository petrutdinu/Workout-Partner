from fastapi import APIRouter, Request, Depends
from typing import Dict, Any
import httpx

from app.config import settings
from app.auth import get_current_user, extract_user_info
from app.router import forward_request

router = APIRouter(prefix="/chat", tags=["chat"])


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


@router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path=f"/api/v1/chat/messages/{other_user_id}",
        request=request,
        headers={"X-User-Id": user_db_id}
    )


@router.put("/messages/{message_id}/read")
async def mark_read(message_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _get_user_db_id(user_info)
    return await forward_request(
        service_url=settings.MATCHING_SERVICE_URL,
        path=f"/api/v1/chat/messages/{message_id}/read",
        request=request,
        headers={"X-User-Id": user_db_id}
    )
