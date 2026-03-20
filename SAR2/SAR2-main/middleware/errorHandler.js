/**
 * Global Error Handler Middleware
 *
 * Catches any unhandled errors thrown in route handlers or other middleware.
 * Returns a consistent JSON error response.
 */

const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled Error:', err.message);

  // Use the status code attached to the error, or default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    // Only include the stack trace in development for easier debugging
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
