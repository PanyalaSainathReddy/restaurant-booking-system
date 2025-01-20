from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, time, timedelta, date
from uuid import UUID
from sqlalchemy import and_
from sqlalchemy.orm import joinedload

from app.models.restaurant import (
    Restaurant, Table, TimeSlot, Booking, TableAllocation,
    CuisineType, LocationEnum
)
from app.schemas.restaurant import RestaurantSearch, RestaurantUpdate
from app.models.user import User

class RestaurantService:
    @staticmethod
    def create_restaurant(db: Session, owner_id: UUID, restaurant_data: dict) -> Restaurant:
        db_restaurant = Restaurant(owner_id=owner_id, **restaurant_data)
        db.add(db_restaurant)
        db.commit()
        db.refresh(db_restaurant)
        return db_restaurant

    @staticmethod
    def update_restaurant(
        db: Session,
        restaurant_id: UUID,
        owner_id: UUID,
        restaurant_data: RestaurantUpdate
    ) -> Restaurant:
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Update restaurant fields
        for key, value in restaurant_data.model_dump(exclude_unset=True).items():
            setattr(restaurant, key, value)

        db.commit()
        db.refresh(restaurant)
        return restaurant

    @staticmethod
    def search_restaurants(
        db: Session,
        query: Optional[str] = None,
        location: Optional[LocationEnum] = None,
        cuisine_types: Optional[List[CuisineType]] = None,
        is_vegetarian: Optional[bool] = None,
        min_cost: Optional[float] = None,
        max_cost: Optional[float] = None,
        min_rating: Optional[float] = None,
    ) -> List[Restaurant]:
        """Search restaurants based on various filters"""
        restaurants_query = db.query(Restaurant).filter(Restaurant.is_active == True)

        if query:
            restaurants_query = restaurants_query.filter(
                Restaurant.name.ilike(f"%{query}%")
            )

        if location:
            restaurants_query = restaurants_query.filter(
                Restaurant.location == location
            )

        if cuisine_types:
            restaurants_query = restaurants_query.filter(
                Restaurant.cuisine_types.contains(cuisine_types)
            )

        if is_vegetarian is not None:
            restaurants_query = restaurants_query.filter(
                Restaurant.is_vegetarian == is_vegetarian
            )

        if min_cost is not None:
            restaurants_query = restaurants_query.filter(
                Restaurant.cost_for_two >= min_cost
            )

        if max_cost is not None:
            restaurants_query = restaurants_query.filter(
                Restaurant.cost_for_two <= max_cost
            )

        if min_rating is not None:
            restaurants_query = restaurants_query.filter(
                Restaurant.rating >= min_rating
            )

        return restaurants_query.all()

    @staticmethod
    def get_restaurant(db: Session, restaurant_id: UUID) -> Optional[Restaurant]:
        return db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()

    @staticmethod
    def get_owner_restaurants(db: Session, owner_id: UUID) -> List[Restaurant]:
        return db.query(Restaurant).filter(Restaurant.owner_id == owner_id).all()

    @staticmethod
    def update_restaurant_status(
        db: Session,
        restaurant_id: UUID,
        owner_id: UUID,
        is_active: bool
    ) -> Restaurant:
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        restaurant.is_active = is_active
        db.commit()
        db.refresh(restaurant)
        return restaurant

    @staticmethod
    def delete_restaurant(
        db: Session,
        restaurant_id: UUID,
        owner_id: UUID
    ):
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Delete associated tables and time slots first
        db.query(Table).filter(Table.restaurant_id == restaurant_id).delete()
        db.query(TimeSlot).filter(TimeSlot.restaurant_id == restaurant_id).delete()
        
        # Delete the restaurant
        db.delete(restaurant)
        db.commit()

    @staticmethod
    def get_available_tables(
        db: Session,
        restaurant_id: UUID,
        timeslot_id: UUID,
        min_capacity: int,
    ) -> List[Table]:
        """Get available tables with sufficient capacity"""
        # Get tables that:
        # 1. Have sufficient capacity
        # 2. Are not admin reserved
        # 3. Don't have any allocations for this time slot
        return (
            db.query(Table)
            .outerjoin(TableAllocation, and_(
                TableAllocation.table_id == Table.id,
                TableAllocation.time_slot_id == timeslot_id
            ))
            .filter(
                Table.restaurant_id == restaurant_id,
                Table.capacity >= min_capacity,
                Table.is_admin_reserved == False,
                TableAllocation.id == None  # This ensures no allocation exists
            )
            .all()
        )

