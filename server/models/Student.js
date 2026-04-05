const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  admissionNumber: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 5 },
  phone: {
    type: String, trim: true,
    validate: { validator: v => !v || /^\d{10}$/.test(v), message: 'Phone must be exactly 10 digits' },
  },
  photo: { type: String, default: null },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  fatherName: { type: String, trim: true },
  fatherPhone: {
    type: String, trim: true,
    validate: { validator: v => !v || /^\d{10}$/.test(v), message: 'Father phone must be exactly 10 digits' },
  },
  fatherEmail: { type: String, trim: true },
  motherName: { type: String, trim: true },
  motherPhone: {
    type: String, trim: true,
    validate: { validator: v => !v || /^\d{10}$/.test(v), message: 'Mother phone must be exactly 10 digits' },
  },
  motherEmail: { type: String, trim: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  allocationStatus: { type: String, enum: ['pending', 'allocated', 'waitlist'], default: 'pending' },
  isMonitored: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  archivedReason: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
