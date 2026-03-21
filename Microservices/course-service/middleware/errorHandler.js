/**
 * Global Error Handler Middleware
 *
 * Same as the monolith — no changes needed.
 */

const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