class TableService:
    @staticmethod
    def create_table(
        db: Session, 
        restaurant_id: UUID, 
        owner_id: UUID, 
        table_data: dict
    ) -> Table:
        # Add logging to debug
        print("Received table data:", table_data)
        
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Create table with explicit field mapping
        table = Table(
            restaurant_id=restaurant_id,
            table_number=table_data["table_number"],
            capacity=table_data["capacity"]
        )
        
        # Add logging to debug
        print("Created table object:", table.table_number, table.capacity)
        
        db.add(table)
        db.commit()
        db.refresh(table)
        
        return table

    @staticmethod
    def get_restaurant_tables(db: Session, restaurant_id: UUID, owner_id: UUID) -> List[Table]:
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        return db.query(Table).filter(Table.restaurant_id == restaurant_id).all()

    @staticmethod
    def delete_table(
        db: Session,
        restaurant_id: UUID,
        table_id: UUID,
        owner_id: UUID,
    ) -> None:
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Get the table
        table = db.query(Table).filter(
            Table.id == table_id,
            Table.restaurant_id == restaurant_id
        ).first()

        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )

        # Check if table has any allocations
        has_allocations = db.query(TableAllocation).filter(
            TableAllocation.table_id == table_id
        ).first() is not None

        if has_allocations:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete table with existing bookings"
            )

        # Delete the table
        db.delete(table)
        db.commit()

    @staticmethod
    def update_table(
        db: Session,
        restaurant_id: UUID,
        table_id: UUID,
        owner_id: UUID,
        table_data: dict
    ) -> Table:
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Get the table
        table = db.query(Table).filter(
            Table.id == table_id,
            Table.restaurant_id == restaurant_id
        ).first()

        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )

        # Update table fields
        for key, value in table_data.items():
            setattr(table, key, value)

        db.commit()
        db.refresh(table)
        return table

    @staticmethod
    def admin_reserve_table(
        db: Session,
        restaurant_id: UUID,
        time_slot_id: UUID,
        table_id: UUID,
        owner_id: UUID,
    ) -> Table:
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Get the time slot
        time_slot = db.query(TimeSlot).filter(
            TimeSlot.id == time_slot_id,
            TimeSlot.restaurant_id == restaurant_id
        ).first()

        if not time_slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time slot not found"
            )

        # Get the table
        table = db.query(Table).filter(
            Table.id == table_id,
            Table.restaurant_id == restaurant_id
        ).first()

        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )

        # Check if table is already booked or admin reserved
        if table.is_admin_reserved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table is already reserved by admin"
            )

        # Check if table has any bookings for this time slot
        existing_allocation = db.query(TableAllocation).filter(
            TableAllocation.table_id == table_id,
            TableAllocation.time_slot_id == time_slot_id
        ).first()

        if existing_allocation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table is already booked for this time slot"
            )

        # Create table allocation for admin reservation
        allocation = TableAllocation(
            table_id=table_id,
            time_slot_id=time_slot_id
        )
        db.add(allocation)

        # Set admin reservation
        table.is_admin_reserved = True
        db.commit()
        db.refresh(table)

        return table

    @staticmethod
    def get_tables_with_status(
        db: Session,
        restaurant_id: UUID,
        time_slot_id: UUID,
        date: date = date.today()
    ) -> List[Dict]:
        """Get all tables with their booking status for a specific time slot and date"""
        tables = (
            db.query(Table)
            .outerjoin(
                TableAllocation,
                and_(
                    Table.id == TableAllocation.table_id,
                    TableAllocation.time_slot_id == time_slot_id
                )
            )
            .outerjoin(
                Booking,
                and_(
                    TableAllocation.booking_id == Booking.id,
                    Booking.date == date,
                    Booking.status == "confirmed"
                )
            )
            .outerjoin(User, User.id == Booking.user_id)
            .outerjoin(TimeSlot, TimeSlot.id == Booking.time_slot_id)
            .filter(Table.restaurant_id == restaurant_id)
            .with_entities(
                Table,
                TableAllocation.id.isnot(None).label('is_admin_reserved'),
                Booking.id.isnot(None).label('is_booked'),
                User.full_name.label('customer_name'),
                User.email.label('customer_email'),
                TimeSlot.start_time.label('booking_time'),
                Booking.number_of_guests
            )
            .all()
        )

        result = []
        for (table, is_admin_reserved, is_booked, customer_name, 
             customer_email, booking_time, number_of_guests) in tables:
            table_dict = {
                "id": str(table.id),
                "restaurant_id": str(restaurant_id),
                "table_number": table.table_number,
                "capacity": table.capacity,
                "is_active": True,
                "time_slot_id": str(time_slot_id),
                "is_admin_reserved": bool(is_admin_reserved),
                "is_booked": bool(is_booked),
                "created_at": table.created_at,
                "updated_at": table.updated_at
            }
            
            if is_booked:
                table_dict["booking_details"] = {
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "booking_time": booking_time.strftime("%H:%M") if booking_time else None,
                    "number_of_guests": number_of_guests
                }
            
            result.append(table_dict)
        
        return result

