const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  district: { type: String, required: true },
  population: { type: Number, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  avgDailyConsumptionLiters: { type: Number, default: 5 },
  lastDeliveredLiters: { type: Number, default: 0 },
  lastDeliveryDate: { type: Date },
  demandScore: { type: Number, default: 0 },
  isShortage: { type: Boolean, default: false },
  contactPerson: { type: String },
  contactPhone: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Village', villageSchema);
