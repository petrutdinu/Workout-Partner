from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from app.database import get_db
from app.repository.chat_repository import ChatRepository
from app.models.chat import DirectMessage
from app.service.connection_manager import manager
from app.schemas.chat_schema import MessageResponse

router = APIRouter(prefix="/chat", tags=["chat"])


def _user_id(x_user_id: str = Header(...)) -> UUID:
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")


@router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
def get_messages(
    other_user_id: UUID,
    limit: int = Query(50, le=100),
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    repo = ChatRepository(db)
    messages = repo.get_conversation(user_id, other_user_id, limit=limit)
    return [MessageResponse(**m.to_dict()) for m in reversed(messages)]


@router.put("/messages/{message_id}/read", response_model=MessageResponse)
def mark_read(
    message_id: UUID,
    user_id: UUID = Depends(_user_id),
    db: Session = Depends(get_db)
):
    repo = ChatRepository(db)
    msg = repo.mark_read(message_id, user_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return MessageResponse(**msg.to_dict())


@router.websocket("/ws/{other_user_id}")
async def websocket_chat(
    other_user_id: str,
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    from app.auth_helper import validate_token_ws
    user_id = await validate_token_ws(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(str(user_id), websocket)
    repo = ChatRepository(db)

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            content = data.get("content", "").strip()
            if not content:
                continue

            msg = DirectMessage(
                sender_id=UUID(user_id),
                receiver_id=UUID(other_user_id),
                content=content,
                sent_at=datetime.utcnow(),
            )
            msg = repo.save(msg)
            payload = msg.to_dict()

            await websocket.send_text(json.dumps(payload))
            await manager.send_to_user(other_user_id, payload)

    except WebSocketDisconnect:
        manager.disconnect(str(user_id))
