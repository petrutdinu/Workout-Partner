"""
Lightweight JWT validation for WebSocket connections.
WebSocket API cannot send custom headers, so the token is passed as a query param.
"""
import os
from typing import Optional
import httpx
from jose import jwt, JWTError

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_EXTERNAL_URL = os.getenv("KEYCLOAK_EXTERNAL_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "workoutpartner")

_jwks_cache: dict = {}


async def _fetch_jwks() -> dict:
    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10.0)
        resp.raise_for_status()
        return resp.json()


async def validate_token_ws(token: str) -> Optional[str]:
    """Returns user_id (sub claim) if valid, None otherwise."""
    global _jwks_cache
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if kid not in _jwks_cache:
            jwks = await _fetch_jwks()
            for key in jwks.get("keys", []):
                if key.get("kid"):
                    _jwks_cache[key["kid"]] = key

        signing_key = _jwks_cache.get(kid)
        if not signing_key:
            return None

        issuer = f"{KEYCLOAK_EXTERNAL_URL}/realms/{KEYCLOAK_REALM}"
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False, "verify_iss": True}
        )
        return payload.get("sub")
    except (JWTError, Exception):
        return None
