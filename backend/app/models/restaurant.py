from sqlalchemy import Boolean, Column, String, DateTime, Float, Time, ForeignKey, Integer, Enum, Index, Date
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.core.database import Base

class CuisineType(str, enum.Enum):
    INDIAN = "Indian"
    CHINESE = "Chinese"
    ITALIAN = "Italian"
    MEXICAN = "Mexican"
    JAPANESE = "Japanese"
    THAI = "Thai"
    AMERICAN = "American"

class LocationEnum(str, enum.Enum):
    BANGALORE = "Bangalore"
    MUMBAI = "Mumbai"
    DELHI = "Delhi"
    HYDERABAD = "Hyderabad"
    CHENNAI = "Chennai"

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    cuisine_types = Column(ARRAY(Enum(CuisineType)), nullable=False)
    rating = Column(Float, default=0.0)
    cost_for_two = Column(Integer, nullable=False)
    image_url = Column(String)
    is_vegetarian = Column(Boolean, default=False)
    location = Column(Enum(LocationEnum), nullable=False)
    opening_time = Column(Time, nullable=False)
    closing_time = Column(Time, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("restaurant_owners.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("RestaurantOwner", back_populates="restaurants")
    tables = relationship("Table", back_populates="restaurant", cascade="all, delete-orphan")
    time_slots = relationship("TimeSlot", back_populates="restaurant", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="restaurant")

class Table(Base):
    __tablename__ = "tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"))
    table_number = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin_reserved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="tables")
    allocations = relationship("TableAllocation", back_populates="table")
    bookings = relationship("Booking", back_populates="table")

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"))
    date = Column(DateTime, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="time_slots")
    allocations = relationship("TableAllocation", back_populates="time_slot")
    bookings = relationship("Booking", back_populates="time_slot")

    # Add index for common queries
    __table_args__ = (
        Index('idx_timeslot_restaurant_date', 'restaurant_id', 'date', 'is_available'),
    )

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"))
    time_slot_id = Column(UUID(as_uuid=True), ForeignKey("time_slots.id"))
    table_id = Column(UUID(as_uuid=True), ForeignKey("tables.id"))
    number_of_guests = Column(Integer)
    date = Column(Date)
    status = Column(String)  # confirmed, cancelled, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bookings")
    restaurant = relationship("Restaurant", back_populates="bookings")
    time_slot = relationship("TimeSlot", back_populates="bookings")
    table = relationship("Table", back_populates="bookings")
    table_allocation = relationship("TableAllocation", back_populates="booking", uselist=False)

class TableAllocation(Base):
    __tablename__ = "table_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    table_id = Column(UUID(as_uuid=True), ForeignKey("tables.id"))
    time_slot_id = Column(UUID(as_uuid=True), ForeignKey("time_slots.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="table_allocation")
    table = relationship("Table", back_populates="allocations")
    time_slot = relationship("TimeSlot", back_populates="allocations")
