import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class PartnerConnection(Base):
    __tablename__ = "partner_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), nullable=False)
    addressee_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    match_score = Column(Numeric(5, 4), nullable=True)
    initiated_by = Column(String(20), nullable=False, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "requester_id": str(self.requester_id),
            "addressee_id": str(self.addressee_id),
            "status": self.status,
            "match_score": float(self.match_score) if self.match_score else None,
            "initiated_by": self.initiated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
