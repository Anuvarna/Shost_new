const express = require('express');
const Student = require('../models/Student');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/students
// Query: year, branch, district, hostelId (admin can pass any hostelId, warden uses own)
router.get('/students', authRequired, requireRole('admin', 'warden'), async (req, res) => {
  try {
    const { year, branch, district } = req.query;
    let hostelId = req.query.hostelId;

    // Wardens can only see their own hostel
    if (req.user.role === 'warden') {
      hostelId = req.user.hostelId;
    }

    const query = {};
    if (hostelId) query.hostelId = hostelId;
    if (year) query.year = Number(year);
    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };

    const students = await Student.find(query)
      .populate('userId', 'name email')
      .populate('hostelId', 'name gender')
      .populate('roomId', 'roomNumber floor')
      .sort({ year: 1, branch: 1, fullName: 1 });

    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/filters — get distinct values for filter dropdowns
router.get('/filters', authRequired, requireRole('admin', 'warden'), async (req, res) => {
  try {
    let hostelId = req.query.hostelId;
    if (req.user.role === 'warden') hostelId = req.user.hostelId;

    const query = hostelId ? { hostelId } : {};
    const [branches, districts] = await Promise.all([
      Student.distinct('branch', query),
      Student.distinct('district', query),
    ]);
    res.json({ branches: branches.filter(Boolean).sort(), districts: districts.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
