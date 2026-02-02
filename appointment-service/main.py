"""
╔════════════════════════════════════════════════════════════════╗
║   🗓️  DATAVET APPOINTMENT SERVICE  🗓️                          ║
║   FastAPI-based appointment scheduling microservice            ║
╚════════════════════════════════════════════════════════════════╝
"""

import os
import json
import logging
from datetime import datetime, date, time, timedelta
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Date, Time, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./appointments.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
kafka_producer = None


# ═══════════════════════════════════════════════════════════════
# DATABASE MODELS
# ═══════════════════════════════════════════════════════════════

class AppointmentDB(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, nullable=False, index=True)
    vet_id = Column(Integer, nullable=False, index=True)
    date = Column(String, nullable=False, index=True)
    time = Column(String, nullable=False)
    end_time = Column(String, nullable=True)
    appointment_type = Column(String, nullable=False)
    status = Column(String, default="SCHEDULED")
    notes = Column(Text, nullable=True)
    pet_name = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ═══════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════

class AppointmentBase(BaseModel):
    pet_id: int = Field(..., alias="petId")
    vet_id: int = Field(1, alias="vetId")
    date: str
    time: str
    end_time: Optional[str] = Field(None, alias="endTime")
    appointment_type: str = Field(..., alias="appointmentType")
    notes: Optional[str] = None
    status: str = "SCHEDULED"
    pet_name: Optional[str] = Field(None, alias="petName")
    owner_name: Optional[str] = Field(None, alias="ownerName")
    
    class Config:
        populate_by_name = True


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    pet_id: Optional[int] = Field(None, alias="petId")
    vet_id: Optional[int] = Field(None, alias="vetId")
    date: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = Field(None, alias="endTime")
    appointment_type: Optional[str] = Field(None, alias="appointmentType")
    notes: Optional[str] = None
    status: Optional[str] = None
    pet_name: Optional[str] = Field(None, alias="petName")
    owner_name: Optional[str] = Field(None, alias="ownerName")
    
    class Config:
        populate_by_name = True


class AppointmentResponse(BaseModel):
    id: int
    petId: int
    vetId: int
    date: str
    time: str
    endTime: Optional[str] = None
    appointmentType: str
    status: str
    notes: Optional[str] = None
    petName: Optional[str] = None
    ownerName: Optional[str] = None
    createdAt: Optional[str] = None
    
    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    time: str
    endTime: str
    available: bool
    appointmentId: Optional[int] = None
    petName: Optional[str] = None
    appointmentType: Optional[str] = None


class CalendarDay(BaseModel):
    date: str
    dayOfWeek: str
    slots: List[TimeSlot]
    totalSlots: int
    bookedSlots: int
    availableSlots: int


# ═══════════════════════════════════════════════════════════════
# KAFKA PRODUCER
# ═══════════════════════════════════════════════════════════════

def init_kafka_producer():
    """Initialize Kafka producer with error handling."""
    global kafka_producer
    try:
        from kafka import KafkaProducer
        kafka_producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None
        )
        logger.info(f"Kafka producer connected to {KAFKA_BOOTSTRAP_SERVERS}")
    except Exception as e:
        logger.warning(f"Kafka not available: {e}. Events will not be published.")
        kafka_producer = None


def send_event(topic: str, key: str, event: dict):
    """Send event to Kafka topic."""
    if kafka_producer:
        try:
            kafka_producer.send(topic, key=key, value=event)
            kafka_producer.flush()
            logger.info(f"Sent event to {topic}: {event.get('eventType')}")
        except Exception as e:
            logger.warning(f"Failed to send event: {e}")


# ═══════════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🗓️  DATAVET APPOINTMENT SERVICE STARTING... 🗓️               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    """)
    Base.metadata.create_all(bind=engine)
    init_kafka_producer()
    load_sample_data()
    print("""
╔════════════════════════════════════════════════════════════════╗
║   🎮 APPOINTMENT SERVICE ONLINE - PORT 8081                    ║
║   Ready to schedule visits!                                    ║
╚════════════════════════════════════════════════════════════════╝
    """)
    yield
    # Shutdown
    if kafka_producer:
        kafka_producer.close()


