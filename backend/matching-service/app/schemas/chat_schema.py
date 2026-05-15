from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool
    sent_at: Optional[datetime] = None
