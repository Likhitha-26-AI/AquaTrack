const Village = require('../models/Village');

const AVG_LITERS_PER_PERSON_PER_DAY = 5;

const calculateDemandScore = (population, avgConsumption, lastDeliveredLiters) => {
  const dailyNeed = population * avgConsumption;
  const demandScore = dailyNeed - lastDeliveredLiters;
  return Math.max(0, demandScore);
};

const updateAllVillageDemandScores = async () => {
  const villages = await Village.find({});
  for (const village of villages) {
    const score = calculateDemandScore(
      village.population,
      village.avgDailyConsumptionLiters || AVG_LITERS_PER_PERSON_PER_DAY,
      village.lastDeliveredLiters || 0
    );
    village.demandScore = score;
    village.isShortage = score > village.population * AVG_LITERS_PER_PERSON_PER_DAY * 2;
    await village.save();
  }
};

const getPrioritizedVillages = async () => {
  await updateAllVillageDemandScores();
  const villages = await Village.find({}).sort({ demandScore: -1 });
  return villages;
};

const getSingleVillageDemand = async (villageId) => {
  const village = await Village.findById(villageId);
  if (!village) throw new Error('Village not found');
  const score = calculateDemandScore(
    village.population,
    village.avgDailyConsumptionLiters || AVG_LITERS_PER_PERSON_PER_DAY,
    village.lastDeliveredLiters || 0
  );
  return {
    village: village.name,
    population: village.population,
    dailyNeed: village.population * (village.avgDailyConsumptionLiters || AVG_LITERS_PER_PERSON_PER_DAY),
    lastDelivered: village.lastDeliveredLiters,
    demandScore: score,
    isShortage: score > village.population * AVG_LITERS_PER_PERSON_PER_DAY * 2,
    priority: score > 5000 ? 'CRITICAL' : score > 2000 ? 'HIGH' : score > 500 ? 'MEDIUM' : 'LOW',
  };
};

module.exports = { calculateDemandScore, getPrioritizedVillages, updateAllVillageDemandScores, getSingleVillageDemand };
