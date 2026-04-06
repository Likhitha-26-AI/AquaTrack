const Delivery = require('../models/Delivery');
const Tanker = require('../models/Tanker');
const Village = require('../models/Village');
const DeliveryLog = require('../models/DeliveryLog');
const { createAlert } = require('../services/alertService');

const scheduleDelivery = async (req, res) => {
  try {
    const { tanker, village, scheduledDate, scheduledTime, quantityScheduledLiters, notes } = req.body;
    const tankerDoc = await Tanker.findById(tanker);
    if (!tankerDoc) return res.status(404).json({ message: 'Tanker not found' });
    if (tankerDoc.status !== 'available') return res.status(400).json({ message: 'Tanker is not available' });

    const delivery = await Delivery.create({
      tanker, village, driver: tankerDoc.driver,
      scheduledDate, scheduledTime, quantityScheduledLiters, notes
    });
    await Tanker.findByIdAndUpdate(tanker, { status: 'busy' });
    const populated = await Delivery.findById(delivery._id).populate('tanker village driver');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllDeliveries = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.village) filter.village = req.query.village;
    const deliveries = await Delivery.find(filter)
      .populate('tanker', 'vehicleNumber capacityLiters')
      .populate('village', 'name district')
      .populate('driver', 'name phone')
      .sort({ scheduledDate: -1 });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('tanker').populate('village').populate('driver');
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, quantityDeliveredLiters, notes } = req.body;
    const delivery = await Delivery.findById(req.params.id).populate('village tanker');
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    delivery.status = status;
    if (notes) delivery.notes = notes;

    if (status === 'in-progress') {
      delivery.startTime = new Date();
    }

    if (status === 'completed') {
      delivery.endTime = new Date();
      delivery.quantityDeliveredLiters = quantityDeliveredLiters || delivery.quantityScheduledLiters;

      await Tanker.findByIdAndUpdate(delivery.tanker._id, { status: 'available' });

      await Village.findByIdAndUpdate(delivery.village._id, {
        lastDeliveredLiters: quantityDeliveredLiters || delivery.quantityScheduledLiters,
        lastDeliveryDate: new Date(),
      });

      await DeliveryLog.create({
        delivery: delivery._id,
        village: delivery.village._id,
        tanker: delivery.tanker._id,
        driver: delivery.driver,
        quantityDeliveredLiters: quantityDeliveredLiters || delivery.quantityScheduledLiters,
        deliveredAt: new Date(),
      });
    }

    if (status === 'cancelled') {
      await Tanker.findByIdAndUpdate(delivery.tanker._id, { status: 'available' });
    }

    await delivery.save();
    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getDeliveryLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.village) filter.village = req.query.village;
    const logs = await DeliveryLog.find(filter)
      .populate('village', 'name district')
      .populate('tanker', 'vehicleNumber')
      .populate('driver', 'name')
      .sort({ deliveredAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLiveLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { currentLocation: { lat, lng } },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    req.io?.emit('delivery_location_update', { deliveryId: delivery._id, location: { lat, lng } });
    res.json({ message: 'Location updated', location: { lat, lng } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { scheduleDelivery, getAllDeliveries, getDeliveryById, updateDeliveryStatus, getDeliveryLogs, updateLiveLocation };
