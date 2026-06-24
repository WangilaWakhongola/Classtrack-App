from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import get_db
from models.schemas import ClassCreate, ClassEnroll
from middleware.auth import get_current_user
from datetime import datetime

router = APIRouter()


def _fmt(doc):
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/")
async def create_class(body: ClassCreate, _=Depends(get_current_user)):
    db = get_db()
    doc = body.dict()
    doc["created_at"] = datetime.utcnow()
    doc["enrolled_students"] = []
    result = await db.classes.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.get("/all")
async def get_all_classes(_=Depends(get_current_user)):
    db = get_db()
    classes = await db.classes.find().to_list(200)
    return [_fmt(c) for c in classes]


@router.get("/enrolled/{student_id}")
async def get_enrolled(student_id: str, _=Depends(get_current_user)):
    db = get_db()
    classes = await db.classes.find({"enrolled_students": student_id}).to_list(100)
    return [_fmt(c) for c in classes]


@router.get("/today/{student_id}")
async def get_today(student_id: str, _=Depends(get_current_user)):
    db = get_db()
    today_dow = datetime.utcnow().weekday()  # 0=Mon
    classes = await db.classes.find({
        "enrolled_students": student_id,
        "schedule.day_of_week": today_dow,
    }).to_list(50)
    return [_fmt(c) for c in classes]


@router.post("/{class_id}/enroll")
async def enroll(class_id: str, body: ClassEnroll, _=Depends(get_current_user)):
    db = get_db()
    result = await db.classes.update_one(
        {"_id": ObjectId(class_id)},
        {"$addToSet": {"enrolled_students": body.student_id}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Class not found")
    return {"message": "Enrolled successfully"}


@router.delete("/{class_id}/enroll/{student_id}")
async def unenroll(class_id: str, student_id: str, _=Depends(get_current_user)):
    db = get_db()
    await db.classes.update_one(
        {"_id": ObjectId(class_id)},
        {"$pull": {"enrolled_students": student_id}},
    )
    return {"message": "Unenrolled"}


@router.get("/{class_id}")
async def get_class(class_id: str, _=Depends(get_current_user)):
    db = get_db()
    cls = await db.classes.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(404, "Class not found")
    return _fmt(cls)
