from fastapi import APIRouter, Request, Depends
from typing import Dict, Any

from app.config import settings
from app.auth import get_current_user, require_role
from app.router import forward_request

router = APIRouter(prefix="/gyms", tags=["gyms"])


@router.get("")
async def get_gyms(request: Request, claims: Dict[str, Any] = Depends(get_current_user)):
    return await forward_request(
        service_url=settings.GYM_SERVICE_URL,
        path="/api/v1/gyms",
        request=request
    )


@router.post("/cache/invalidate")
async def invalidate_cache(request: Request, claims: Dict[str, Any] = Depends(require_role("Admin"))):
    return await forward_request(
        service_url=settings.GYM_SERVICE_URL,
        path="/api/v1/gyms/cache/invalidate",
        request=request
    )
