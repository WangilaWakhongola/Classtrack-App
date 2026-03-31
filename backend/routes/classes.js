const express = require('express');
const router = express.Router();
const { Class } = require('../models/ClassAttendance');
const auth = require('../middleware/auth');

// GET /api/classes/today/:studentId
router.get('/today/:studentId', auth, async (req, res) => {
  try {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ...
    const classes = await Class.find({
      enrolledStudents: req.student._id,
      'schedule.dayOfWeek': today,
    });

    const result = classes.map(cls => {
      const todaySchedule = cls.schedule.find(s => s.dayOfWeek === today);
      return {
        id: cls._id,
        name: cls.name,
        courseCode: cls.courseCode,
        instructor: cls.instructor,
        room: cls.room,
        latitude: cls.latitude,
        longitude: cls.longitude,
        time: todaySchedule ? `${todaySchedule.startTime} - ${todaySchedule.endTime}` : '',
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// GET /api/classes/all
router.get('/all', auth, async (req, res) => {
  try {
    const classes = await Class.find({ enrolledStudents: req.student._id });
    res.json(classes);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classes (admin — create class)
router.post('/', auth, async (req, res) => {
  try {
    const cls = await Class.create(req.body);
    res.status(201).json(cls);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/classes/:id/enroll
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { enrolledStudents: req.student._id } },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found.' });
    res.json({ success: true, class: cls });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
