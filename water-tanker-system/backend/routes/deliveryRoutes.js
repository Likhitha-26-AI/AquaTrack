const express = require('express');
const router = express.Router();
const {
  scheduleDelivery, getAllDeliveries, getDeliveryById,
  updateDeliveryStatus, getDeliveryLogs, updateLiveLocation
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/logs', protect, getDeliveryLogs);
router.route('/')
  .get(protect, getAllDeliveries)
  .post(protect, authorize('Admin'), scheduleDelivery);
router.route('/:id')
  .get(protect, getDeliveryById)
  .put(protect, authorize('Admin', 'Driver'), updateDeliveryStatus);
router.put('/:id/location', protect, updateLiveLocation);

module.exports = router;
