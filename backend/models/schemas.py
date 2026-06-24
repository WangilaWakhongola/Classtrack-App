from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class StudentRegister(BaseModel):
    student_id: str
    name: str
    email: EmailStr
    password: str
    course: Optional[str] = ""

class StudentLogin(BaseModel):
    student_id: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student: dict


# ─── Class ───────────────────────────────────────────────────────────────────

class ScheduleSlot(BaseModel):
    day_of_week: int          # 0=Mon … 6=Sun
    start_time: str           # "09:00"
    end_time: str             # "10:30"

class ClassCreate(BaseModel):
    name: str
    course_code: str
    instructor: str
    room: str
    latitude: float
    longitude: float
    radius_meters: float = 50.0
    schedule: List[ScheduleSlot] = []

class ClassEnroll(BaseModel):
    student_id: str


# ─── Attendance ───────────────────────────────────────────────────────────────

class AttendanceSign(BaseModel):
    student_id: str
    class_id: str
    latitude: float
    longitude: float
    selfie_base64: Optional[str] = None   # base64 JPEG for visual record
