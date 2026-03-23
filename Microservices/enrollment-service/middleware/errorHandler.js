/**
 * Global Error Handler Middleware
 *
 * Catches any unhandled errors thrown in route handlers or other middleware.
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

  const statusCode = err.statusCode || 500;
  const defaultMessage = ERROR_MESSAGES[statusCode] || 'Internal Server Error';
  const message = err.message || defaultMessage;
  const errorCode = `${statusCode} ${defaultMessage.toUpperCase().replace(/ /g, '_')}`;

  res.status(statusCode).json({
    error: errorCode,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
