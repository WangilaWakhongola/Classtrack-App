const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Class, Attendance } = require('../models/ClassAttendance');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Setup multer for selfie uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/selfies';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `selfie_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Haversine distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(d) { return d * Math.PI / 180; }

// GET /api/attendance/check?studentId=&classId=
router.get('/check', auth, async (req, res) => {
  const { classId } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const record = await Attendance.findOne({
      student: req.student._id,
      class: classId,
      date: { $gte: today, $lt: tomorrow },
    });
    res.json({ signed: !!record });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/attendance/sign
router.post('/sign', auth, upload.single('selfie'), async (req, res) => {
  const { classId, latitude, longitude, timestamp } = req.body;
  const RADIUS = parseInt(process.env.CLASSROOM_RADIUS_METERS) || 50;

  try {
    // 1. Find class
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found.' });

    // 2. GPS Verification
    const dist = getDistance(
      parseFloat(latitude), parseFloat(longitude),
      cls.latitude, cls.longitude
    );
    if (dist > RADIUS) {
      return res.status(403).json({
        message: `You are ${Math.round(dist)}m from the classroom. Must be within ${RADIUS}m.`,
        distance: dist,
      });
    }

    // 3. Check duplicate
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const existing = await Attendance.findOne({
      student: req.student._id, class: classId,
      date: { $gte: today, $lt: tomorrow },
    });
    if (existing) return res.status(409).json({ message: 'Already signed attendance for this class today.' });

    // 4. Save attendance
    const selfieUrl = req.file ? `/uploads/selfies/${req.file.filename}` : null;
    const record = await Attendance.create({
      student: req.student._id,
      class: classId,
      date: new Date(),
      present: true,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      selfieUrl,
      verifiedByGPS: true,
      timestamp: timestamp || new Date(),
    });

    res.status(201).json({ success: true, record });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// GET /api/attendance/stats/:studentId
router.get('/stats/:studentId', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.student._id }).populate('class', 'name');
    const present = records.filter(r => r.present).length;
    const total = records.length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const needed = rate < 75 ? Math.ceil((0.75 * total - present) / 0.25) : 0;

    // Weekly data (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    const weeklyLabels = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      weeklyLabels.push(days[d.getDay()]);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const count = records.filter(r => r.present && r.date >= start && r.date <= end).length;
      weeklyData[6 - i] = count;
    }

    // Recent activity
    const recentActivity = records
      .sort((a, b) => b.date - a.date)
      .slice(0, 10)
      .map(r => ({
        className: r.class?.name || 'Unknown',
        date: r.date.toLocaleDateString(),
        present: r.present,
      }));

    res.json({ present, absent, total, rate, needed, weeklyData, weeklyLabels, recentActivity });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// GET /api/attendance/reports/:studentId?period=month
router.get('/reports/:studentId', auth, async (req, res) => {
  const { period = 'month' } = req.query;
  const now = new Date();
  let startDate = new Date();

  if (period === 'week') startDate.setDate(now.getDate() - 7);
  else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
  else if (period === 'semester') startDate.setMonth(now.getMonth() - 6);

  try {
    const classes = await Class.find({ enrolledStudents: req.student._id });
    const reports = await Promise.all(classes.map(async (cls) => {
      const records = await Attendance.find({
        student: req.student._id,
        class: cls._id,
        date: { $gte: startDate, $lte: now },
      });
      const present = records.filter(r => r.present).length;
      const total = records.length;
      const absent = total - present;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const sessions = records.sort((a, b) => b.date - a.date).map(r => ({
        date: r.date.toLocaleDateString(),
        present: r.present,
      }));
      return { className: cls.name, courseCode: cls.courseCode, present, absent, total, rate, sessions };
    }));

    res.json(reports);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

module.exports = router;
