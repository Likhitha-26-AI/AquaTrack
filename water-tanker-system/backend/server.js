require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const villageRoutes = require('./routes/villageRoutes');
const tankerRoutes = require('./routes/tankerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

// Attach io to each request
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/villages', villageRoutes);
app.use('/api/tankers', tankerRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(notFound);
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Simulated GPS movement for a delivery
  socket.on('start_tracking', (data) => {
    const { deliveryId, startLat, startLng, endLat, endLng } = data;
    let step = 0;
    const steps = 20;
    const latStep = (endLat - startLat) / steps;
    const lngStep = (endLng - startLng) / steps;

    const interval = setInterval(() => {
      if (step >= steps) {
        clearInterval(interval);
        io.emit('delivery_completed_tracking', { deliveryId });
        return;
      }
      const currentLat = startLat + latStep * step;
      const currentLng = startLng + lngStep * step;
      io.emit('delivery_location_update', { deliveryId, location: { lat: currentLat, lng: currentLng }, step, steps });
      step++;
    }, 1500);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
