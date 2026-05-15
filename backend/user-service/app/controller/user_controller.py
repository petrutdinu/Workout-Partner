from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.service.user_service import UserService
from app.schemas.user_schema import UserResponse, UserSyncRequest, FitnessProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/sync", response_model=UserResponse)
def sync_user(user_data: UserSyncRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.get_or_create_user(
        keycloak_id=user_data.keycloak_id,
        email=user_data.email,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role
    )
    return UserResponse(**user.to_dict())


@router.get("/me", response_model=UserResponse)
def get_current_user(keycloak_id: str, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.get_user_by_keycloak_id(keycloak_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse(**user.to_dict())


@router.get("/athletes", response_model=List[UserResponse])
def get_athletes(
    fitness_level: str = Query(None),
    primary_goal: str = Query(None),
    city: str = Query(None),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    users = service.get_athletes(fitness_level, primary_goal, city)
    return [UserResponse(**u.to_dict()) for u in users]


@router.get("/trainers", response_model=List[UserResponse])
def get_trainers(db: Session = Depends(get_db)):
    service = UserService(db)
    return [UserResponse(**u.to_dict()) for u in service.get_trainers()]


@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    service = UserService(db)
    return [UserResponse(**u.to_dict()) for u in service.get_all_users()]


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: UUID, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse(**user.to_dict())


@router.put("/{user_id}/fitness-profile", response_model=UserResponse)
def update_fitness_profile(user_id: UUID, data: FitnessProfileUpdate, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.update_fitness_profile(user_id, data.model_dump(exclude_none=True))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse(**user.to_dict())


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: UUID, db: Session = Depends(get_db)):
    service = UserService(db)
    if not service.delete_user(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
