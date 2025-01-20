from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool

    class Config:
        from_attributes = True

class RestaurantOwnerCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class RestaurantOwnerLogin(BaseModel):
    email: EmailStr
    password: str

class RestaurantOwnerOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool

    class Config:
        from_attributes = True
