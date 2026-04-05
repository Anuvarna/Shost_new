const express = require('express');
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');
const LostFound = require('../models/LostFound');
const Movement = require('../models/Movement');
const Rules = require('../models/Rules');
const Attendance = require('../models/Attendance');
const RoomPreference = require('../models/RoomPreference');
const Hostel = require('../models/Hostel');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', folder)),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const uploadComplaint = multer({ storage: makeStorage('complaints'), limits: { fileSize: 2 * 1024 * 1024 } });
const uploadLostFound = multer({ storage: makeStorage('lostfound'), limits: { fileSize: 2 * 1024 * 1024 } });

// ===== PROFILE =====
router.get('/profile', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('hostelId', 'name gender')
      .populate('roomId', 'roomNumber floor capacity');
    if (!student) return res.status(404).json({ message: 'Profile not found' });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ROOM PREFERENCE =====
router.post('/room-preference', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { preferredRoommates } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Only Year 2+ can submit slip
    if (student.year < 2) return res.status(403).json({ message: 'Year 1 students are allocated automatically. Slip not required.' });

    // Check if slip is enabled
    const hostel = await Hostel.findById(student.hostelId);
    if (!hostel?.slipEnabled) return res.status(403).json({ message: 'Room preference slip is not currently open. Please wait for the warden to enable it.' });

    const roommateStudents = await Student.find({
      admissionNumber: { $in: preferredRoommates },
      hostelId: student.hostelId,
    });
    await RoomPreference.findOneAndUpdate(
      { studentId: student._id },
      { studentId: student._id, hostelId: student.hostelId, preferredRoommates: roommateStudents.map(s => s._id), submittedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Preferences saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/room-preference', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const pref = await RoomPreference.findOne({ studentId: student._id })
      .populate('preferredRoommates', 'fullName admissionNumber branch year');
    const hostel = await Hostel.findById(student.hostelId).select('slipEnabled');
    res.json({ preference: pref || null, slipEnabled: hostel?.slipEnabled || false, year: student.year });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== NOTICES =====
router.get('/notices', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const now = new Date();
    const notices = await Notice.find({
      hostelId: student.hostelId,
      publishAt: { $lte: now },
      takedownAt: { $gte: now },
    }).populate('createdBy', 'name').sort({ publishAt: -1 });
    res.json({ notices });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== RULES =====
router.get('/rules', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const rules = await Rules.findOne({ hostelId: student.hostelId });
    res.json({ content: rules?.content || 'No rules published yet.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== COMPLAINTS =====
router.get('/complaints', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const complaints = await Complaint.find({ studentId: student._id }).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/complaints', authRequired, requireRole('student'),
  uploadComplaint.single('image'),
  async (req, res) => {
    try {
      const { type, description } = req.body;
      if (!type || !description) return res.status(400).json({ message: 'type and description required' });
      const student = await Student.findOne({ userId: req.user._id });
      const imagePath = req.file ? `/uploads/complaints/${req.file.filename}` : null;
      const complaint = await Complaint.create({ studentId: student._id, hostelId: student.hostelId, type, description, imagePath });
      res.json({ message: 'Complaint submitted', complaint });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ===== LOST & FOUND =====
router.get('/lostfound', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const items = await LostFound.find({ hostelId: student.hostelId }).populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/lostfound', authRequired, requireRole('student'),
  uploadLostFound.single('image'),
  async (req, res) => {
    try {
      const { type, title, description } = req.body;
      if (!type || !title || !description) return res.status(400).json({ message: 'type, title, description required' });
      const student = await Student.findOne({ userId: req.user._id });
      const imagePath = req.file ? `/uploads/lostfound/${req.file.filename}` : null;
      const item = await LostFound.create({ hostelId: student.hostelId, postedBy: req.user._id, type, title, description, imagePath });
      res.json({ message: 'Item posted', item });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.patch('/lostfound/:id/status', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { status } = req.body;
    const item = await LostFound.findOneAndUpdate({ _id: req.params.id, postedBy: req.user._id }, { status }, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Status updated', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== MOVEMENT =====
router.get('/movement', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const movements = await Movement.find({ studentId: student._id }).sort({ createdAt: -1 });
    res.json({ movements });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/movement', authRequired, requireRole('student'), async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 6 || hour >= 17) return res.status(400).json({ message: 'Movement registration is only available between 6:00 AM and 5:00 PM' });
    const { destination, leaveDate, leaveTime, returnDate, returnTime, reason } = req.body;
    if (!destination || !leaveDate || !leaveTime || !returnDate || !returnTime)
      return res.status(400).json({ message: 'All fields are required' });
    const student = await Student.findOne({ userId: req.user._id });
    const movement = await Movement.create({ studentId: student._id, hostelId: student.hostelId, destination, leaveDate, leaveTime, returnDate, returnTime, reason });
    res.json({ message: 'Movement registered', movement });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ATTENDANCE =====
router.get('/attendance', authRequired, requireRole('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const records = await Attendance.find({ hostelId: student.hostelId }).sort({ date: -1 }).limit(30);
    const myHistory = records.map(r => {
      const myRecord = r.records.find(x => x.studentId.toString() === student._id.toString());
      return { date: r.date, status: myRecord?.status || null };
    }).filter(r => r.status);
    res.json({ attendance: myHistory });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
