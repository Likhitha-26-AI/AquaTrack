const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-review', 'resolved', 'rejected'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  resolutionNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
