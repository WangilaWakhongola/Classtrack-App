/**
 * Seed script — run once to populate test data
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const { Class } = require('./models/ClassAttendance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendancedb';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Student.deleteMany({});
  await Class.deleteMany({});

  // Create test students
  const students = await Student.create([
    {
      studentId: 'STU001',
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      password: 'password123',
      department: 'Computer Science',
      year: '3rd Year',
      section: 'Section A',
    },
    {
      studentId: 'STU002',
      name: 'Bob Martinez',
      email: 'bob@university.edu',
      password: 'password123',
      department: 'Computer Science',
      year: '3rd Year',
      section: 'Section A',
    },
  ]);
  console.log('✅ Students created');

  // Create test classes
  // Replace latitude/longitude with your actual classroom coordinates
  const classes = await Class.create([
    {
      name: 'Data Structures',
      courseCode: 'CS201',
      instructor: 'Dr. Smith',
      room: 'B-204',
      latitude: 14.5995,   // ← Replace with real classroom GPS
      longitude: 120.9842,
      schedule: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }, // Monday
        { dayOfWeek: 3, startTime: '09:00', endTime: '10:30' }, // Wednesday
      ],
      enrolledStudents: students.map(s => s._id),
    },
    {
      name: 'Algorithms',
      courseCode: 'CS301',
      instructor: 'Prof. Lee',
      room: 'A-101',
      latitude: 14.6000,
      longitude: 120.9850,
      schedule: [
        { dayOfWeek: 2, startTime: '13:00', endTime: '14:30' }, // Tuesday
        { dayOfWeek: 4, startTime: '13:00', endTime: '14:30' }, // Thursday
      ],
      enrolledStudents: students.map(s => s._id),
    },
  ]);
  console.log('✅ Classes created');

  console.log('\n🎉 Seed complete!');
  console.log('Test login → studentId: STU001, password: password123');
  await mongoose.disconnect();
}

seed().catch(console.error);
