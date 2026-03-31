# 📍 AttendIQ — GPS-Based Student Attendance App

A full-stack mobile application for GPS-verified student attendance with biometric login, selfie verification, and real-time analytics.

---

## 🗂 Project Structure

```
AttendanceApp/
├── App.js                        # Entry point
├── app.json                      # Expo config
├── package.json
├── babel.config.js
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js       # Stack + Tab navigation
│   ├── screens/
│   │   ├── LoginScreen.js        # ID/password + biometric login
│   │   ├── AttendanceScreen.js   # GPS sign-in + selfie capture
│   │   ├── DashboardScreen.js    # Stats + weekly chart
│   │   ├── ReportsScreen.js      # Per-class attendance reports
│   │   └── ProfileScreen.js      # User profile + logout
│   ├── services/
│   │   ├── authService.js        # Login/register API calls
│   │   ├── attendanceService.js  # Attendance API calls
│   │   └── notificationService.js# Push notifications
│   ├── hooks/
│   │   └── useAuth.js            # Auth state + AsyncStorage
│   └── utils/
│       └── geoUtils.js           # Haversine GPS distance
└── backend/
    ├── server.js                 # Express app entry
    ├── package.json
    ├── .env.example
    ├── models/
    │   ├── Student.js            # Student schema + bcrypt
    │   └── ClassAttendance.js    # Class + Attendance schemas
    ├── routes/
    │   ├── auth.js               # Register, login, biometric
    │   ├── classes.js            # Class management + enrollment
    │   └── attendance.js         # Sign, check, stats, reports
    └── middleware/
        └── auth.js               # JWT verification middleware
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

---

### 1️⃣ Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

Your server will start on `http://localhost:5000`

---

### 2️⃣ Mobile App Setup

```bash
# From root AttendanceApp/ folder
npm install
```

Update your backend URL in `src/services/authService.js` and `attendanceService.js`:
```js
const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
// Use your machine's local IP (e.g. 192.168.1.x), not localhost
```

Then start Expo:
```bash
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

---

## 🔑 Features

| Feature | Description |
|---|---|
| 🔐 Login | Student ID + password |
| 🖐 Biometric | Fingerprint / Face ID login |
| 📍 GPS Geofencing | 50m radius classroom check |
| 🤳 Selfie Verification | Front camera capture for anti-proxy |
| 📊 Dashboard | Attendance stats + weekly bar chart |
| 📋 Reports | Per-class reports, shareable |
| 🔔 Push Notifications | Class reminders + confirmations |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login with ID + password |
| POST | `/api/auth/biometric` | Biometric login |
| POST | `/api/auth/push-token` | Save push notification token |

### Classes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/classes/today/:studentId` | Get today's scheduled classes |
| GET | `/api/classes/all` | Get all enrolled classes |
| POST | `/api/classes` | Create class (admin) |
| POST | `/api/classes/:id/enroll` | Enroll in a class |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/attendance/sign` | Sign attendance (GPS + selfie) |
| GET | `/api/attendance/check` | Check if already signed today |
| GET | `/api/attendance/stats/:id` | Get student stats |
| GET | `/api/attendance/reports/:id` | Get reports by period |

---

## 🗄 Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendancedb
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLASSROOM_RADIUS_METERS=50
```

---

## 🏗 Deployment

### Backend (Railway / Render / Heroku)
1. Push backend folder to a repo or deploy via CLI
2. Set environment variables in the dashboard
3. Update `API_URL` in the mobile app to your deployed URL

### Mobile App (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK for Android
eas build --platform ios       # IPA for iOS
```

---

## 📌 Configuring Classroom GPS Coordinates

When creating a class via the API, pass the classroom's real GPS coordinates:

```json
POST /api/classes
{
  "name": "Data Structures",
  "courseCode": "CS201",
  "instructor": "Dr. Smith",
  "room": "B-204",
  "latitude": 14.5995,
  "longitude": 120.9842,
  "schedule": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "10:30" },
    { "dayOfWeek": 3, "startTime": "09:00", "endTime": "10:30" }
  ]
}
```

---

## 🛡 Security Features

- **JWT Authentication** — all routes protected
- **GPS Geofencing** — server-side distance verification (not just client-side)
- **Duplicate Prevention** — unique index on student+class+date
- **Biometric** — device-level authentication via expo-local-authentication
- **Selfie Capture** — anti-proxy visual verification

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Navigation | React Navigation v6 |
| Charts | react-native-chart-kit |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Location | expo-location |
| Camera | expo-camera |
| Biometrics | expo-local-authentication |
| Notifications | expo-notifications |

---

## 👨‍💻 Author

Built with ❤️ using React Native + Expo + Node.js
