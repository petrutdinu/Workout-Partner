import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    KEYCLOAK_URL: str = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
    KEYCLOAK_EXTERNAL_URL: str = os.getenv("KEYCLOAK_EXTERNAL_URL", "http://localhost:8080")
    KEYCLOAK_REALM: str = os.getenv("KEYCLOAK_REALM", "workoutpartner")
    KEYCLOAK_CLIENT_ID: str = os.getenv("KEYCLOAK_CLIENT_ID", "workoutpartner-client")

    USER_SERVICE_URL: str = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
    WORKOUT_SERVICE_URL: str = os.getenv("WORKOUT_SERVICE_URL", "http://workout-service:8002")
    MATCHING_SERVICE_URL: str = os.getenv("MATCHING_SERVICE_URL", "http://matching-service:8003")
    GYM_SERVICE_URL: str = os.getenv("GYM_SERVICE_URL", "http://gym-service:8004")

    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "workoutpartner_redis_password")

    API_PREFIX: str = "/api/v1"

    @property
    def keycloak_jwks_url(self) -> str:
        return f"{self.KEYCLOAK_URL}/realms/{self.KEYCLOAK_REALM}/protocol/openid-connect/certs"

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.KEYCLOAK_EXTERNAL_URL}/realms/{self.KEYCLOAK_REALM}"

    class Config:
        env_file = ".env"


settings = Settings()