class TimeSlotService:
    @staticmethod
    def create_slots(
        db: Session,
        restaurant_id: UUID,
        owner_id: UUID,
        date: datetime,
        slot_duration: int = 60  # minutes
    ) -> List[TimeSlot]:
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        slots = []
        current_time = datetime.combine(date.date(), restaurant.opening_time)
        closing_time = datetime.combine(date.date(), restaurant.closing_time)

        while current_time + timedelta(minutes=slot_duration) <= closing_time:
            slot = TimeSlot(
                restaurant_id=restaurant_id,
                date=date,
                start_time=current_time.time(),
                end_time=(current_time + timedelta(minutes=slot_duration)).time()
            )
            slots.append(slot)
            current_time += timedelta(minutes=slot_duration)

        db.add_all(slots)
        db.commit()
        for slot in slots:
            db.refresh(slot)
        
        return slots

    @staticmethod
    def get_available_slots(db: Session, restaurant_id: UUID, date: datetime) -> List[TimeSlot]:
        # Convert date to start and end of day to get all slots for that day
        start_of_day = datetime.combine(date.date(), time.min)
        end_of_day = datetime.combine(date.date(), time.max)
        
        return db.query(TimeSlot).filter(
            TimeSlot.restaurant_id == restaurant_id,
            TimeSlot.date >= start_of_day,
            TimeSlot.date < end_of_day
        ).order_by(TimeSlot.start_time).all()

    @staticmethod
    def create_slot(
        db: Session,
        restaurant_id: UUID,
        owner_id: UUID,
        date: datetime,
        start_time: time,
        slot_duration: int = 60  # minutes
    ) -> TimeSlot:
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Calculate end time
        start_datetime = datetime.combine(date.date(), start_time)
        end_datetime = start_datetime + timedelta(minutes=slot_duration)
        end_time = end_datetime.time()

        # Verify if the slot is within restaurant operating hours
        if (start_time < restaurant.opening_time or 
            end_time > restaurant.closing_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time slot must be within restaurant operating hours"
            )

        # Check if slot already exists
        existing_slot = db.query(TimeSlot).filter(
            TimeSlot.restaurant_id == restaurant_id,
            TimeSlot.date == date,
            TimeSlot.start_time == start_time
        ).first()

        if existing_slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time slot already exists"
            )

        # Create new slot
        slot = TimeSlot(
            restaurant_id=restaurant_id,
            date=date,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )

        db.add(slot)
        db.commit()
        db.refresh(slot)
        
        return slot

    @staticmethod
    def delete_slot(
        db: Session,
        restaurant_id: UUID,
        slot_id: UUID,
        owner_id: UUID,
    ) -> None:
        # Verify restaurant ownership
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )

        # Get the time slot
        slot = db.query(TimeSlot).filter(
            TimeSlot.id == slot_id,
            TimeSlot.restaurant_id == restaurant_id
        ).first()

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time slot not found"
            )

        # Check if the slot has any bookings
        has_bookings = db.query(Booking).filter(
            Booking.time_slot_id == slot_id
        ).first() is not None

        if has_bookings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete time slot with existing bookings"
            )

        # Delete the time slot
        db.delete(slot)
        db.commit()

    @staticmethod
    def get_timeslot(
        db: Session,
        restaurant_id: UUID,
        timeslot_id: UUID,
    ) -> Optional[TimeSlot]:
        """Get a specific time slot"""
        return db.query(TimeSlot).filter(
            TimeSlot.restaurant_id == restaurant_id,
            TimeSlot.id == timeslot_id
        ).first()

    @staticmethod
    def get_tables_with_status(
        db: Session,
        restaurant_id: UUID,
        time_slot_id: UUID,
        date: date = date.today()
    ) -> List[Table]:
        """Get all tables with their booking status for a specific time slot and date"""
        tables = (
            db.query(Table)
            .outerjoin(
                TableAllocation,
                and_(
                    Table.id == TableAllocation.table_id,
                    TableAllocation.time_slot_id == time_slot_id
                )
            )
            .outerjoin(
                Booking,
                and_(
                    TableAllocation.booking_id == Booking.id,
                    Booking.date == date,
                    Booking.status == "confirmed"
                )
            )
            .filter(Table.restaurant_id == restaurant_id)
            .with_entities(
                Table,
                TableAllocation.id.isnot(None).label('is_admin_reserved'),
                Booking.id.isnot(None).label('is_booked'),
                Booking
            )
            .all()
        )

        result = []
        for table, is_admin_reserved, is_booked, booking in tables:
            table_dict = {
                "id": str(table.id),
                "table_number": table.table_number,
                "capacity": table.capacity,
                "time_slot_id": str(time_slot_id),
                "is_admin_reserved": bool(is_admin_reserved),
                "is_booked": bool(is_booked)
            }
            
            if booking:
                table_dict["booking_details"] = {
                    "customer_name": booking.user.name,
                    "customer_email": booking.user.email,
                    "booking_time": booking.time_slot.start_time.strftime("%H:%M"),
                    "number_of_guests": booking.number_of_guests
                }
            
            result.append(table_dict)
        
        return result

