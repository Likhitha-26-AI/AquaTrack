const Tanker = require('../models/Tanker');

const addTanker = async (req, res) => {
  try {
    const tanker = await Tanker.create(req.body);
    res.status(201).json(tanker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllTankers = async (req, res) => {
  try {
    const tankers = await Tanker.find({}).populate('driver', 'name email phone');
    res.json(tankers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTankerById = async (req, res) => {
  try {
    const tanker = await Tanker.findById(req.params.id).populate('driver', 'name email phone');
    if (!tanker) return res.status(404).json({ message: 'Tanker not found' });
    res.json(tanker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTanker = async (req, res) => {
  try {
    const tanker = await Tanker.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('driver', 'name email');
    if (!tanker) return res.status(404).json({ message: 'Tanker not found' });
    res.json(tanker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTanker = async (req, res) => {
  try {
    const tanker = await Tanker.findByIdAndDelete(req.params.id);
    if (!tanker) return res.status(404).json({ message: 'Tanker not found' });
    res.json({ message: 'Tanker removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const tanker = await Tanker.findByIdAndUpdate(
      req.params.id,
      { currentLocation: { lat, lng } },
      { new: true }
    );
    if (!tanker) return res.status(404).json({ message: 'Tanker not found' });
    req.io?.emit('tanker_location', { tankerId: tanker._id, location: { lat, lng }, vehicleNumber: tanker.vehicleNumber });
    res.json(tanker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAvailableTankers = async (req, res) => {
  try {
    const tankers = await Tanker.find({ status: 'available' }).populate('driver', 'name phone');
    res.json(tankers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addTanker, getAllTankers, getTankerById, updateTanker, deleteTanker, updateLocation, getAvailableTankers };
