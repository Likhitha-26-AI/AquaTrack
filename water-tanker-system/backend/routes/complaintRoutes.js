const express = require('express');
const router = express.Router();
const { raiseComplaint, getAllComplaints, getComplaintById, resolveComplaint } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAllComplaints)
  .post(protect, raiseComplaint);
router.route('/:id')
  .get(protect, getComplaintById)
  .put(protect, authorize('Admin'), resolveComplaint);

module.exports = router;
