const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  destination: { type: String, required: true, trim: true },
  leaveDate: { type: String, required: true },   // YYYY-MM-DD
  leaveTime: { type: String, required: true },   // HH:MM
  returnDate: { type: String, required: true },  // YYYY-MM-DD
  returnTime: { type: String, required: true },  // HH:MM
  reason: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'returned'], default: 'submitted' },
}, { timestamps: true });

module.exports = mongoose.model('Movement', movementSchema);
