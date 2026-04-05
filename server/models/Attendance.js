const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
  }],
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// unique per hostel per date
attendanceSchema.index({ hostelId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
