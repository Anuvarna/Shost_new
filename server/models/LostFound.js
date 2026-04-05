const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imagePath: { type: String, default: null },
  status: { type: String, enum: ['open', 'claimed', 'resolved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('LostFound', lostFoundSchema);
