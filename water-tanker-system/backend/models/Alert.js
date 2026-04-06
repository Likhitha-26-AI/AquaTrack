const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['delay', 'shortage', 'complaint', 'system'], required: true },
  message: { type: String, required: true },
  village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  isRead: { type: Boolean, default: false },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
