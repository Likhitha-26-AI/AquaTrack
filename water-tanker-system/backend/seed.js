require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Village = require('./models/Village');
const Tanker = require('./models/Tanker');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/water_tanker_db');
  console.log('MongoDB connected for seeding…');
};

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Village.deleteMany({});
  await Tanker.deleteMany({});

  // Users
  const [admin, driver1, driver2] = await User.insertMany([
    { name: 'Admin User', email: 'admin@aquatrack.in', password: await bcrypt.hash('admin123', 12), role: 'Admin', phone: '9876543210' },
    { name: 'Ravi Kumar', email: 'driver@aquatrack.in', password: await bcrypt.hash('driver123', 12), role: 'Driver', phone: '9876500001' },
    { name: 'Suresh Babu', email: 'driver2@aquatrack.in', password: await bcrypt.hash('driver123', 12), role: 'Driver', phone: '9876500002' },
  ]);

  // Villages
  const villages = await Village.insertMany([
    { name: 'Erode North', district: 'Erode', population: 4200, location: { lat: 11.3410, lng: 77.7172 }, avgDailyConsumptionLiters: 5, lastDeliveredLiters: 8000, contactPerson: 'Murugan S', contactPhone: '9876500010' },
    { name: 'Namakkal East', district: 'Namakkal', population: 3100, location: { lat: 11.2195, lng: 78.1678 }, avgDailyConsumptionLiters: 5, lastDeliveredLiters: 2000, contactPerson: 'Vijay R', contactPhone: '9876500011' },
    { name: 'Salem Rural', district: 'Salem', population: 5800, location: { lat: 11.6643, lng: 78.1460 }, avgDailyConsumptionLiters: 6, lastDeliveredLiters: 12000, contactPerson: 'Lakshmi D', contactPhone: '9876500012' },
    { name: 'Dharmapuri Block', district: 'Dharmapuri', population: 2900, location: { lat: 12.1278, lng: 78.1582 }, avgDailyConsumptionLiters: 5, lastDeliveredLiters: 500, contactPerson: 'Anand K', contactPhone: '9876500013' },
    { name: 'Krishnagiri South', district: 'Krishnagiri', population: 3600, location: { lat: 12.5255, lng: 78.2139 }, avgDailyConsumptionLiters: 5, lastDeliveredLiters: 0, contactPerson: 'Priya M', contactPhone: '9876500014' },
  ]);

  // Update demand scores
  for (const v of villages) {
    v.demandScore = Math.max(0, v.population * v.avgDailyConsumptionLiters - v.lastDeliveredLiters);
    v.isShortage = v.demandScore > v.population * 5 * 2;
    await v.save();
  }

  // Tankers
  await Tanker.insertMany([
    { vehicleNumber: 'TN33AB1234', capacityLiters: 12000, status: 'available', driver: driver1._id, model: 'Tata 407', yearManufactured: 2019, currentLocation: { lat: 11.1271, lng: 78.6569 } },
    { vehicleNumber: 'TN33CD5678', capacityLiters: 8000, status: 'available', driver: driver2._id, model: 'Ashok Leyland', yearManufactured: 2020, currentLocation: { lat: 11.2271, lng: 78.7569 } },
    { vehicleNumber: 'TN33EF9012', capacityLiters: 15000, status: 'maintenance', model: 'TATA 1109', yearManufactured: 2018, currentLocation: { lat: 11.0271, lng: 78.5569 } },
  ]);

  // Village Leader user
  await User.create({ name: 'Murugan S', email: 'leader@aquatrack.in', password: await bcrypt.hash('leader123', 12), role: 'VillageLeader', village: villages[0]._id, phone: '9876500010' });

  console.log('✅ Seed complete!');
  console.log('Demo logins:');
  console.log('  Admin:         admin@aquatrack.in / admin123');
  console.log('  Driver:        driver@aquatrack.in / driver123');
  console.log('  VillageLeader: leader@aquatrack.in / leader123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
