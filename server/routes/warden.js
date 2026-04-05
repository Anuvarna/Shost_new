const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const LostFound = require('../models/LostFound');
const Movement = require('../models/Movement');
const Rules = require('../models/Rules');
const RoomPreference = require('../models/RoomPreference');
const User = require('../models/User');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', folder)),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const uploadNotice = multer({ storage: makeStorage('notices'), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPhoto = multer({ storage: makeStorage('photos'), limits: { fileSize: 3 * 1024 * 1024 } });

// ===== DASHBOARD =====
router.get('/dashboard', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    if (!hostelId) return res.status(400).json({ message: 'No hostel assigned' });
    const [totalStudents, totalRooms, pendingComplaints, hostel] = await Promise.all([
      Student.countDocuments({ hostelId, isArchived: false }),
      Room.countDocuments({ hostelId, isWardenRoom: false }),
      Complaint.countDocuments({ hostelId, status: { $ne: 'resolved' } }),
      Hostel.findById(hostelId),
    ]);
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.findOne({ hostelId, date: today });
    const absentToday = todayAttendance ? todayAttendance.records.filter(r => r.status === 'absent').length : null;
    res.json({ totalStudents, totalRooms, pendingComplaints, hostel, absentToday });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== SLIP TOGGLE =====
router.put('/slip/toggle', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { enabled } = req.body;
    const hostel = await Hostel.findByIdAndUpdate(req.user.hostelId, { slipEnabled: enabled }, { new: true });
    res.json({ message: `Slip ${enabled ? 'enabled' : 'disabled'}`, slipEnabled: hostel.slipEnabled });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/slip/status', authRequired, requireRole('warden', 'student'), async (req, res) => {
  try {
    let hostelId = req.user.hostelId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      hostelId = student?.hostelId;
    }
    const hostel = await Hostel.findById(hostelId).select('slipEnabled');
    res.json({ slipEnabled: hostel?.slipEnabled || false });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== STUDENTS =====
router.get('/students', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const students = await Student.find({ hostelId: req.user.hostelId, isArchived: false })
      .populate('userId', 'name email')
      .populate('roomId', 'roomNumber floor');
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/students/:id', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    const phoneFields = ['phone', 'fatherPhone', 'motherPhone'];
    for (const f of phoneFields) {
      if (updateData[f] && !/^\d{10}$/.test(updateData[f])) {
        return res.status(400).json({ message: `${f} must be exactly 10 digits` });
      }
    }
    if (req.file) {
      updateData.photo = `/uploads/photos/${req.file.filename}`;
    }
    Object.keys(updateData).forEach(k => {
      if (updateData[k] === '' || updateData[k] === 'undefined') delete updateData[k];
    });
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, hostelId: req.user.hostelId },
      { $set: updateData }, { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (updateData.fullName) await User.findByIdAndUpdate(student.userId, { name: updateData.fullName });
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.post('/students/:id/photo', authRequired, requireRole('warden'), uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });
    const photoPath = `/uploads/photos/${req.file.filename}`;
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, hostelId: req.user.hostelId },
      { photo: photoPath }, { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Photo uploaded', photo: photoPath });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ROOMS =====
router.get('/rooms', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const rooms = await Room.find({ hostelId: req.user.hostelId })
      .populate('occupants', 'fullName admissionNumber branch year photo');
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { roomNumber, floor, capacity, isWardenRoom } = req.body;
    if (!roomNumber || floor === undefined) return res.status(400).json({ message: 'Room number and floor required' });
    const hostelId = req.user.hostelId;
    const room = await Room.create({ hostelId, roomNumber, floor, capacity: capacity || 3, isWardenRoom: isWardenRoom || false });
    res.json({ message: 'Room created', room });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== DELETE ROOM =====
router.delete('/rooms/:id', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    const room = await Room.findOne({ _id: req.params.id, hostelId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.occupants && room.occupants.length > 0) {
      return res.status(400).json({
        message: `Cannot delete room — ${room.occupants.length} student(s) are currently allocated here. Unallocate them first.`
      });
    }
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== UNALLOCATE =====
router.post('/rooms/unallocate/:studentId', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, hostelId: req.user.hostelId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.roomId) {
      await Room.findByIdAndUpdate(student.roomId, { $pull: { occupants: student._id } });
    }
    student.roomId = null;
    student.allocationStatus = 'pending';
    await student.save();
    res.json({ message: 'Student unallocated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms/unallocate-all', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    await Room.updateMany({ hostelId }, { $set: { occupants: [] } });
    await Student.updateMany({ hostelId, isArchived: false }, { $set: { roomId: null, allocationStatus: 'pending' } });
    res.json({ message: 'All rooms unallocated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ROOM ALLOCATION =====
router.post('/rooms/allocate/manual', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    const hostelId = req.user.hostelId;
    const [student, room] = await Promise.all([
      Student.findOne({ _id: studentId, hostelId }),
      Room.findOne({ _id: roomId, hostelId }),
    ]);
    if (!student || !room) return res.status(404).json({ message: 'Student or room not found' });
    if (room.isWardenRoom) return res.status(400).json({ message: 'Cannot allocate warden room' });
    if (room.occupants.length >= room.capacity) return res.status(400).json({ message: 'Room is full' });
    if (student.roomId) {
      await Room.findByIdAndUpdate(student.roomId, { $pull: { occupants: student._id } });
    }
    room.occupants.push(student._id);
    room.allocationLogs.push({ studentId: student._id, action: 'assigned', performedBy: req.user._id });
    await room.save();
    student.roomId = room._id;
    student.allocationStatus = 'allocated';
    await student.save();
    res.json({ message: 'Student manually allocated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms/allocate/run', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    const hostel = await Hostel.findById(hostelId);
    const roomSize = hostel.studentsPerRoom || 3;

    const { year: selectedYear } = req.body;
    const yearFilter = selectedYear ? Number(selectedYear) : null;

    const year1Query = { hostelId, year: 1, allocationStatus: 'pending', isMonitored: false, isArchived: false };
    const upperQuery = { hostelId, year: { $gt: 1 }, allocationStatus: 'pending', isMonitored: false, isArchived: false };

    let year1Students = [];
    let upperYearStudents = [];

    if (!yearFilter || yearFilter === 1) {
      year1Students = await Student.find(year1Query);
    }
    if (!yearFilter || yearFilter > 1) {
      if (yearFilter) upperQuery.year = yearFilter;
      upperYearStudents = await Student.find(upperQuery);
    }

    if (year1Students.length === 0 && upperYearStudents.length === 0) {
      return res.json({
        message: yearFilter ? `No pending Year ${yearFilter} students to allocate` : 'No pending students to allocate',
        allocated: 0, waitlisted: 0
      });
    }

    const rooms = await Room.find({ hostelId, isWardenRoom: false }).sort({ floor: 1, roomNumber: 1 });
    const prefs = await RoomPreference.find({ hostelId }).sort({ submittedAt: 1 });
    const prefMap = new Map();
    prefs.forEach(p => prefMap.set(p.studentId.toString(), p.preferredRoommates.map(r => r.toString())));

    const roomPool = rooms.map(r => ({ doc: r, seats: r.capacity - r.occupants.length })).filter(r => r.seats > 0);
    const allocated = new Set();
    const waitlist = [];
    let allocatedCount = 0;

    const assignGroup = async (group) => {
      let remaining = [...group];
      while (remaining.length > 0) {
        const slot = roomPool.find(r => r.seats > 0);
        if (!slot) { remaining.forEach(s => waitlist.push(s)); return; }
        const take = remaining.splice(0, slot.seats);
        for (const student of take) {
          slot.doc.occupants.push(student._id);
          slot.doc.allocationLogs.push({ studentId: student._id, action: 'assigned', performedBy: req.user._id });
          student.roomId = slot.doc._id;
          student.allocationStatus = 'allocated';
          await student.save();
          allocatedCount++;
        }
        await slot.doc.save();
        slot.seats = slot.doc.capacity - slot.doc.occupants.length;
      }
    };

    // Phase 1 — Year 1: group by branch
    const branchMap = {};
    year1Students.forEach(s => { (branchMap[s.branch] = branchMap[s.branch] || []).push(s); });
    const year1Ungrouped = [];
    for (const branch of Object.keys(branchMap)) {
      const list = branchMap[branch];
      while (list.length >= roomSize) {
        const group = list.splice(0, roomSize);
        group.forEach(s => allocated.add(s._id.toString()));
        await assignGroup(group);
      }
      year1Ungrouped.push(...list);
      list.forEach(s => allocated.add(s._id.toString()));
    }
    while (year1Ungrouped.length > 0) { await assignGroup(year1Ungrouped.splice(0, roomSize)); }

    // Phase 2-4 — Year 2/3/4: preference-slip FCFS
    for (const yr of [2, 3, 4]) {
      const cohort = upperYearStudents.filter(s => s.year === yr);
      if (!cohort.length) continue;
      const cohortMap = new Map(cohort.map(s => [s._id.toString(), s]));
      const yearAllocated = new Set();
      const yearPrefs = prefs.filter(p => cohortMap.has(p.studentId.toString()));
      for (const slip of yearPrefs) {
        const submitterId = slip.studentId.toString();
        if (yearAllocated.has(submitterId)) continue;
        const group = [cohortMap.get(submitterId)];
        yearAllocated.add(submitterId);
        for (const prefId of slip.preferredRoommates.map(r => r.toString())) {
          if (yearAllocated.has(prefId)) continue;
          const prefStudent = cohortMap.get(prefId);
          if (!prefStudent) continue;
          if (group.length >= roomSize) break;
          group.push(prefStudent);
          yearAllocated.add(prefId);
        }
        group.forEach(s => allocated.add(s._id.toString()));
        await assignGroup(group);
      }
      const ungrouped = cohort.filter(s => !yearAllocated.has(s._id.toString()));
      const queue = [...ungrouped];
      ungrouped.forEach(s => allocated.add(s._id.toString()));
      while (queue.length > 0) { await assignGroup(queue.splice(0, roomSize)); }
    }

    for (const s of waitlist) { s.allocationStatus = 'waitlist'; await s.save(); }
    res.json({ message: 'Allocation completed', allocated: allocatedCount, waitlisted: waitlist.length });
  } catch (err) {
    console.error('Allocation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms/allocate/override', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { studentId, newRoomId } = req.body;
    const hostelId = req.user.hostelId;
    const student = await Student.findOne({ _id: studentId, hostelId });
    const newRoom = await Room.findOne({ _id: newRoomId, hostelId });
    if (!student || !newRoom) return res.status(404).json({ message: 'Not found' });
    if (newRoom.isWardenRoom) return res.status(400).json({ message: 'Cannot assign warden room' });
    if (newRoom.occupants.length >= newRoom.capacity) return res.status(400).json({ message: 'Room is full' });
    if (student.roomId) await Room.findByIdAndUpdate(student.roomId, { $pull: { occupants: student._id } });
    newRoom.occupants.push(student._id);
    newRoom.allocationLogs.push({ studentId: student._id, action: 'override', performedBy: req.user._id });
    await newRoom.save();
    student.roomId = newRoom._id;
    student.allocationStatus = 'allocated';
    await student.save();
    res.json({ message: 'Override successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ATTENDANCE =====
router.get('/attendance/students', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const students = await Student.find({ hostelId: req.user.hostelId, isArchived: false })
      .populate('userId', 'name email')
      .populate('roomId', 'roomNumber floor')
      .sort({ roomId: 1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/attendance/submit', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { date, records } = req.body;
    const hostelId = req.user.hostelId;
    if (!date || !records) return res.status(400).json({ message: 'date and records required' });
    await Attendance.findOneAndUpdate(
      { hostelId, date },
      { hostelId, date, markedBy: req.user._id, records, submittedAt: new Date() },
      { upsert: true, new: true }
    );
    const absentees = records.filter(r => r.status === 'absent');
    res.json({ message: 'Attendance submitted', absentCount: absentees.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/attendance/:date', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { records } = req.body;
    const hostelId = req.user.hostelId;
    const record = await Attendance.findOneAndUpdate(
      { hostelId, date: req.params.date },
      { records, markedBy: req.user._id, submittedAt: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'No attendance record found for this date' });
    res.json({ message: 'Attendance updated', absentCount: records.filter(r => r.status === 'absent').length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/attendance/:date', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const record = await Attendance.findOne({ hostelId: req.user.hostelId, date: req.params.date })
      .populate({ path: 'records.studentId', populate: { path: 'roomId', select: 'roomNumber floor' } });
    res.json({ attendance: record || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/attendance/history/all', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const records = await Attendance.find({ hostelId: req.user.hostelId })
      .select('date submittedAt records').sort({ date: -1 }).limit(30);
    const summary = records.map(r => ({
      date: r.date,
      present: r.records.filter(x => x.status === 'present').length,
      absent: r.records.filter(x => x.status === 'absent').length,
    }));
    res.json({ history: summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== COMPLAINTS =====
router.get('/complaints', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ hostelId: req.user.hostelId })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/complaints/:id', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { status, wardenReply } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, hostelId: req.user.hostelId },
      { status, wardenReply, repliedBy: req.user._id, repliedAt: new Date() },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint updated', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== NOTICES =====
router.get('/notices', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const notices = await Notice.find({ hostelId: req.user.hostelId })
      .populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json({ notices });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/notices', authRequired, requireRole('warden'),
  uploadNotice.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, publishAt, takedownAt } = req.body;
      if (!title || !publishAt || !takedownAt) return res.status(400).json({ message: 'title, publishAt, takedownAt required' });
      const imagePath = req.files?.image ? `/uploads/notices/${req.files.image[0].filename}` : null;
      const pdfPath = req.files?.pdf ? `/uploads/notices/${req.files.pdf[0].filename}` : null;
      const notice = await Notice.create({
        hostelId: req.user.hostelId, createdBy: req.user._id,
        title, description, imagePath, pdfPath,
        publishAt: new Date(publishAt), takedownAt: new Date(takedownAt),
      });
      res.json({ message: 'Notice posted', notice });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/notices/:id', authRequired, requireRole('warden'), async (req, res) => {
  try {
    await Notice.findOneAndDelete({ _id: req.params.id, hostelId: req.user.hostelId });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== LOST & FOUND =====
router.get('/lostfound', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const items = await LostFound.find({ hostelId: req.user.hostelId })
      .populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== MOVEMENT =====
router.get('/movement', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { date } = req.query;
    const query = { hostelId: req.user.hostelId };
    if (date) query.leaveDate = date;
    const movements = await Movement.find(query)
      .populate({ path: 'studentId', select: 'fullName admissionNumber branch', populate: { path: 'roomId', select: 'roomNumber' } })
      .sort({ createdAt: -1 });
    res.json({ movements });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== RULES =====
router.get('/rules', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const rules = await Rules.findOne({ hostelId: req.user.hostelId });
    res.json({ content: rules?.content || '' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/rules', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { content } = req.body;
    await Rules.findOneAndUpdate(
      { hostelId: req.user.hostelId },
      { content, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ message: 'Rules updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== REPORTS =====
router.get('/reports/students', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { year, branch, district } = req.query;
    const query = { hostelId: req.user.hostelId, isArchived: false };
    if (year) query.year = Number(year);
    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };
    const students = await Student.find(query)
      .populate('userId', 'name email')
      .populate('roomId', 'roomNumber floor')
      .sort({ year: 1, branch: 1, fullName: 1 });
    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== ARCHIVE =====
router.get('/archive', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const students = await Student.find({ hostelId: req.user.hostelId, isArchived: true })
      .populate('userId', 'name email')
      .sort({ archivedAt: -1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/archive/:studentId', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const { reason } = req.body;
    const student = await Student.findOne({ _id: req.params.studentId, hostelId: req.user.hostelId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.roomId) {
      await Room.findByIdAndUpdate(student.roomId, { $pull: { occupants: student._id } });
    }
    student.isArchived = true;
    student.archivedAt = new Date();
    student.archivedReason = reason || 'Graduated / Left hostel';
    student.roomId = null;
    student.allocationStatus = 'pending';
    await student.save();
    res.json({ message: 'Student archived' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/archive/:studentId/restore', authRequired, requireRole('warden'), async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, hostelId: req.user.hostelId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.isArchived = false;
    student.archivedAt = null;
    student.archivedReason = null;
    await student.save();
    res.json({ message: 'Student restored' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;