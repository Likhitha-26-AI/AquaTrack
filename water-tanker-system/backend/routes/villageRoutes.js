const express = require('express');
const router = express.Router();
const {
  addVillage, getAllVillages, getVillageById,
  updateVillage, deleteVillage, getPrioritized, getVillageDemand
} = require('../controllers/villageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/prioritized', protect, getPrioritized);
router.route('/')
  .get(protect, getAllVillages)
  .post(protect, authorize('Admin'), addVillage);
router.route('/:id')
  .get(protect, getVillageById)
  .put(protect, authorize('Admin'), updateVillage)
  .delete(protect, authorize('Admin'), deleteVillage);
router.get('/:id/demand', protect, getVillageDemand);

module.exports = router;
