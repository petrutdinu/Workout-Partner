from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.repository.user_repository import UserRepository


class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def get_or_create_user(self, keycloak_id: str, email: Optional[str], username: str,
                           first_name: Optional[str], last_name: Optional[str], role: str) -> User:
        existing = self.repository.find_by_keycloak_id(keycloak_id)
        if not email:
            email = f"{username}@workoutpartner.local"

        if existing:
            existing.email = email
            existing.username = username
            existing.first_name = first_name
            existing.last_name = last_name
            existing.role = role
            return self.repository.update(existing)

        new_user = User(
            keycloak_id=keycloak_id,
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            role=role
        )
        return self.repository.create(new_user)

    def update_fitness_profile(self, user_id: UUID, data: dict) -> Optional[User]:
        user = self.repository.find_by_id(user_id)
        if not user:
            return None
        for field, value in data.items():
            if value is not None:
                setattr(user, field, value)
        # Mark profile complete if key fields are filled
        if user.fitness_level and user.primary_goal and user.preferred_days:
            user.profile_complete = True
        return self.repository.update(user)

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        return self.repository.find_by_id(user_id)

    def get_user_by_keycloak_id(self, keycloak_id: str) -> Optional[User]:
        return self.repository.find_by_keycloak_id(keycloak_id)

    def get_all_users(self) -> List[User]:
        return self.repository.find_all()

    def get_athletes(self, fitness_level: str = None, primary_goal: str = None, city: str = None) -> List[User]:
        return self.repository.find_athletes(fitness_level, primary_goal, city)

    def get_trainers(self) -> List[User]:
        return self.repository.find_trainers()

    def delete_user(self, user_id: UUID) -> bool:
        user = self.repository.find_by_id(user_id)
        if user:
            self.repository.delete(user)
            return True
        return False
