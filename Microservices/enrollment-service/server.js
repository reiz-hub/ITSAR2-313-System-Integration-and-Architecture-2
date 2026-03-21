/**
 * Enrollment Service — Microservice Entry Point
 *
 * Runs independently on its own port.
 * Manages enrollment data and communicates with Student Service
 * and Course Service via HTTP to validate references.
 */

const express = require('express');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { ready: dbReady } = require('./models/enrollmentModel');

// Load .env
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
const PORT = process.env.PORT || 3003;

// Pretty-print JSON responses
app.set('json spaces', 2);

// --------------- Middleware ---------------

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`[Enrollment Service] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Routes ---------------

app.use('/enrollments', enrollmentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'enrollment-service', status: 'running', port: PORT });
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
    console.log(`Enrollment Service running on http://localhost:${PORT}`);
  });
});

module.exports = app;
