from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_keycloak_id(self, keycloak_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.keycloak_id == keycloak_id).first()

    def find_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def find_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def find_all(self) -> List[User]:
        return self.db.query(User).all()

    def find_athletes(self, fitness_level: str = None, primary_goal: str = None, city: str = None) -> List[User]:
        query = self.db.query(User).filter(User.role == "Athlete", User.profile_complete == True)
        if fitness_level:
            query = query.filter(User.fitness_level == fitness_level)
        if primary_goal:
            query = query.filter(User.primary_goal == primary_goal)
        if city:
            query = query.filter(User.city.ilike(f"%{city}%"))
        return query.all()

    def find_trainers(self) -> List[User]:
        return self.db.query(User).filter(User.role == "Trainer").all()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