class BookingService:
    @staticmethod
    def create_booking(
        db: Session,
        user_id: UUID,
        booking_data: dict
    ) -> Booking:
        """Create a new booking"""
        # Verify the time slot exists and is available
        time_slot = db.query(TimeSlot).filter(
            TimeSlot.id == booking_data["time_slot_id"],
            TimeSlot.restaurant_id == booking_data["restaurant_id"]
        ).first()
        
        if not time_slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time slot not found"
            )

        # Verify the table exists and is available
        table = db.query(Table).filter(
            Table.id == booking_data["table_id"],
            Table.restaurant_id == booking_data["restaurant_id"]
        ).first()

        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )

        # Check if table is already booked for this time slot
        existing_allocation = db.query(TableAllocation).filter(
            TableAllocation.table_id == booking_data["table_id"],
            TableAllocation.time_slot_id == booking_data["time_slot_id"]
        ).first()

        if existing_allocation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table is already booked for this time slot"
            )

        try:
            # Create booking first
            booking = Booking(
                user_id=user_id,
                restaurant_id=booking_data["restaurant_id"],
                time_slot_id=booking_data["time_slot_id"],
                table_id=booking_data["table_id"],
                number_of_guests=booking_data["number_of_guests"],
                date=booking_data["date"],
                status="confirmed"
            )
            db.add(booking)
            db.flush()  # This assigns the ID to the booking

            # Create table allocation with booking reference
            allocation = TableAllocation(
                booking_id=booking.id,
                table_id=booking_data["table_id"],
                time_slot_id=booking_data["time_slot_id"]
            )
            db.add(allocation)
            
            db.commit()
            db.refresh(booking)
            return booking
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

    @staticmethod
    def get_user_bookings(db: Session, user_id: UUID) -> List[Booking]:
        """Get all bookings for a user"""
        return (
            db.query(Booking)
            .filter(Booking.user_id == user_id)
            .order_by(Booking.date.desc(), Booking.created_at.desc())
            .all()
        )

    @staticmethod
    def get_restaurant_bookings(
        db: Session, 
        restaurant_id: UUID, 
        owner_id: UUID
    ) -> List[Booking]:
        restaurant = db.query(Restaurant).filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id
        ).first()
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found"
            )
        return db.query(Booking).filter(Booking.restaurant_id == restaurant_id).all()

    @staticmethod
    def update_booking_status(
        db: Session,
        booking_id: UUID,
        status: str,
        owner_id: UUID
    ) -> Booking:
        booking = db.query(Booking).join(Restaurant).filter(
            Booking.id == booking_id,
            Restaurant.owner_id == owner_id
        ).first()
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        booking.status = status
        db.commit()
        db.refresh(booking)
        return booking
