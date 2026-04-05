const express = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', folder)),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const uploadBulk = multer({ storage: makeStorage('bulk'), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadPhoto = multer({ storage: makeStorage('photos'), limits: { fileSize: 3 * 1024 * 1024 } });

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function sendCredentialEmail(to, name, password, role) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log(`[EMAIL SKIPPED] No credentials set. Password for ${name}: ${password}`);
    return { skipped: true };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"HostX System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `HostX - Your ${role} Account Credentials`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <div style="background:#7c3aed;padding:1.5rem 2rem;">
          <h2 style="color:#fff;margin:0;">HostX Hostel Management</h2>
        </div>
        <div style="padding:2rem;">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your <strong>${role}</strong> account has been created on HostX.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1.25rem;margin:1.25rem 0;">
            <p style="margin:0 0 0.5rem;font-weight:600;">Login Details</p>
            <p style="margin:0.4rem 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin:0.4rem 0;"><strong>Temporary Password:</strong>
              <code style="background:#ede9fe;color:#7c3aed;padding:3px 8px;border-radius:4px;">${password}</code>
            </p>
          </div>
          <p style="color:#ef4444;"><strong>Please log in and change your password immediately.</strong></p>
          <p style="color:#94a3b8;font-size:0.8rem;">This is an automated message from HostX.</p>
        </div>
      </div>`,
    });
    console.log(`[EMAIL SENT] Credentials sent to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
    return { error: err.message };
  }
}

