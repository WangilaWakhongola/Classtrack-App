from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import get_db
from models.schemas import AttendanceSign
from middleware.auth import get_current_user
from utils.geo import is_within_radius
from datetime import datetime, date

router = APIRouter()


def _fmt(doc):
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/sign")
async def sign_attendance(body: AttendanceSign, _=Depends(get_current_user)):
    db = get_db()

    # 1. Load class & verify it exists
    cls = await db.classes.find_one({"_id": ObjectId(body.class_id)})
    if not cls:
        raise HTTPException(404, "Class not found")

    # 2. Check student is enrolled
    if body.student_id not in cls.get("enrolled_students", []):
        raise HTTPException(403, "Not enrolled in this class")

    # 3. GPS geofence check (server-side)
    inside, distance_m = is_within_radius(
        body.latitude, body.longitude,
        cls["latitude"], cls["longitude"],
        cls.get("radius_meters", 50),
    )
    if not inside:
        raise HTTPException(400, f"You are {distance_m}m from the classroom (max {cls.get('radius_meters', 50)}m)")

    # 4. Duplicate prevention — one sign per student per class per day
    today_str = date.today().isoformat()
    existing = await db.attendance.find_one({
        "student_id": body.student_id,
        "class_id": body.class_id,
        "date": today_str,
    })
    if existing:
        raise HTTPException(409, "Already signed in for this class today")

    # 5. Record attendance
    record = {
        "student_id": body.student_id,
        "class_id": body.class_id,
        "class_name": cls["name"],
        "course_code": cls["course_code"],
        "date": today_str,
        "timestamp": datetime.utcnow(),
        "latitude": body.latitude,
        "longitude": body.longitude,
        "distance_m": distance_m,
        "selfie_base64": body.selfie_base64,
        "status": "present",
    }
    result = await db.attendance.insert_one(record)
    record["_id"] = str(result.inserted_id)
    record.pop("selfie_base64", None)  # don't echo it back
    return {"message": "Attendance recorded ✅", "record": record}


@router.get("/check")
async def check_today(student_id: str, class_id: str, _=Depends(get_current_user)):
    db = get_db()
    today_str = date.today().isoformat()
    rec = await db.attendance.find_one({
        "student_id": student_id,
        "class_id": class_id,
        "date": today_str,
    })
    return {"signed": rec is not None}


@router.get("/stats/{student_id}")
async def stats(student_id: str, _=Depends(get_current_user)):
    db = get_db()

    # Total enrolled classes
    enrolled_count = await db.classes.count_documents({"enrolled_students": student_id})

    # All attendance records
    records = await db.attendance.find({"student_id": student_id}).to_list(1000)
    total_sessions = len(records)

    # Per-class breakdown
    by_class: dict = {}
    for r in records:
        cid = r["class_id"]
        by_class.setdefault(cid, {"class_name": r["class_name"], "course_code": r["course_code"], "count": 0})
        by_class[cid]["count"] += 1

    # Last 7 days
    from datetime import timedelta
    today = date.today()
    weekly = []
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        cnt = sum(1 for r in records if r["date"] == d)
        weekly.append({"date": d, "count": cnt})

    return {
        "enrolled_classes": enrolled_count,
        "total_sessions": total_sessions,
        "by_class": list(by_class.values()),
        "weekly": weekly,
    }


@router.get("/reports/{student_id}")
async def reports(student_id: str, period: str = "month", _=Depends(get_current_user)):
    """period: week | month | all"""
    db = get_db()
    from datetime import timedelta

    today = date.today()
    if period == "week":
        cutoff = (today - timedelta(days=7)).isoformat()
    elif period == "month":
        cutoff = (today - timedelta(days=30)).isoformat()
    else:
        cutoff = "2000-01-01"

    records = await db.attendance.find({
        "student_id": student_id,
        "date": {"$gte": cutoff},
    }).sort("date", -1).to_list(500)

    return [_fmt(r) for r in records]


@router.get("/class-report/{class_id}")
async def class_report(class_id: str, date_str: str = None, _=Depends(get_current_user)):
    """All student attendance for a class on a given date (default today)."""
    db = get_db()
    target_date = date_str or date.today().isoformat()
    records = await db.attendance.find({
        "class_id": class_id,
        "date": target_date,
    }).to_list(200)
    return [_fmt(r) for r in records]
