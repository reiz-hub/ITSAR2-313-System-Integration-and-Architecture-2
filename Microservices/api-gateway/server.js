/**
 * API Gateway — Single entry point for the frontend
 *
 * This gateway:
 *   1. Serves the static frontend files (HTML, CSS, JS)
 *   2. Proxies API requests to the correct microservice:
 *      - /students/*  -> Student Service  (port 3001)
 *      - /courses/*   -> Course Service   (port 3002)
 *      - /enrollments/* -> Enrollment Service (port 3003)
 *
 * The frontend code doesn't need to know about individual service ports.
 * It just calls /students, /courses, /enrollments on the same origin.
 */

const express = require('express');
const path = require('path');

// Load .env
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Pretty-print JSON responses
app.set('json spaces', 2);

// Service URLs from environment
const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';

// --------------- Middleware ---------------

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Request logger
app.use((req, res, next) => {
  console.log(`[API Gateway] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Proxy Helper ---------------

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Forwards the incoming request to the target service URL.
 * Passes along the method, headers, and body.
 * Handles timeout (504) and dependency down (503) errors.
 */
async function proxyRequest(targetUrl, req, res) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };

    // Only include body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    clearTimeout(timeoutId);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`Proxy error for ${targetUrl}:`, err.message);

    // Check if it's a timeout error (AbortError)
    if (err.name === 'AbortError') {
      return res.status(504).json({
        error: '504 GATEWAY_TIMEOUT',
        message: 'The upstream service did not respond in time.'
      });
    }

    // Connection refused, DNS failure, or other network errors
    res.status(503).json({
      error: '503 SERVICE_UNAVAILABLE',
      message: 'The requested service is currently unavailable.'
    });
  }
}

// --------------- Proxy Routes ---------------

// Forward /students/* to Student Service
app.all('/students/*', (req, res) => {
  const targetPath = req.originalUrl; // e.g. /students/abc-123
  proxyRequest(`${STUDENT_SERVICE_URL}${targetPath}`, req, res);
});
app.all('/students', (req, res) => {
  proxyRequest(`${STUDENT_SERVICE_URL}/students`, req, res);
});

// Forward /courses/* to Course Service
app.all('/courses/*', (req, res) => {
  const targetPath = req.originalUrl;
  proxyRequest(`${COURSE_SERVICE_URL}${targetPath}`, req, res);
});
app.all('/courses', (req, res) => {
  proxyRequest(`${COURSE_SERVICE_URL}/courses`, req, res);
});

// Forward /enrollments/* to Enrollment Service
app.all('/enrollments/*', (req, res) => {
  const targetPath = req.originalUrl;
  proxyRequest(`${ENROLLMENT_SERVICE_URL}${targetPath}`, req, res);
});
app.all('/enrollments', (req, res) => {
  proxyRequest(`${ENROLLMENT_SERVICE_URL}/enrollments`, req, res);
});

// --------------- Health Check ---------------

app.get('/api/health', async (req, res) => {
  const checkService = async (name, url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { name, status: 'up', url };
    } catch {
      return { name, status: 'down', url };
    }
  };

  const services = await Promise.all([
    checkService('student-service', STUDENT_SERVICE_URL),
    checkService('course-service', COURSE_SERVICE_URL),
    checkService('enrollment-service', ENROLLMENT_SERVICE_URL),
  ]);

  res.json({ gateway: 'running', services });
});

// --------------- Start Server ---------------

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`  -> Student Service:    ${STUDENT_SERVICE_URL}`);
  console.log(`  -> Course Service:     ${COURSE_SERVICE_URL}`);
  console.log(`  -> Enrollment Service: ${ENROLLMENT_SERVICE_URL}`);
});

module.exports = app;
