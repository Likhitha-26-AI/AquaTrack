const Complaint = require('../models/Complaint');
const { createAlert } = require('../services/alertService');

const raiseComplaint = async (req, res) => {
  try {
    const { village, delivery, subject, description, priority } = req.body;
    const complaint = await Complaint.create({
      raisedBy: req.user._id, village, delivery, subject, description, priority: priority || 'medium',
    });
    await createAlert({
      type: 'complaint',
      message: `New complaint: ${subject} from village`,
      village,
      severity: priority === 'critical' ? 'critical' : 'warning',
    });
    const populated = await Complaint.findById(complaint._id).populate('raisedBy', 'name email').populate('village', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.village) filter.village = req.query.village;
    if (req.user.role === 'VillageLeader') filter.raisedBy = req.user._id;
    const complaints = await Complaint.find(filter)
      .populate('raisedBy', 'name email')
      .populate('village', 'name district')
      .populate('delivery', 'scheduledDate status')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('raisedBy', 'name email')
      .populate('village', 'name district')
      .populate('resolvedBy', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveComplaint = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    ).populate('raisedBy', 'name').populate('village', 'name');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { raiseComplaint, getAllComplaints, getComplaintById, resolveComplaint };
