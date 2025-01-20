from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, time, date
from uuid import UUID
import json

from app.api import deps
from app.services.restaurant import (
    RestaurantService, TableService, TimeSlotService, BookingService
)
from app.schemas.restaurant import (
    RestaurantCreate, RestaurantUpdate, RestaurantOut,
    TableCreate, TableOut,
    TimeSlotCreate, TimeSlotOut,
    BookingCreate, BookingOut,
    RestaurantSearch,
    TableUpdate,
    TableWithStatus
)
from app.models.user import User, RestaurantOwner
from app.models.restaurant import CuisineType, LocationEnum

router = APIRouter()

# Restaurant endpoints
@router.post("/", response_model=RestaurantOut)
def create_restaurant(
    *,
    db: Session = Depends(deps.get_db),
    restaurant_in: RestaurantCreate,
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
) -> Any:
    """
    Create new restaurant.
    """
    restaurant = RestaurantService.create_restaurant(
        db=db,
        owner_id=current_owner.id,
        restaurant_data=restaurant_in.model_dump()
    )
    return restaurant

@router.get("/search", response_model=List[RestaurantOut])
def search_restaurants(
    query: Optional[str] = None,
    location: Optional[LocationEnum] = None,
    cuisine_types: Optional[str] = None,  # Will receive as JSON string
    is_vegetarian: Optional[bool] = None,
    min_cost: Optional[float] = None,
    max_cost: Optional[float] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(deps.get_db),
) -> Any:
    # Parse cuisine types from JSON string
    parsed_cuisine_types = None
    if cuisine_types:
        try:
            parsed_cuisine_types = [CuisineType(ct) for ct in json.loads(cuisine_types)]
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Invalid cuisine types format"
            )

    restaurants = RestaurantService.search_restaurants(
        db=db,
        query=query,
        location=location,
        cuisine_types=parsed_cuisine_types,
        is_vegetarian=is_vegetarian,
        min_cost=min_cost,
        max_cost=max_cost,
        min_rating=min_rating,
    )
    return restaurants

