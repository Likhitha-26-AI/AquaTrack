const express = require('express');
const router = express.Router();
const { getDashboardStats, getAlerts, markAlertRead } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/alerts', protect, getAlerts);
router.put('/alerts/:id/read', protect, markAlertRead);

module.exports = router;
