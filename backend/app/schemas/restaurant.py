from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, time, date
from uuid import UUID
from enum import Enum

# Enums (matching the model enums)
class CuisineType(str, Enum):
    INDIAN = "Indian"
    CHINESE = "Chinese"
    ITALIAN = "Italian"
    MEXICAN = "Mexican"
    JAPANESE = "Japanese"
    THAI = "Thai"
    AMERICAN = "American"

class LocationEnum(str, Enum):
    BANGALORE = "Bangalore"
    MUMBAI = "Mumbai"
    DELHI = "Delhi"
    HYDERABAD = "Hyderabad"
    CHENNAI = "Chennai"

# Restaurant Schemas
class RestaurantBase(BaseModel):
    name: str
    description: str | None = None
    cuisine_types: List[CuisineType]
    cost_for_two: int
    image_url: str | None = None
    is_vegetarian: bool = False
    location: LocationEnum
    opening_time: time
    closing_time: time

class RestaurantCreate(RestaurantBase):
    pass

class Restaurant(RestaurantBase):
    id: UUID
    rating: float = 0.0
    owner_id: UUID

    class Config:
        from_attributes = True

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[LocationEnum] = None
    cuisine_types: Optional[List[CuisineType]] = None
    image_url: str | None = None
    is_vegetarian: Optional[bool] = None
    cost_for_two: Optional[float] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    is_active: Optional[bool] = None

class RestaurantOut(RestaurantBase):
    id: UUID
    owner_id: UUID
    rating: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Table Schemas
class TableBase(BaseModel):
    table_number: str
    capacity: int

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

class TableOut(TableBase):
    id: UUID
    restaurant_id: UUID
    is_active: bool
    is_admin_reserved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# TimeSlot Schemas
class TimeSlotBase(BaseModel):
    date: datetime
    start_time: time
    end_time: time

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotUpdate(BaseModel):
    is_available: Optional[bool] = None

class TimeSlotOut(TimeSlotBase):
    id: UUID
    restaurant_id: UUID
    is_available: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Booking Schemas
class BookingBase(BaseModel):
    number_of_people: int

class BookingCreate(BaseModel):
    time_slot_id: UUID
    table_id: UUID
    number_of_guests: int
    date: date

class BookingUpdate(BaseModel):
    status: str

class RestaurantForBooking(BaseModel):
    id: UUID
    name: str
    location: LocationEnum
    
    class Config:
        from_attributes = True

class TimeSlotForBooking(BaseModel):
    start_time: time
    end_time: time
    
    class Config:
        from_attributes = True

class TableForBooking(BaseModel):
    table_number: str
    capacity: int
    
    class Config:
        from_attributes = True

class BookingOut(BaseModel):
    id: UUID
    restaurant: RestaurantForBooking
    time_slot: TimeSlotForBooking
    table: TableForBooking
    number_of_guests: int
    date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Search Schemas
class RestaurantSearch(BaseModel):
    query: Optional[str] = None
    location: Optional[LocationEnum] = None
    cuisine_types: Optional[List[CuisineType]] = None
    is_vegetarian: Optional[bool] = None
    min_cost: Optional[float] = None
    max_cost: Optional[float] = None
    min_rating: Optional[float] = None

class BookingDetails(BaseModel):
    customer_name: str
    customer_email: str
    booking_time: str
    number_of_guests: int

    class Config:
        from_attributes = True

class TableWithStatus(BaseModel):
    id: UUID
    restaurant_id: UUID
    table_number: str
    capacity: int
    is_active: bool = True
    is_admin_reserved: bool
    is_booked: bool
    time_slot_id: UUID
    booking_details: Optional[BookingDetails] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
