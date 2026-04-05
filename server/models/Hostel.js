const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  gender: { type: String, enum: ['Boys', 'Girls'], required: true },
  totalFloors: { type: Number, default: 0 },
  wardenRoomsPerFloor: { type: Number, default: 2 },
  studentsPerRoom: { type: Number, default: 3 },
  wardens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  slipEnabled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Hostel', hostelSchema);
