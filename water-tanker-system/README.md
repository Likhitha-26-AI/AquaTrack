# AquaTrack — Water Tanker Management System

A full-stack hackathon-ready system for managing water tanker deliveries in drought-prone districts.

## Tech Stack
- **Frontend**: React + Vite, Socket.io-client, Recharts
- **Backend**: Node.js + Express, Socket.io
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Role-based: Admin, Driver, VillageLeader)

## Quick Start

### Prerequisites
- Node.js >= 16
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

### Demo Credentials (seed data required)
Register an Admin account first, then use the demo login buttons on the login page.

## Features
- JWT auth with 3 roles
- Village demand prediction (AI score = population × consumption - lastDelivered)
- Tanker fleet management
- Delivery scheduling & status tracking
- Socket.io real-time GPS simulation
- Complaint management system
- Alert system for delayed deliveries
- Dashboard with charts and stats
