from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User, RestaurantOwner
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login/user")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    access_token: Optional[str] = Cookie(None, alias="user_access_token")
) -> User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if access_token.startswith('Bearer '):
        access_token = access_token[7:]
        
    try:
        payload = jwt.decode(
            access_token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        user_type = payload.get("type")
        
        if not user_id or user_type != "user":
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

def get_current_owner(
    db: Session = Depends(get_db),
    access_token: str = Cookie(None, alias="owner_access_token")
) -> RestaurantOwner:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if access_token.startswith('Bearer '):
        access_token = access_token[7:]
        
    try:
        payload = jwt.decode(
            access_token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        owner_id = payload.get("sub")
        user_type = payload.get("type")
        
        if not owner_id or user_type != "owner":
            raise HTTPException(status_code=401, detail="Invalid token")
            
        owner = db.query(RestaurantOwner).filter(RestaurantOwner.id == owner_id).first()
        if not owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant owner not found"
            )
        return owner
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
