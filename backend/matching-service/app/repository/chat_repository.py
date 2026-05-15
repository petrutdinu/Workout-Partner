from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.chat import DirectMessage


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_conversation(self, user_a: UUID, user_b: UUID, limit: int = 50, before_id: UUID = None) -> List[DirectMessage]:
        query = self.db.query(DirectMessage).filter(
            or_(
                and_(DirectMessage.sender_id == user_a, DirectMessage.receiver_id == user_b),
                and_(DirectMessage.sender_id == user_b, DirectMessage.receiver_id == user_a),
            )
        ).order_by(DirectMessage.sent_at.desc())

        if before_id:
            ref = self.db.query(DirectMessage).filter(DirectMessage.id == before_id).first()
            if ref:
                query = query.filter(DirectMessage.sent_at < ref.sent_at)

        return query.limit(limit).all()

    def save(self, msg: DirectMessage) -> DirectMessage:
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def mark_read(self, message_id: UUID, reader_id: UUID) -> Optional[DirectMessage]:
        msg = self.db.query(DirectMessage).filter(
            DirectMessage.id == message_id,
            DirectMessage.receiver_id == reader_id
        ).first()
        if msg:
            msg.is_read = True
            self.db.commit()
            self.db.refresh(msg)
        return msg

    def get_unread_count(self, user_id: UUID) -> int:
        return self.db.query(DirectMessage).filter(
            DirectMessage.receiver_id == user_id,
            DirectMessage.is_read == False
        ).count()