app = FastAPI(
    title="DataVet Appointment Service",
    description="🗓️ Appointment scheduling microservice for DataVet",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def calculate_end_time(start_time: str, duration_minutes: int = 30) -> str:
    """Calculate end time from start time and duration."""
    hours, minutes = map(int, start_time.split(':'))
    start = datetime.now().replace(hour=hours, minute=minutes, second=0, microsecond=0)
    end = start + timedelta(minutes=duration_minutes)
    return end.strftime("%H:%M")


def generate_time_slots(start_hour: str, end_hour: str, slot_duration: int = 30) -> List[dict]:
    """Generate time slots for a day."""
    slots = []
    start_h, start_m = map(int, start_hour.split(':'))
    end_h, end_m = map(int, end_hour.split(':'))
    
    current = datetime.now().replace(hour=start_h, minute=start_m, second=0, microsecond=0)
    end = datetime.now().replace(hour=end_h, minute=end_m, second=0, microsecond=0)
    
    while current < end:
        slot_end = current + timedelta(minutes=slot_duration)
        if slot_end <= end:
            slots.append({
                "time": current.strftime("%H:%M"),
                "endTime": slot_end.strftime("%H:%M")
            })
        current = slot_end
    
    return slots


# ═══════════════════════════════════════════════════════════════
# SAMPLE DATA
# ═══════════════════════════════════════════════════════════════

def load_sample_data():
    """Load sample appointment data."""
    db = SessionLocal()
    try:
        if db.query(AppointmentDB).count() == 0:
            logger.info("Loading sample appointment data...")
            today = date.today().isoformat()
            tomorrow = (date.today() + timedelta(days=1)).isoformat()
            day_after = (date.today() + timedelta(days=2)).isoformat()
            
            sample_appointments = [
                AppointmentDB(pet_id=1, vet_id=1, date=today, time="09:00", end_time="09:30", 
                            appointment_type="CHECKUP", status="SCHEDULED", 
                            pet_name="Max", owner_name="John Smith", notes="Annual checkup"),
                AppointmentDB(pet_id=2, vet_id=1, date=today, time="10:00", end_time="10:30",
                            appointment_type="VACCINATION", status="SCHEDULED",
                            pet_name="Whiskers", owner_name="Jane Doe", notes="Rabies vaccine"),
                AppointmentDB(pet_id=3, vet_id=2, date=today, time="14:00", end_time="15:00",
                            appointment_type="SURGERY", status="SCHEDULED",
                            pet_name="Buddy", owner_name="Bob Wilson"),
                AppointmentDB(pet_id=4, vet_id=3, date=tomorrow, time="11:00", end_time="11:45",
                            appointment_type="DENTAL", status="SCHEDULED",
                            pet_name="Tweety", owner_name="Alice Brown", notes="Teeth cleaning"),
                AppointmentDB(pet_id=5, vet_id=1, date=tomorrow, time="15:30", end_time="16:00",
                            appointment_type="CHECKUP", status="SCHEDULED",
                            pet_name="Snowball", owner_name="Charlie Davis"),
                AppointmentDB(pet_id=6, vet_id=6, date=day_after, time="10:00", end_time="10:45",
                            appointment_type="CHECKUP", status="SCHEDULED",
                            pet_name="Nemo", owner_name="Eva Martinez", notes="Exotic fish checkup"),
                AppointmentDB(pet_id=7, vet_id=4, date=today, time="07:00", end_time="07:30",
                            appointment_type="EMERGENCY", status="COMPLETED",
                            pet_name="Rocky", owner_name="Frank Johnson", notes="Emergency visit"),
                AppointmentDB(pet_id=8, vet_id=5, date=tomorrow, time="09:00", end_time="09:30",
                            appointment_type="CHECKUP", status="SCHEDULED",
                            pet_name="Luna", owner_name="Grace Lee", notes="Skin allergy consultation"),
            ]
            
            for appt in sample_appointments:
                db.add(appt)
            db.commit()
            logger.info(f"Loaded {len(sample_appointments)} sample appointments")
    except Exception as e:
        logger.error(f"Error loading sample data: {e}")
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "UP", "service": "appointment-service"}


@app.get("/api/appointments", response_model=List[AppointmentResponse])
async def get_all_appointments():
    """Get all appointments."""
    db = SessionLocal()
    try:
        appointments = db.query(AppointmentDB).all()
        return [
            AppointmentResponse(
                id=a.id,
                petId=a.pet_id,
                vetId=a.vet_id,
                date=a.date,
                time=a.time,
                endTime=a.end_time,
                appointmentType=a.appointment_type,
                status=a.status,
                notes=a.notes,
                petName=a.pet_name,
                ownerName=a.owner_name,
                createdAt=a.created_at.isoformat() if a.created_at else None
            )
            for a in appointments
        ]
    finally:
        db.close()


