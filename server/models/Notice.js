const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imagePath: { type: String, default: null },
  pdfPath: { type: String, default: null },
  publishAt: { type: Date, required: true },
  takedownAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
