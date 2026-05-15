from fastapi import APIRouter, Request, Depends, Response
from typing import Dict, Any
import httpx

from app.config import settings
from app.auth import get_current_user, extract_user_info, require_role
from app.router import forward_request

router = APIRouter(prefix="/users", tags=["users"])


async def _sync_user(user_info: Dict[str, Any]) -> str:
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


@router.post("/sync")
async def sync_user(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    sync_data = {
        "keycloak_id": user_info["keycloak_id"],
        "email": user_info["email"],
        "username": user_info["username"],
        "first_name": user_info["first_name"],
        "last_name": user_info["last_name"],
        "role": user_info["primary_role"]
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.USER_SERVICE_URL}/api/v1/users/sync",
            json=sync_data,
            timeout=30.0
        )
        return Response(content=response.content, status_code=response.status_code, media_type="application/json")


@router.get("/me")
async def get_me(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path=f"/api/v1/users/me?keycloak_id={user_info['keycloak_id']}",
        request=request
    )


@router.put("/me/fitness-profile")
async def update_fitness_profile(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    user_info = extract_user_info(claims)
    user_db_id = await _sync_user(user_info)
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path=f"/api/v1/users/{user_db_id}/fitness-profile",
        request=request
    )


@router.get("/athletes")
async def get_athletes(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path="/api/v1/users/athletes",
        request=request
    )


@router.get("/trainers")
async def get_trainers(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path="/api/v1/users/trainers",
        request=request
    )


@router.get("/")
async def get_all_users(request: Request, claims: Dict[str, Any] = Depends(require_role("Admin"))):
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path="/api/v1/users/",
        request=request
    )


@router.get("/{user_id}")
async def get_user_by_id(user_id: str, request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path=f"/api/v1/users/{user_id}",
        request=request
    )


@router.delete("/{user_id}")
async def delete_user(user_id: str, request: Request, claims: Dict[str, Any] = Depends(require_role("Admin"))):
    return await forward_request(
        service_url=settings.USER_SERVICE_URL,
        path=f"/api/v1/users/{user_id}",
        request=request
    )
