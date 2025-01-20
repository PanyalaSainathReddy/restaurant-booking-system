from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, RestaurantOwner
from app.core.security import verify_password, get_password_hash

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def authenticate_owner(db: Session, email: str, password: str) -> Optional[RestaurantOwner]:
        owner = db.query(RestaurantOwner).filter(RestaurantOwner.email == email).first()
        if not owner:
            return None
        if not verify_password(password, owner.hashed_password):
            return None
        return owner

    @staticmethod
    def create_user(db: Session, user_data: dict) -> User:
        if db.query(User).filter(User.email == user_data["email"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(user_data["password"])
        db_user = User(
            email=user_data["email"],
            hashed_password=hashed_password,
            full_name=user_data["full_name"]
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_owner(db: Session, owner_data: dict) -> RestaurantOwner:
        if db.query(RestaurantOwner).filter(RestaurantOwner.email == owner_data["email"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(owner_data["password"])
        db_owner = RestaurantOwner(
            email=owner_data["email"],
            hashed_password=hashed_password,
            full_name=owner_data["full_name"]
        )
        db.add(db_owner)
        db.commit()
        db.refresh(db_owner)
        return db_owner
