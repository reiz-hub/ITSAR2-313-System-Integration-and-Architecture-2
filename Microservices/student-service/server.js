/**
 * Student Service — Microservice Entry Point
 *
 * Runs independently on its own port.
 * Manages only student data (CRUD operations).
 */

const express = require('express');
const studentRoutes = require('./routes/studentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { ready: dbReady } = require('./models/studentModel');

// Load environment variables from .env file (simple approach without dotenv)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Pretty-print JSON responses
app.set('json spaces', 2);

// --------------- Middleware ---------------

app.use(express.json());

// CORS — allow requests from the API gateway and frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`[Student Service] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Routes ---------------

app.use('/students', studentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'student-service', status: 'running', port: PORT });
});

// --------------- Error Handling ---------------

app.use((req, res) => {
  res.status(404).json({
    error: '404 NOT_FOUND',
    message: 'Route not found.'
  });
});

app.use(errorHandler);

// --------------- Start Server ---------------

dbReady.then(() => {
  app.listen(PORT, () => {
    console.log(`Student Service running on http://localhost:${PORT}`);
  });
});

module.exports = app;
