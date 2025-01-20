from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
from sqlalchemy.orm import Session
from pydantic import ValidationError
from typing import Optional, Union

# JWT related
from jose import jwt, JWTError

# Local imports
from app.api import deps
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings
from app.core.database import SessionLocal
from app.schemas.auth import (
    Token, UserCreate, UserOut, RestaurantOwnerCreate, 
    RestaurantOwnerOut, UserLogin, RestaurantOwnerLogin,
    TokenPayload
)
from app.services.auth import AuthService
from app.models.user import User, RestaurantOwner

router = APIRouter()

# Constants for cookie names
USER_ACCESS_COOKIE = "user_access_token"
USER_REFRESH_COOKIE = "user_refresh_token"
OWNER_ACCESS_COOKIE = "owner_access_token"
OWNER_REFRESH_COOKIE = "owner_refresh_token"

@router.post("/login/user", response_model=Token)
def login_user(
    response: Response,
    user_in: UserLogin,
    db: Session = Depends(deps.get_db)
):
    user = AuthService.authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token({"sub": str(user.id), "type": "user"})
    refresh_token = create_refresh_token({"sub": str(user.id), "type": "user"})
    
    response.set_cookie(
        key=USER_ACCESS_COOKIE,
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1800,
        expires=1800,
        secure=True,
        samesite="lax"
    )
    response.set_cookie(
        key=USER_REFRESH_COOKIE,
        value=f"Bearer {refresh_token}",
        httponly=True,
        max_age=604800,
        expires=604800,
        secure=True,
        samesite="lax"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login/owner", response_model=Token)
def login_owner(
    response: Response,
    owner_in: RestaurantOwnerLogin,
    db: Session = Depends(deps.get_db)
):
    owner = AuthService.authenticate_owner(db, owner_in.email, owner_in.password)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token({
        "sub": str(owner.id),
        "type": "owner"
    })
    refresh_token = create_refresh_token({
        "sub": str(owner.id),
        "type": "owner"
    })
    
    response.set_cookie(
        key=OWNER_ACCESS_COOKIE,
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1800,
        expires=1800,
        secure=True,
        samesite="lax"
    )
    response.set_cookie(
        key=OWNER_REFRESH_COOKIE,
        value=f"Bearer {refresh_token}",
        httponly=True,
        max_age=604800,
        expires=604800,
        secure=True,
        samesite="lax"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/register/user", response_model=UserOut)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
):
    return AuthService.create_user(db, user_in.model_dump())

@router.post("/register/owner", response_model=RestaurantOwnerOut)
def register_owner(
    owner_in: RestaurantOwnerCreate,
    db: Session = Depends(deps.get_db)
):
    return AuthService.create_owner(db, owner_in.model_dump())

@router.post("/logout/user")
def logout_user(response: Response):
    response.delete_cookie(USER_ACCESS_COOKIE)
    response.delete_cookie(USER_REFRESH_COOKIE)
    return {"detail": "Successfully logged out"}

@router.post("/logout/owner")
def logout_owner(response: Response):
    response.delete_cookie(OWNER_ACCESS_COOKIE)
    response.delete_cookie(OWNER_REFRESH_COOKIE)
    return {"detail": "Successfully logged out"}

@router.get("/user/me", response_model=UserOut)
async def read_user_me(
    request: Request,
    db: Session = Depends(deps.get_db),
    access_token: Optional[str] = Cookie(None, alias=USER_ACCESS_COOKIE)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
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
            raise HTTPException(status_code=401, detail="User not found")
            
        return UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active
        )
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/owner/me", response_model=RestaurantOwnerOut)
async def read_owner_me(
    request: Request,
    db: Session = Depends(deps.get_db),
    access_token: Optional[str] = Cookie(None, alias=OWNER_ACCESS_COOKIE)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
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
            raise HTTPException(status_code=401, detail="Owner not found")
            
        return RestaurantOwnerOut(
            id=owner.id,
            email=owner.email,
            full_name=owner.full_name,
            is_active=owner.is_active
        )
            
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
async def refresh_token(
    response: Response,
    owner_refresh_token: str = Cookie(None, alias=OWNER_REFRESH_COOKIE),
    owner_access_token: str = Cookie(None, alias=OWNER_ACCESS_COOKIE),
    user_refresh_token: str = Cookie(None, alias=USER_REFRESH_COOKIE),
    db: Session = Depends(deps.get_db)
):
    """
    Refresh access token using refresh token
    """
    try:
        # Check which refresh token is present
        if owner_refresh_token:
            print(0)
            if not owner_access_token:
                print(1)
                if owner_refresh_token.startswith('Bearer '):
                    owner_refresh_token = owner_refresh_token[7:]
                # Verify owner refresh token
                payload = jwt.decode(
                    owner_refresh_token, 
                    settings.JWT_SECRET_KEY, 
                    algorithms=[settings.JWT_ALGORITHM]
                )
                token_data = TokenPayload(**payload)
                
                owner = db.query(RestaurantOwner).filter(RestaurantOwner.id == token_data.sub).first()
                if not owner:
                    raise HTTPException(status_code=404, detail="Owner not found")
                
                # Create new tokens
                owner_access_token = create_access_token({
                    "sub": str(owner.id),
                    "type": "owner"
                })
                
                # Set owner cookies
                response.set_cookie(
                    key=OWNER_ACCESS_COOKIE,
                    value=f"Bearer {owner_access_token}",
                    httponly=True,
                    max_age=1800,
                    expires=1800,
                    secure=True,
                    samesite="lax"
                )
                
                return {"type": "owner", "access_token": owner_access_token}
            
        if user_refresh_token:
            print(2)
            if user_refresh_token.startswith('Bearer '):
                user_refresh_token = user_refresh_token[7:]
            
            # Verify user refresh token
            payload = jwt.decode(
                user_refresh_token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            token_data = TokenPayload(**payload)
            
            user = db.query(User).filter(User.id == token_data.sub).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Create new tokens
            user_access_token = create_access_token({
                "sub": str(user.id),
                "type": "user"
            })
            
            # Set owner cookies
            response.set_cookie(
                key=USER_ACCESS_COOKIE,
                value=f"Bearer {user_access_token}",
                httponly=True,
                max_age=1800,
                expires=1800,
                secure=True,
                samesite="lax"
            )
            
            return {"type": "user", "access_token": user_access_token}
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
            
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
