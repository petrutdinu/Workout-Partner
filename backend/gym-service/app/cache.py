import hashlib
import json
import redis
from typing import Optional, List
from app.config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, GYM_CACHE_TTL


class GymCache:
    def __init__(self):
        self._client: Optional[redis.Redis] = None

    def connect(self):
        self._client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=True,
        )

    def _key(self, params: dict) -> str:
        raw = json.dumps(params, sort_keys=True)
        h = hashlib.md5(raw.encode()).hexdigest()
        return f"gyms:query:{h}"

    def get(self, params: dict) -> Optional[List[dict]]:
        if not self._client:
            return None
        try:
            data = self._client.get(self._key(params))
            return json.loads(data) if data else None
        except Exception:
            return None

    def set(self, params: dict, gyms: List[dict]):
        if not self._client:
            return
        try:
            self._client.setex(self._key(params), GYM_CACHE_TTL, json.dumps(gyms))
        except Exception:
            pass

    def invalidate_all(self) -> int:
        if not self._client:
            return 0
        try:
            keys = list(self._client.scan_iter("gyms:query:*"))
            if keys:
                return self._client.delete(*keys)
            return 0
        except Exception:
            return 0


gym_cache = GymCache()
