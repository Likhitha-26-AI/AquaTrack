const express = require('express');
const router = express.Router();
const {
  addTanker, getAllTankers, getTankerById,
  updateTanker, deleteTanker, updateLocation, getAvailableTankers
} = require('../controllers/tankerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/available', protect, getAvailableTankers);
router.route('/')
  .get(protect, getAllTankers)
  .post(protect, authorize('Admin'), addTanker);
router.route('/:id')
  .get(protect, getTankerById)
  .put(protect, authorize('Admin', 'Driver'), updateTanker)
  .delete(protect, authorize('Admin'), deleteTanker);
router.put('/:id/location', protect, updateLocation);

module.exports = router;
