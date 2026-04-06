const Village = require('../models/Village');
const { getPrioritizedVillages, getSingleVillageDemand } = require('../services/demandPredictionService');

const addVillage = async (req, res) => {
  try {
    const village = await Village.create(req.body);
    res.status(201).json(village);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllVillages = async (req, res) => {
  try {
    const villages = await Village.find({}).sort({ demandScore: -1 });
    res.json(villages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVillageById = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) return res.status(404).json({ message: 'Village not found' });
    res.json(village);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVillage = async (req, res) => {
  try {
    const village = await Village.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!village) return res.status(404).json({ message: 'Village not found' });
    res.json(village);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteVillage = async (req, res) => {
  try {
    const village = await Village.findByIdAndDelete(req.params.id);
    if (!village) return res.status(404).json({ message: 'Village not found' });
    res.json({ message: 'Village removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPrioritized = async (req, res) => {
  try {
    const villages = await getPrioritizedVillages();
    res.json(villages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVillageDemand = async (req, res) => {
  try {
    const demand = await getSingleVillageDemand(req.params.id);
    res.json(demand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addVillage, getAllVillages, getVillageById, updateVillage, deleteVillage, getPrioritized, getVillageDemand };
