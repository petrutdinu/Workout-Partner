from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.match import PartnerConnection


class MatchRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_connection(self, user_a: UUID, user_b: UUID) -> Optional[PartnerConnection]:
        return self.db.query(PartnerConnection).filter(
            or_(
                and_(PartnerConnection.requester_id == user_a, PartnerConnection.addressee_id == user_b),
                and_(PartnerConnection.requester_id == user_b, PartnerConnection.addressee_id == user_a),
            )
        ).first()

    def find_by_id(self, connection_id: UUID) -> Optional[PartnerConnection]:
        return self.db.query(PartnerConnection).filter(PartnerConnection.id == connection_id).first()

    def find_all_for_user(self, user_id: UUID) -> List[PartnerConnection]:
        return self.db.query(PartnerConnection).filter(
            or_(
                PartnerConnection.requester_id == user_id,
                PartnerConnection.addressee_id == user_id,
            )
        ).order_by(PartnerConnection.created_at.desc()).all()

    def find_accepted_partners(self, user_id: UUID) -> List[UUID]:
        connections = self.db.query(PartnerConnection).filter(
            or_(
                PartnerConnection.requester_id == user_id,
                PartnerConnection.addressee_id == user_id,
            ),
            PartnerConnection.status == "accepted"
        ).all()
        partners = []
        for c in connections:
            other = c.addressee_id if c.requester_id == user_id else c.requester_id
            partners.append(other)
        return partners

    def create(self, conn: PartnerConnection) -> PartnerConnection:
        self.db.add(conn)
        self.db.commit()
        self.db.refresh(conn)
        return conn

    def update(self, conn: PartnerConnection) -> PartnerConnection:
        self.db.commit()
        self.db.refresh(conn)
        return conn

    def delete(self, conn: PartnerConnection) -> None:
        self.db.delete(conn)
        self.db.commit()
