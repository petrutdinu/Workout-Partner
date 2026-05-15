import httpx
from typing import Optional, Dict
from fastapi import Request, Response, HTTPException, status


async def forward_request(
    service_url: str,
    path: str,
    request: Request,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 30.0
) -> Response:
    url = f"{service_url}{path}"
    query_params = dict(request.query_params)

    forward_headers = {}
    excluded_headers = {"host", "content-length", "transfer-encoding", "connection"}
    for key, value in request.headers.items():
        if key.lower() not in excluded_headers:
            forward_headers[key] = value

    if headers:
        forward_headers.update(headers)

    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()

    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                params=query_params,
                headers=forward_headers,
                content=body,
                timeout=timeout
            )
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Service unavailable: {str(e)}"
            )
