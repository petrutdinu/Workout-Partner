import httpx
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from jose.exceptions import JWKError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

security = HTTPBearer()


class JWTValidator:
    def __init__(self):
        self._jwks: Optional[Dict] = None
        self._jwks_keys: Dict[str, Any] = {}

    async def _fetch_jwks(self) -> Dict:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(settings.keycloak_jwks_url, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Cannot connect to authentication server: {str(e)}"
                )

    async def _get_signing_key(self, token: str) -> Any:
        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing key ID")
            if kid not in self._jwks_keys:
                self._jwks = await self._fetch_jwks()
                for key in self._jwks.get("keys", []):
                    if key.get("kid") == kid:
                        self._jwks_keys[kid] = key
                        break
            if kid not in self._jwks_keys:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to find appropriate key")
            return self._jwks_keys[kid]
        except JWTError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")

    async def validate_token(self, token: str) -> Dict[str, Any]:
        try:
            signing_key = await self._get_signing_key(token)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                issuer=settings.keycloak_issuer,
                options={"verify_aud": False, "verify_iss": True}
            )
            return payload
        except JWTError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token validation failed: {str(e)}")
        except JWKError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Key error: {str(e)}")


jwt_validator = JWTValidator()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    token = credentials.credentials
    claims = await jwt_validator.validate_token(token)
    return claims


def extract_user_info(claims: Dict[str, Any]) -> Dict[str, Any]:
    roles = []
    realm_access = claims.get("realm_access", {})
    roles.extend(realm_access.get("roles", []))
    resource_access = claims.get("resource_access", {})
    client_roles = resource_access.get(settings.KEYCLOAK_CLIENT_ID, {})
    roles.extend(client_roles.get("roles", []))

    primary_role = "Athlete"
    if "Admin" in roles or "admin" in roles:
        primary_role = "Admin"
    elif "Trainer" in roles or "trainer" in roles:
        primary_role = "Trainer"

    return {
        "keycloak_id": claims.get("sub"),
        "email": claims.get("email"),
        "username": claims.get("preferred_username"),
        "first_name": claims.get("given_name"),
        "last_name": claims.get("family_name"),
        "roles": roles,
        "primary_role": primary_role
    }


def require_role(required_role: str):
    async def role_checker(claims: Dict[str, Any] = Depends(get_current_user)):
        user_info = extract_user_info(claims)
        if required_role not in user_info["roles"] and user_info["primary_role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return claims
    return role_checker