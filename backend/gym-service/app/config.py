import os

OVERPASS_API_URL = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")
GYM_CACHE_TTL = int(os.getenv("GYM_CACHE_TTL", "21600"))  # 6 hours
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "workoutpartner_redis_password")
