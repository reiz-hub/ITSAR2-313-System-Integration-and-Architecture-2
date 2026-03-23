/**
 * Global Error Handler Middleware
 *
 * Catches any unhandled errors thrown in route handlers or other middleware.
 * Returns a consistent JSON error response.
 */

// Standard error messages for common HTTP status codes
const ERROR_MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled Error:', err.message);

  // Use the status code attached to the error, or default to 500
  const statusCode = err.statusCode || 500;
  const defaultMessage = ERROR_MESSAGES[statusCode] || 'Internal Server Error';
  const message = err.message || defaultMessage;

  // Build error code from status (e.g., "503 SERVICE_UNAVAILABLE")
  const errorCode = `${statusCode} ${defaultMessage.toUpperCase().replace(/ /g, '_')}`;

  res.status(statusCode).json({
    error: errorCode,
    message: message,
    // Only include the stack trace in development for easier debugging
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