// ===== HOSTELS =====
router.get('/hostels', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const hostels = await Hostel.find().populate('wardens', 'name email');
    const enriched = await Promise.all(hostels.map(async h => {
      const studentCount = await Student.countDocuments({ hostelId: h._id, isArchived: false });
      return { ...h.toObject(), studentCount };
    }));
    res.json({ hostels: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/hostels', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, gender, totalFloors, studentsPerRoom } = req.body;
    if (!name || !gender) return res.status(400).json({ message: 'Name and gender are required' });
    const hostel = await Hostel.create({ name, description, gender, totalFloors, studentsPerRoom });
    res.json({ message: 'Hostel created', hostel });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Hostel name already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/hostels/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    res.json({ message: 'Hostel updated', hostel });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET hostel details with students list
router.get('/hostels/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('wardens', 'name email');
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    const students = await Student.find({ hostelId: hostel._id, isArchived: false })
      .populate('userId', 'name email')
      .populate('roomId', 'roomNumber floor')
      .sort({ year: 1, branch: 1, fullName: 1 });
    const archivedCount = await Student.countDocuments({ hostelId: hostel._id, isArchived: true });
    res.json({ hostel, students, archivedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== WARDENS =====
router.get('/wardens', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const wardens = await User.find({ role: 'warden' }).select('-password').populate('hostelId', 'name gender');
    res.json({ wardens });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/wardens', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, hostelId } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
    if (/\d/.test(name)) return res.status(400).json({ message: 'Name must not contain numbers' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const tempPassword = generatePassword();
    const warden = await User.create({
      name, email: email.toLowerCase(), password: tempPassword, phone,
      role: 'warden', hostelId: hostelId || null, mustChangePassword: true,
    });
    if (hostelId) await Hostel.findByIdAndUpdate(hostelId, { $addToSet: { wardens: warden._id } });
    await sendCredentialEmail(email, name, tempPassword, 'Warden');
    res.json({ message: 'Warden created', warden: { id: warden._id, name, email, phone, hostelId }, tempPassword });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/wardens/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const warden = await User.findOneAndDelete({ _id: req.params.id, role: 'warden' });
    if (!warden) return res.status(404).json({ message: 'Warden not found' });
    await Hostel.updateMany({}, { $pull: { wardens: warden._id } });
    res.json({ message: 'Warden deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== STUDENTS =====
router.get('/students', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { archived } = req.query;
    const query = archived === 'true' ? { isArchived: true } : { isArchived: false };
    const students = await Student.find(query)
      .populate('userId', 'name email')
      .populate('hostelId', 'name gender')
      .populate('roomId', 'roomNumber floor');
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/students', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, hostelId, admissionNumber, branch, year, phone, district, state,
      fatherName, fatherPhone, fatherEmail, motherName, motherPhone, motherEmail } = req.body;

    // Validation
    if (!name || !email || !hostelId || !admissionNumber || !branch || !year)
      return res.status(400).json({ message: 'Required fields missing' });
    if (phone && !/^\d{10}$/.test(phone))
      return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
    if (fatherPhone && !/^\d{10}$/.test(fatherPhone))
      return res.status(400).json({ message: 'Father phone must be exactly 10 digits' });
    if (motherPhone && !/^\d{10}$/.test(motherPhone))
      return res.status(400).json({ message: 'Mother phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const existingAdm = await Student.findOne({ admissionNumber });
    if (existingAdm) return res.status(400).json({ message: 'Admission number already exists' });

    const tempPassword = generatePassword();
    const user = await User.create({
      name, email: email.toLowerCase(), password: tempPassword,
      role: 'student', hostelId, mustChangePassword: true,
    });
    const student = await Student.create({
      userId: user._id, hostelId, admissionNumber, fullName: name,
      branch, year, phone, district, state,
      fatherName, fatherPhone, fatherEmail, motherName, motherPhone, motherEmail,
    });
    await sendCredentialEmail(email, name, tempPassword, 'Student');
    res.json({ message: 'Student created', student, tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Upload student photo
router.post('/students/:id/photo', authRequired, requireRole('admin'), uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });
    const photoPath = `/uploads/photos/${req.file.filename}`;
    const student = await Student.findByIdAndUpdate(req.params.id, { photo: photoPath }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Photo uploaded', photo: photoPath });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/students/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { phone, fatherPhone, motherPhone } = req.body;
    if (phone && !/^\d{10}$/.test(phone)) return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
    if (fatherPhone && !/^\d{10}$/.test(fatherPhone)) return res.status(400).json({ message: 'Father phone must be exactly 10 digits' });
    if (motherPhone && !/^\d{10}$/.test(motherPhone)) return res.status(400).json({ message: 'Mother phone must be exactly 10 digits' });
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (req.body.fullName) await User.findByIdAndUpdate(student.userId, { name: req.body.fullName });
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/students/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await User.findByIdAndDelete(student.userId);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== BULK UPLOAD =====
// Frontend sends parsed JSON array (students + hostelId) — no file needed on backend
router.post('/students/bulk', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { students: list, hostelId } = req.body;
    if (!list || !Array.isArray(list) || list.length === 0)
      return res.status(400).json({ message: 'Student list is required' });
    if (!hostelId)
      return res.status(400).json({ message: 'Hostel is required' });

    const results = { created: 0, failed: 0, errors: [], passwords: [] };

    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      const rowNum = i + 1;
      try {
        const name = row.name || row.fullName;
        const admissionNumber = String(row.admissionNumber || '').trim();
        const branch = row.branch;
        const year = Number(row.year);
        const email = row.email || `${admissionNumber.toLowerCase()}@hostx.com`;
        const phone = String(row.phone || '').replace(/\D/g, '');
        const fatherPhone = String(row.fatherPhone || '').replace(/\D/g, '');
        const motherPhone = String(row.motherPhone || '').replace(/\D/g, '');

        if (!name || !admissionNumber || !branch || !year) {
          results.failed++;
          results.errors.push({ row: rowNum, error: 'Missing required fields (name, admissionNumber, branch, year)' });
          continue;
        }
        if (phone && phone.length !== 10) {
          results.failed++;
          results.errors.push({ row: rowNum, error: `Phone must be 10 digits` });
          continue;
        }

        const existingAdm = await Student.findOne({ admissionNumber });
        if (existingAdm) {
          results.failed++;
          results.errors.push({ row: rowNum, error: `Admission number ${admissionNumber} already exists` });
          continue;
        }
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
          results.failed++;
          results.errors.push({ row: rowNum, error: `Email ${email} already exists` });
          continue;
        }

        const tempPassword = generatePassword();
        const user = await User.create({
          name, email: email.toLowerCase(), password: tempPassword,
          role: 'student', hostelId, mustChangePassword: true,
        });
        await Student.create({
          userId: user._id, hostelId, admissionNumber, fullName: name,
          branch, year,
          phone: phone || undefined,
          district: row.district || '',
          state: row.state || 'Kerala',
          fatherName: row.fatherName || '',
          fatherPhone: fatherPhone || undefined,
          fatherEmail: row.fatherEmail || '',
          motherName: row.motherName || '',
          motherPhone: motherPhone || undefined,
          motherEmail: row.motherEmail || '',
        });

        // Send email (won't crash if not configured)
        await sendCredentialEmail(email, name, tempPassword, 'Student');

        results.created++;
        results.passwords.push({ name, email, admissionNumber, tempPassword });
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, error: err.message });
      }
    }

    res.json({
      message: `Bulk upload complete. ${results.created} created, ${results.failed} failed.`,
      created: results.created,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
      passwords: results.passwords,
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ===== DASHBOARD =====
router.get('/dashboard', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const [totalStudents, totalWardens, totalHostels] = await Promise.all([
      Student.countDocuments({ isArchived: false }),
      User.countDocuments({ role: 'warden' }),
      Hostel.countDocuments(),
    ]);
    const hostels = await Hostel.find().populate('wardens', 'name');
    const hostelStats = await Promise.all(hostels.map(async h => {
      const studentCount = await Student.countDocuments({ hostelId: h._id, isArchived: false });
      return { _id: h._id, name: h.name, gender: h.gender, studentCount, wardenCount: h.wardens.length };
    }));
    res.json({ totalStudents, totalWardens, totalHostels, hostelStats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// ===== ARCHIVE =====
router.post('/students/:id/archive', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id,
      { isArchived: true, archivedAt: new Date(), archivedReason: reason || 'Left hostel' },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student archived', student });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/students/:id/restore', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id,
      { isArchived: false, archivedAt: null, archivedReason: null },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student restored', student });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/students/archived', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const students = await Student.find({ isArchived: true })
      .populate('userId', 'name email')
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ archivedAt: -1 });
    res.json({ students });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== PROMOTE =====
// Promote selected students to a new year
router.post('/students/promote', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { studentIds, toYear } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0)
      return res.status(400).json({ message: 'Select at least one student' });
    if (!toYear || toYear < 1 || toYear > 5)
      return res.status(400).json({ message: 'Invalid year. Must be between 1 and 5' });

    const result = await Student.updateMany(
      { _id: { $in: studentIds }, isArchived: false },
      { $set: { year: Number(toYear) } }
    );
    res.json({ message: `${result.modifiedCount} student(s) promoted to Year ${toYear}`, updated: result.modifiedCount });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});
