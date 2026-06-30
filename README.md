#  Classtrack :GPS Attendance

A full-stack attendance app built with **FastAPI + MongoDB** (backend) and a **vanilla HTM/JS SPA** (frontend).  
Students can only mark attendance when physically inside the classroom, verified by server-side GPS geofencing and an optional selfie capture.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.11+ · FastAPI · Uvicorn    |
| Database   | MongoDB · Motor (async driver)      |
| Auth       | JWT (python-jose) · bcrypt          |
| Geo check  | Haversine formula (pure Python)     |
| Frontend   | HTML · CSS · Vanilla JS (no build)  |

---

## Project Structure

```
classtrack/
├── backend/
│   ├── main.py                  # FastAPI app + lifespan
│   ├── database.py              # Motor/MongoDB connection
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── routes/
│   │   ├── auth.py              # /api/auth/*
│   │   ├── classes.py           # /api/classes/*
│   │   └── attendance.py        # /api/attendance/*
│   ├── middleware/
│   │   └── auth.py              # JWT create/verify, Depends
│   └── utils/
│       └── geo.py               # Haversine distance
└── frontend/
    └── index.html               # Single-page app (served by FastAPI)
```

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- MongoDB running locally (`mongod`) **or** a free [MongoDB Atlas](https://mongodb.com/atlas) cluster

### 2. Backend setup

```bash
cd backend
cp .env.example .env        # Edit MONGO_URI and JWT_SECRET
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000** — the frontend is served automatically.  
Interactive API docs: **http://localhost:8000/docs**

---

## API Endpoints

### Auth  `/api/auth`
| Method | Path         | Description            |
|--------|--------------|------------------------|
| POST   | `/register`  | Register a new student |
| POST   | `/login`     | Login → JWT token      |
| GET    | `/me`        | Get current profile    |

### Classes  `/api/classes`
| Method | Path                        | Description                |
|--------|-----------------------------|----------------------------|
| GET    | `/all`                      | List all classes           |
| GET    | `/enrolled/{student_id}`    | Classes student is in      |
| GET    | `/today/{student_id}`       | Today's scheduled classes  |
| POST   | `/`                         | Create a class             |
| POST   | `/{id}/enroll`              | Enroll student             |
| DELETE | `/{id}/enroll/{student_id}` | Unenroll student           |

### Attendance  `/api/attendance`
| Method | Path                   | Description                       |
|--------|------------------------|-----------------------------------|
| POST   | `/sign`                | Sign attendance (GPS + selfie)    |
| GET    | `/check`               | Already signed today?             |
| GET    | `/stats/{student_id}`  | Stats + weekly chart data         |
| GET    | `/reports/{student_id}`| History (week / month / all)      |
| GET    | `/class-report/{id}`   | All students signed for a class   |

---

## Creating a Class (seed data)

```bash
curl -X POST http://localhost:8000/api/classes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Structures",
    "course_code": "CS201",
    "instructor": "Dr. Wakhongola",
    "room": "B-204",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "radius_meters": 50,
    "schedule": [
      {"day_of_week": 0, "start_time": "09:00", "end_time": "10:30"},
      {"day_of_week": 2, "start_time": "09:00", "end_time": "10:30"}
    ]
  }'
```

---

## Security

- **JWT** on every protected route via `Authorization: Bearer <token>`
- **GPS verified server-side** using Haversine — client can't fake it
- **Duplicate prevention** — unique index on (student, class, date)
- **Password hashing** via bcrypt
- **Selfie stored as base64** on the attendance record (optional anti-proxy visual)

---

## Environment Variables

```
PORT=8000
MONGO_URI=mongodb://localhost:27017/classtackdb
JWT_SECRET=change_me_to_something_long_and_random
JWT_EXPIRES_HOURS=168
```
