const mongoose = require('mongoose');

const tankerSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true, uppercase: true },
  capacityLiters: { type: Number, required: true },
  currentWaterLevel: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'busy', 'maintenance'], default: 'available' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentLocation: {
    lat: { type: Number, default: 11.1271 },
    lng: { type: Number, default: 78.6569 },
  },
  model: { type: String },
  yearManufactured: { type: Number },
  lastServiced: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Tanker', tankerSchema);
