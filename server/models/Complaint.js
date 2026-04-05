const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  imagePath: { type: String, default: null },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  wardenReply: { type: String, default: null },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  repliedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