@app.get("/api/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: int):
    """Get appointment by ID."""
    db = SessionLocal()
    try:
        appointment = db.query(AppointmentDB).filter(AppointmentDB.id == appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return AppointmentResponse(
            id=appointment.id,
            petId=appointment.pet_id,
            vetId=appointment.vet_id,
            date=appointment.date,
            time=appointment.time,
            endTime=appointment.end_time,
            appointmentType=appointment.appointment_type,
            status=appointment.status,
            notes=appointment.notes,
            petName=appointment.pet_name,
            ownerName=appointment.owner_name,
            createdAt=appointment.created_at.isoformat() if appointment.created_at else None
        )
    finally:
        db.close()


@app.post("/api/appointments", response_model=AppointmentResponse, status_code=201)
async def create_appointment(appointment: AppointmentCreate):
    """Create a new appointment."""
    db = SessionLocal()
    try:
        # Check for conflicting appointments
        existing = db.query(AppointmentDB).filter(
            AppointmentDB.vet_id == appointment.vet_id,
            AppointmentDB.date == appointment.date,
            AppointmentDB.time == appointment.time,
            AppointmentDB.status != "CANCELLED"
        ).first()
        
        if existing:
            raise HTTPException(status_code=409, detail="Time slot already booked")
        
        # Calculate end time if not provided (default 30 min)
        end_time = appointment.end_time or calculate_end_time(appointment.time, 30)
        
        db_appointment = AppointmentDB(
            pet_id=appointment.pet_id,
            vet_id=appointment.vet_id,
            date=appointment.date,
            time=appointment.time,
            end_time=end_time,
            appointment_type=appointment.appointment_type,
            status=appointment.status or "SCHEDULED",
            notes=appointment.notes,
            pet_name=appointment.pet_name,
            owner_name=appointment.owner_name
        )
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        # Send Kafka event
        send_event("appointment-events", str(db_appointment.id), {
            "eventType": "APPOINTMENT_CREATED",
            "appointmentId": db_appointment.id,
            "petId": db_appointment.pet_id,
            "vetId": db_appointment.vet_id,
            "date": db_appointment.date,
            "time": db_appointment.time,
            "type": db_appointment.appointment_type,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return AppointmentResponse(
            id=db_appointment.id,
            petId=db_appointment.pet_id,
            vetId=db_appointment.vet_id,
            date=db_appointment.date,
            time=db_appointment.time,
            endTime=db_appointment.end_time,
            appointmentType=db_appointment.appointment_type,
            status=db_appointment.status,
            notes=db_appointment.notes,
            petName=db_appointment.pet_name,
            ownerName=db_appointment.owner_name,
            createdAt=db_appointment.created_at.isoformat() if db_appointment.created_at else None
        )
    finally:
        db.close()


@app.put("/api/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: int, appointment: AppointmentUpdate):
    """Update an appointment."""
    db = SessionLocal()
    try:
        db_appointment = db.query(AppointmentDB).filter(AppointmentDB.id == appointment_id).first()
        if not db_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        update_data = appointment.model_dump(exclude_unset=True, by_alias=False)
        
        if "pet_id" in update_data and update_data["pet_id"] is not None:
            db_appointment.pet_id = update_data["pet_id"]
        if "vet_id" in update_data and update_data["vet_id"] is not None:
            db_appointment.vet_id = update_data["vet_id"]
        if "date" in update_data and update_data["date"] is not None:
            db_appointment.date = update_data["date"]
        if "time" in update_data and update_data["time"] is not None:
            db_appointment.time = update_data["time"]
        if "end_time" in update_data and update_data["end_time"] is not None:
            db_appointment.end_time = update_data["end_time"]
        if "appointment_type" in update_data and update_data["appointment_type"] is not None:
            db_appointment.appointment_type = update_data["appointment_type"]
        if "status" in update_data and update_data["status"] is not None:
            db_appointment.status = update_data["status"]
        if "notes" in update_data:
            db_appointment.notes = update_data["notes"]
        if "pet_name" in update_data:
            db_appointment.pet_name = update_data["pet_name"]
        if "owner_name" in update_data:
            db_appointment.owner_name = update_data["owner_name"]
        
        db_appointment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_appointment)
        
        # Send Kafka event
        send_event("appointment-events", str(db_appointment.id), {
            "eventType": "APPOINTMENT_UPDATED",
            "appointmentId": db_appointment.id,
            "petId": db_appointment.pet_id,
            "vetId": db_appointment.vet_id,
            "date": db_appointment.date,
            "time": db_appointment.time,
            "type": db_appointment.appointment_type,
            "status": db_appointment.status,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return AppointmentResponse(
            id=db_appointment.id,
            petId=db_appointment.pet_id,
            vetId=db_appointment.vet_id,
            date=db_appointment.date,
            time=db_appointment.time,
            endTime=db_appointment.end_time,
            appointmentType=db_appointment.appointment_type,
            status=db_appointment.status,
            notes=db_appointment.notes,
            petName=db_appointment.pet_name,
            ownerName=db_appointment.owner_name,
            createdAt=db_appointment.created_at.isoformat() if db_appointment.created_at else None
        )
    finally:
        db.close()


@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: int):
    """Delete an appointment."""
    db = SessionLocal()
    try:
        db_appointment = db.query(AppointmentDB).filter(AppointmentDB.id == appointment_id).first()
        if not db_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        db.delete(db_appointment)
        db.commit()
        
        # Send Kafka event
        send_event("appointment-events", str(appointment_id), {
            "eventType": "APPOINTMENT_DELETED",
            "appointmentId": appointment_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"success": True, "message": "Appointment deleted successfully"}
    finally:
        db.close()


@app.get("/api/appointments/pet/{pet_id}", response_model=List[AppointmentResponse])
async def get_appointments_by_pet(pet_id: int):
    """Get all appointments for a specific pet."""
    db = SessionLocal()
    try:
        appointments = db.query(AppointmentDB).filter(AppointmentDB.pet_id == pet_id).all()
        return [
            AppointmentResponse(
                id=a.id,
                petId=a.pet_id,
                vetId=a.vet_id,
                date=a.date,
                time=a.time,
                endTime=a.end_time,
                appointmentType=a.appointment_type,
                status=a.status,
                notes=a.notes,
                petName=a.pet_name,
                ownerName=a.owner_name,
                createdAt=a.created_at.isoformat() if a.created_at else None
            )
            for a in appointments
        ]
    finally:
        db.close()


@app.get("/api/appointments/vet/{vet_id}", response_model=List[AppointmentResponse])
async def get_appointments_by_vet(vet_id: int):
    """Get all appointments for a specific vet."""
    db = SessionLocal()
    try:
        appointments = db.query(AppointmentDB).filter(AppointmentDB.vet_id == vet_id).order_by(AppointmentDB.date, AppointmentDB.time).all()
        return [
            AppointmentResponse(
                id=a.id,
                petId=a.pet_id,
                vetId=a.vet_id,
                date=a.date,
                time=a.time,
                endTime=a.end_time,
                appointmentType=a.appointment_type,
                status=a.status,
                notes=a.notes,
                petName=a.pet_name,
                ownerName=a.owner_name,
                createdAt=a.created_at.isoformat() if a.created_at else None
            )
            for a in appointments
        ]
    finally:
        db.close()


@app.get("/api/appointments/date/{appointment_date}", response_model=List[AppointmentResponse])
async def get_appointments_by_date(appointment_date: str):
    """Get all appointments for a specific date."""
    db = SessionLocal()
    try:
        appointments = db.query(AppointmentDB).filter(AppointmentDB.date == appointment_date).order_by(AppointmentDB.time).all()
        return [
            AppointmentResponse(
                id=a.id,
                petId=a.pet_id,
                vetId=a.vet_id,
                date=a.date,
                time=a.time,
                endTime=a.end_time,
                appointmentType=a.appointment_type,
                status=a.status,
                notes=a.notes,
                petName=a.pet_name,
                ownerName=a.owner_name,
                createdAt=a.created_at.isoformat() if a.created_at else None
            )
            for a in appointments
        ]
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════
# CALENDAR ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/calendar/vet/{vet_id}")
async def get_vet_calendar(
    vet_id: int, 
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    days: int = Query(7, description="Number of days to show")
):
    """
    Get calendar view for a specific vet showing available and booked slots.
    """
    db = SessionLocal()
    try:
        # Default start date is today
        if not start_date:
            start_date = date.today().isoformat()
        
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        # Default working hours (should come from vet settings in production)
        working_start = "09:00"
        working_end = "17:00"
        slot_duration = 30
        working_days = ["MON", "TUE", "WED", "THU", "FRI"]
        
        day_names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        
        calendar_days = []
        
        for i in range(days):
            current_date = start + timedelta(days=i)
            day_of_week = day_names[current_date.weekday()]
            date_str = current_date.isoformat()
            
            # Check if it's a working day
            if day_of_week not in working_days:
                calendar_days.append(CalendarDay(
                    date=date_str,
                    dayOfWeek=day_of_week,
                    slots=[],
                    totalSlots=0,
                    bookedSlots=0,
                    availableSlots=0
                ))
                continue
            
            # Generate all time slots for the day
            all_slots = generate_time_slots(working_start, working_end, slot_duration)
            
            # Get booked appointments for this vet on this date
            booked_appointments = db.query(AppointmentDB).filter(
                AppointmentDB.vet_id == vet_id,
                AppointmentDB.date == date_str,
                AppointmentDB.status != "CANCELLED"
            ).all()
            
            # Create a set of booked times
            booked_times = {appt.time: appt for appt in booked_appointments}
            
            # Build slots with availability info
            slots = []
            for slot in all_slots:
                if slot["time"] in booked_times:
                    appt = booked_times[slot["time"]]
                    slots.append(TimeSlot(
                        time=slot["time"],
                        endTime=appt.end_time or slot["endTime"],
                        available=False,
                        appointmentId=appt.id,
                        petName=appt.pet_name,
                        appointmentType=appt.appointment_type
                    ))
                else:
                    slots.append(TimeSlot(
                        time=slot["time"],
                        endTime=slot["endTime"],
                        available=True,
                        appointmentId=None,
                        petName=None,
                        appointmentType=None
                    ))
            
            booked_count = len([s for s in slots if not s.available])
            
            calendar_days.append(CalendarDay(
                date=date_str,
                dayOfWeek=day_of_week,
                slots=slots,
                totalSlots=len(slots),
                bookedSlots=booked_count,
                availableSlots=len(slots) - booked_count
            ))
        
        return {
            "vetId": vet_id,
            "startDate": start_date,
            "endDate": (start + timedelta(days=days-1)).isoformat(),
            "days": calendar_days
        }
    finally:
        db.close()


@app.get("/api/calendar/available-slots")
async def get_available_slots(
    vet_id: int = Query(..., description="Vet ID"),
    date: str = Query(..., description="Date (YYYY-MM-DD)")
):
    """Get available time slots for a specific vet on a specific date."""
    db = SessionLocal()
    try:
        # Default working hours
        working_start = "09:00"
        working_end = "17:00"
        slot_duration = 30
        
        # Generate all time slots
        all_slots = generate_time_slots(working_start, working_end, slot_duration)
        
        # Get booked appointments
        booked_appointments = db.query(AppointmentDB).filter(
            AppointmentDB.vet_id == vet_id,
            AppointmentDB.date == date,
            AppointmentDB.status != "CANCELLED"
        ).all()
        
        booked_times = {appt.time for appt in booked_appointments}
        
        # Filter to only available slots
        available_slots = [
            {"time": slot["time"], "endTime": slot["endTime"]}
            for slot in all_slots
            if slot["time"] not in booked_times
        ]
        
        return {
            "vetId": vet_id,
            "date": date,
            "availableSlots": available_slots,
            "totalAvailable": len(available_slots)
        }
    finally:
        db.close()


@app.get("/api/calendar/search")
async def search_available_appointments(
    appointment_type: str = Query(None, description="Type of appointment"),
    date: str = Query(None, description="Preferred date"),
    vet_id: int = Query(None, description="Preferred vet")
):
    """Search for available appointment slots across all vets."""
    db = SessionLocal()
    try:
        search_date = date or datetime.now().date().isoformat()
        
        # Get all vets (in production, fetch from vet service)
        vet_ids = [1, 2, 3, 4, 5, 6] if not vet_id else [vet_id]
        
        results = []
        
        for vid in vet_ids:
            # Get booked appointments
            booked = db.query(AppointmentDB).filter(
                AppointmentDB.vet_id == vid,
                AppointmentDB.date == search_date,
                AppointmentDB.status != "CANCELLED"
            ).all()
            
            booked_times = {appt.time for appt in booked}
            
            # Generate available slots
            all_slots = generate_time_slots("09:00", "17:00", 30)
            available = [s for s in all_slots if s["time"] not in booked_times]
            
            if available:
                results.append({
                    "vetId": vid,
                    "date": search_date,
                    "availableSlots": available[:5],  # Return first 5 available
                    "totalAvailable": len(available)
                })
        
        return {
            "searchDate": search_date,
            "appointmentType": appointment_type,
            "results": results
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
