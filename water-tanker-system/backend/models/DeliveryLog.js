const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema({
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
  village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  tanker: { type: mongoose.Schema.Types.ObjectId, ref: 'Tanker', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quantityDeliveredLiters: { type: Number, required: true },
  deliveredAt: { type: Date, default: Date.now },
  receivedBy: { type: String },
  remarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);
