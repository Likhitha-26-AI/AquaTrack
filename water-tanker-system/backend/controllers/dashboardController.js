const Delivery = require('../models/Delivery');
const Village = require('../models/Village');
const Tanker = require('../models/Tanker');
const Complaint = require('../models/Complaint');
const DeliveryLog = require('../models/DeliveryLog');
const Alert = require('../models/Alert');
const { checkAndFlagDelayedDeliveries } = require('../services/alertService');

const getDashboardStats = async (req, res) => {
  try {
    await checkAndFlagDelayedDeliveries(req.io);

    const [
      totalDeliveries,
      pendingDeliveries,
      inProgressDeliveries,
      completedDeliveries,
      totalVillages,
      shortageVillages,
      availableTankers,
      busyTankers,
      openComplaints,
      unreadAlerts,
    ] = await Promise.all([
      Delivery.countDocuments(),
      Delivery.countDocuments({ status: 'pending' }),
      Delivery.countDocuments({ status: 'in-progress' }),
      Delivery.countDocuments({ status: 'completed' }),
      Village.countDocuments(),
      Village.countDocuments({ isShortage: true }),
      Tanker.countDocuments({ status: 'available' }),
      Tanker.countDocuments({ status: 'busy' }),
      Complaint.countDocuments({ status: { $in: ['open', 'in-review'] } }),
      Alert.countDocuments({ isRead: false }),
    ]);

    const waterStats = await DeliveryLog.aggregate([
      { $group: { _id: null, totalWater: { $sum: '$quantityDeliveredLiters' } } },
    ]);
    const totalWaterDistributed = waterStats[0]?.totalWater || 0;

    const delayedDeliveries = await Delivery.countDocuments({ isDelayed: true, status: 'pending' });

    const recentDeliveries = await Delivery.find({ status: 'completed' })
      .sort({ endTime: -1 })
      .limit(5)
      .populate('village', 'name district')
      .populate('tanker', 'vehicleNumber');

    const topDemandVillages = await Village.find({}).sort({ demandScore: -1 }).limit(5);

    const recentAlerts = await Alert.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('village', 'name');

    res.json({
      stats: {
        totalDeliveries, pendingDeliveries, inProgressDeliveries,
        completedDeliveries, totalVillages, shortageVillages,
        availableTankers, busyTankers, openComplaints,
        unreadAlerts, totalWaterDistributed, delayedDeliveries,
      },
      recentDeliveries,
      topDemandVillages,
      recentAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('village', 'name')
      .populate('delivery');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getAlerts, markAlertRead };
