import os
import json
import asyncio
from typing import Dict
from uuid import UUID
from fastapi import WebSocket
import redis.asyncio as aioredis

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "workoutpartner_redis_password")


class ConnectionManager:
    """
    Manages active WebSocket connections for 1-to-1 chat.
    Uses Redis Pub/Sub so messages reach the right connection
    even if the service is restarted or scaled.
    """

    def __init__(self):
        self._connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        self._redis: aioredis.Redis = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(
                f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}",
                decode_responses=True,
            )
        return self._redis

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[user_id] = websocket

        # Subscribe to this user's Redis channel and forward messages
        r = await self._get_redis()
        pubsub = r.pubsub()
        await pubsub.subscribe(f"chat:dm:{user_id}")
        asyncio.create_task(self._forward_messages(pubsub, websocket))

    def disconnect(self, user_id: str):
        self._connections.pop(user_id, None)

    async def send_to_user(self, receiver_id: str, message: dict):
        """Publish to Redis — reaches receiver wherever they are connected."""
        r = await self._get_redis()
        await r.publish(f"chat:dm:{receiver_id}", json.dumps(message))

    async def _forward_messages(self, pubsub, websocket: WebSocket):
        try:
            async for msg in pubsub.listen():
                if msg["type"] == "message":
                    try:
                        await websocket.send_text(msg["data"])
                    except Exception:
                        break
        finally:
            await pubsub.unsubscribe()
            await pubsub.aclose()


manager = ConnectionManager()
