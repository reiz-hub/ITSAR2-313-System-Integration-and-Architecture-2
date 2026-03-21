/**
 * Student Course System - Main Entry Point
 *
 * A simple REST API for managing students, courses, and enrollments.
 * Uses Express.js with in-memory data storage.
 */

const express = require('express');
const path = require('path');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const errorHandler = require('./middleware/errorHandler');
const responseHelper = require('./middleware/responseHelper');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Global Middleware ---------------

// Pretty-print all JSON responses with 2-space indent
app.set('json spaces', 2);

// Parse incoming JSON request bodies
app.use(express.json());

// Serve static frontend files from the public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Attach res.success() and res.fail() helpers to every request
app.use(responseHelper);

// Simple request logger — prints method, url, and timestamp for every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Routes ---------------

app.use('/students', studentRoutes);
app.use('/courses', courseRoutes);
app.use('/enrollments', enrollmentRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.success(200, 'Student Course System API is running', {
    endpoints: {
      students: '/students',
      courses: '/courses',
      enrollments: '/enrollments',
    },
  });
});

// --------------- Error Handling ---------------

// Catch 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: '404 NOT_FOUND',
    message: 'Route not found.'
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// --------------- Start Server ---------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});

module.exports = app;
