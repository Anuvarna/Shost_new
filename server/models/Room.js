const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomNumber: { type: String, required: true, trim: true },
  floor: { type: Number, required: true },
  capacity: { type: Number, required: true, default: 3 },
  isWardenRoom: { type: Boolean, default: false },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  allocationLogs: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    action: { type: String, enum: ['assigned', 'removed', 'override'] },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
