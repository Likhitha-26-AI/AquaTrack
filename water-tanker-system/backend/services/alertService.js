const Alert = require('../models/Alert');
const Delivery = require('../models/Delivery');

const createAlert = async ({ type, message, village, delivery, severity }) => {
  return await Alert.create({ type, message, village, delivery, severity: severity || 'warning' });
};

const checkAndFlagDelayedDeliveries = async (io) => {
  const now = new Date();
  const overdueDeliveries = await Delivery.find({
    status: 'pending',
    scheduledDate: { $lt: now },
    isDelayed: false,
  }).populate('village tanker');

  for (const delivery of overdueDeliveries) {
    delivery.isDelayed = true;
    delivery.alertSent = true;
    await delivery.save();

    const alert = await createAlert({
      type: 'delay',
      message: `Delivery to ${delivery.village?.name || 'Unknown Village'} is overdue (scheduled: ${delivery.scheduledDate.toLocaleDateString()})`,
      village: delivery.village?._id,
      delivery: delivery._id,
      severity: 'critical',
    });

    if (io) {
      io.emit('alert', alert);
    }
  }
  return overdueDeliveries.length;
};

const getUnreadAlerts = async () => {
  return await Alert.find({ isRead: false }).sort({ createdAt: -1 }).populate('village delivery');
};

const markAlertRead = async (alertId) => {
  return await Alert.findByIdAndUpdate(alertId, { isRead: true }, { new: true });
};

module.exports = { createAlert, checkAndFlagDelayedDeliveries, getUnreadAlerts, markAlertRead };
