const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  tanker: { type: mongoose.Schema.Types.ObjectId, ref: 'Tanker', required: true },
  village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  quantityScheduledLiters: { type: Number, required: true },
  quantityDeliveredLiters: { type: Number, default: 0 },
  startTime: { type: Date },
  endTime: { type: Date },
  isDelayed: { type: Boolean, default: false },
  alertSent: { type: Boolean, default: false },
  notes: { type: String },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
