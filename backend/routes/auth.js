const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', [
  body('studentId').notEmpty(),
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { studentId, name, email, password, department, year, section } = req.body;
  try {
    const existing = await Student.findOne({ $or: [{ studentId }, { email }] });
    if (existing) return res.status(400).json({ message: 'Student ID or email already registered.' });

    const student = await Student.create({ studentId, name, email, password, department, year, section });
    const token = generateToken(student._id);
    res.status(201).json({ token, user: sanitize(student) });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { studentId, password } = req.body;
  if (!studentId || !password)
    return res.status(400).json({ message: 'Student ID and password are required.' });

  try {
    const student = await Student.findOne({ studentId });
    if (!student || !(await student.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = generateToken(student._id);
    res.json({ token, user: sanitize(student) });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/biometric
router.post('/biometric', async (req, res) => {
  const { studentId } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    const token = generateToken(student._id);
    res.json({ token, user: sanitize(student) });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/push-token
router.post('/push-token', require('../middleware/auth'), async (req, res) => {
  const { pushToken } = req.body;
  await Student.findByIdAndUpdate(req.student._id, { pushToken });
  res.json({ success: true });
});

function sanitize(student) {
  return {
    id: student._id,
    studentId: student.studentId,
    name: student.name,
    email: student.email,
    department: student.department,
    year: student.year,
    section: student.section,
  };
}

module.exports = router;
