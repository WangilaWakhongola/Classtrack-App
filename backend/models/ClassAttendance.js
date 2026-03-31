const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseCode: { type: String, required: true },
  instructor: { type: String, required: true },
  room: { type: String, required: true },
  // GPS coordinates of the classroom
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // Schedule: array of { dayOfWeek: 0-6, startTime: "09:00", endTime: "10:30" }
  schedule: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: String,
    endTime: String,
  }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now },
});

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  present: { type: Boolean, default: true },
  latitude: { type: Number },
  longitude: { type: Number },
  selfieUrl: { type: String, default: null },
  verifiedByGPS: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

// Prevent duplicate attendance per student per class per day
attendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });

module.exports = {
  Class: mongoose.model('Class', classSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
};