# Table endpoints
@router.post("/{restaurant_id}/tables", response_model=TableOut)
def create_table(
    restaurant_id: UUID,
    table_in: TableCreate,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return TableService.create_table(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_owner.id,
        table_data=table_in.model_dump()
    )

@router.put("/{restaurant_id}/tables/{table_id}", response_model=TableOut)
def update_table(
    restaurant_id: UUID,
    table_id: UUID,
    table_in: TableUpdate,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return TableService.update_table(
        db=db,
        restaurant_id=restaurant_id,
        table_id=table_id,
        owner_id=current_owner.id,
        table_data=table_in.model_dump(exclude_unset=True)
    )

# TimeSlot endpoints
@router.post("/{restaurant_id}/slots", response_model=TimeSlotOut)
def create_slot(
    restaurant_id: UUID,
    date: datetime = Query(..., description="Date for the time slot"),
    start_time: str = Query(..., description="Start time in HH:MM format"),
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    # Convert start_time string to time object
    try:
        time_parts = start_time.split(':')
        start_time_obj = time(int(time_parts[0]), int(time_parts[1]))
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Please use HH:MM format"
        )

    return TimeSlotService.create_slot(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_owner.id,
        date=date,
        start_time=start_time_obj
    )

# Booking endpoints
@router.get("/bookings", response_model=List[BookingOut])
def get_user_bookings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all bookings for the current user"""
    return BookingService.get_user_bookings(db, current_user.id)

# Restaurant-specific routes
@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(
    restaurant_id: UUID,
    db: Session = Depends(deps.get_db)
):
    restaurant = RestaurantService.get_restaurant(db, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    return restaurant

@router.post("/{restaurant_id}/bookings", response_model=BookingOut)
def create_booking(
    restaurant_id: UUID,
    booking_in: BookingCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create a new booking"""
    booking_data = booking_in.model_dump()
    booking_data["restaurant_id"] = restaurant_id
    return BookingService.create_booking(
        db=db,
        user_id=current_user.id,
        booking_data=booking_data
    )

# Get owner's restaurants
@router.get("/owner/me", response_model=List[RestaurantOut])
def get_owner_restaurants(
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return RestaurantService.get_owner_restaurants(db, current_owner.id)

# Get restaurant's available slots
@router.get("/{restaurant_id}/available-slots", response_model=List[TimeSlotOut])
def get_available_slots(
    restaurant_id: UUID,
    date: datetime = Query(..., description="Date to get slots for"),
    db: Session = Depends(deps.get_db)
):
    slots = TimeSlotService.get_available_slots(db, restaurant_id, date)
    return slots

# Get restaurant's tables
@router.get("/{restaurant_id}/tables", response_model=List[TableOut])
def get_restaurant_tables(
    restaurant_id: UUID,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return TableService.get_restaurant_tables(db, restaurant_id, current_owner.id)

# Get restaurant's bookings (for restaurant owner)
@router.get("/{restaurant_id}/bookings", response_model=List[BookingOut])
def get_restaurant_bookings(
    restaurant_id: UUID,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return BookingService.get_restaurant_bookings(db, restaurant_id, current_owner.id)

# Update booking status
@router.patch("/bookings/{booking_id}", response_model=BookingOut)
def update_booking_status(
    booking_id: UUID,
    status: str,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return BookingService.update_booking_status(db, booking_id, status, current_owner.id)

# Delete slot
@router.delete("/{restaurant_id}/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(
    restaurant_id: UUID,
    slot_id: UUID,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    TimeSlotService.delete_slot(
        db=db,
        restaurant_id=restaurant_id,
        slot_id=slot_id,
        owner_id=current_owner.id
    )

# Delete table
@router.delete("/{restaurant_id}/tables/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(
    restaurant_id: UUID,
    table_id: UUID,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    TableService.delete_table(
        db=db,
        restaurant_id=restaurant_id,
        table_id=table_id,
        owner_id=current_owner.id
    )

@router.post("/{restaurant_id}/timeslots/{time_slot_id}/tables/{table_id}/admin-reserve")
def admin_reserve_table(
    restaurant_id: UUID,
    time_slot_id: UUID,
    table_id: UUID,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    return TableService.admin_reserve_table(
        db=db,
        restaurant_id=restaurant_id,
        time_slot_id=time_slot_id,
        table_id=table_id,
        owner_id=current_owner.id
    )

@router.patch("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant_status(
    restaurant_id: UUID,
    update_data: dict,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
) -> Any:
    restaurant = RestaurantService.update_restaurant_status(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_owner.id,
        is_active=update_data.get("is_active")
    )
    return restaurant

@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: UUID,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
) -> Any:
    restaurant = RestaurantService.update_restaurant(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_owner.id,
        restaurant_data=restaurant_data
    )
    return restaurant

@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(
    restaurant_id: UUID,
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    RestaurantService.delete_restaurant(
        db=db,
        restaurant_id=restaurant_id,
        owner_id=current_owner.id
    )

@router.get(
    "/{restaurant_id}/timeslots/{timeslot_id}/available-tables",
    response_model=List[TableOut]
)
def get_available_tables(
    restaurant_id: UUID,
    timeslot_id: UUID,
    guests: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Get available tables for a specific time slot with sufficient capacity"""
    tables = RestaurantService.get_available_tables(
        db=db,
        restaurant_id=restaurant_id,
        timeslot_id=timeslot_id,
        min_capacity=guests
    )
    return tables

@router.get("/{restaurant_id}/timeslots/{timeslot_id}", response_model=TimeSlotOut)
def get_timeslot(
    restaurant_id: UUID,
    timeslot_id: UUID,
    db: Session = Depends(deps.get_db)
):
    """Get specific time slot details"""
    time_slot = TimeSlotService.get_timeslot(db, restaurant_id, timeslot_id)
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    return time_slot

@router.get("/{restaurant_id}/timeslots/{time_slot_id}/tables", response_model=List[TableWithStatus])
def get_tables_for_timeslot(
    restaurant_id: UUID,
    time_slot_id: UUID,
    date: date = Query(default=date.today()),
    db: Session = Depends(deps.get_db),
    current_owner: RestaurantOwner = Depends(deps.get_current_owner)
):
    """Get all tables with their status for a specific time slot"""
    return TableService.get_tables_with_status(
        db=db,
        restaurant_id=restaurant_id,
        time_slot_id=time_slot_id,
        date=date
    )
