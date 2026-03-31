const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id).select('-password');
    if (!student) return res.status(401).json({ message: 'Unauthorized: Student not found.' });
    req.student = student;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }
};
