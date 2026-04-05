const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Hostel = require('./models/Hostel');
const Student = require('./models/Student');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  // Drop collections completely to avoid index conflicts
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);
  if (names.includes('users')) await db.dropCollection('users');
  if (names.includes('hostels')) await db.dropCollection('hostels');
  if (names.includes('students')) await db.dropCollection('students');
  console.log('🗑️  Cleared old data');

  // Create hostels
  const boysHostel = await Hostel.create({
    name: 'St. Thomas Hostel (Boys)', gender: 'Boys',
    description: 'Boys hostel', totalFloors: 4, studentsPerRoom: 3,
  });
  const girlsHostel = await Hostel.create({
    name: 'St. Alphonsa Hostel (Girls)', gender: 'Girls',
    description: 'Girls hostel', totalFloors: 4, studentsPerRoom: 3,
  });

  // Admin
  await User.create({ name: 'Admin', email: 'admin@hostx.com', password: 'admin123', role: 'admin' });

  // Warden
  const warden = await User.create({
    name: 'Warden Thomas', email: 'warden@hostx.com', password: 'warden123',
    role: 'warden', hostelId: boysHostel._id,
  });
  await Hostel.findByIdAndUpdate(boysHostel._id, { $push: { wardens: warden._id } });

  // Student
  const studentUser = await User.create({
    name: 'John Doe', email: 'student@hostx.com', password: 'student123',
    role: 'student', hostelId: boysHostel._id,
  });
  await Student.create({
    userId: studentUser._id, hostelId: boysHostel._id,
    admissionNumber: 'ADM001', fullName: 'John Doe',
    branch: 'Computer Science', year: 2,
    phone: '9876543210', district: 'Ernakulam', state: 'Kerala',
    fatherName: 'James Doe', fatherPhone: '9876543211', fatherEmail: 'james@email.com',
    motherName: 'Mary Doe', motherPhone: '9876543212', motherEmail: 'mary@email.com',
  });

  console.log('\n🎉 Seeding complete!');
  console.log('Admin:   admin@hostx.com   / admin123');
  console.log('Warden:  warden@hostx.com  / warden123');
  console.log('Student: student@hostx.com / student123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
