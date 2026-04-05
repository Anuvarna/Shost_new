const mongoose = require('mongoose');

const roomPreferenceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  preferredRoommates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('RoomPreference', roomPreferenceSchema);
