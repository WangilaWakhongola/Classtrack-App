from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/classtackdb")

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_default_database()

    # Ensure indexes
    await db.students.create_index([("student_id", ASCENDING)], unique=True)
    await db.students.create_index([("email", ASCENDING)], unique=True)
    await db.attendance.create_index(
        [("student_id", ASCENDING), ("class_id", ASCENDING), ("date", ASCENDING)],
        unique=True
    )
    print("✅ Connected to MongoDB")

async def disconnect_db():
    global client
    if client:
        client.close()

def get_db():
    return db
