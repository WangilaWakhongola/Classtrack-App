from fastapi import APIRouter, HTTPException, Depends
from passlib.context import CryptContext
from database import get_db
from models.schemas import StudentRegister, StudentLogin, TokenResponse
from middleware.auth import create_token, get_current_user

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _safe(doc: dict) -> dict:
    doc.pop("password", None)
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/register", response_model=TokenResponse)
async def register(body: StudentRegister):
    db = get_db()
    if await db.students.find_one({"student_id": body.student_id}):
        raise HTTPException(400, "Student ID already registered")
    if await db.students.find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")

    doc = body.dict()
    doc["password"] = pwd_ctx.hash(body.password)
    result = await db.students.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    token = create_token({"sub": body.student_id, "name": body.name})
    return {"access_token": token, "student": _safe(doc)}


@router.post("/login", response_model=TokenResponse)
async def login(body: StudentLogin):
    db = get_db()
    student = await db.students.find_one({"student_id": body.student_id})
    if not student or not pwd_ctx.verify(body.password, student["password"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_token({"sub": student["student_id"], "name": student["name"]})
    return {"access_token": token, "student": _safe(student)}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    student = await db.students.find_one({"student_id": current_user["sub"]})
    if not student:
        raise HTTPException(404, "Student not found")
    return _safe(student)
