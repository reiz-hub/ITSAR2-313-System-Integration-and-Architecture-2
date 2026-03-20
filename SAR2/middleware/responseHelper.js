/**
 * Response Helper Middleware
 *
 * Attaches standardized response methods to `res` so all controllers
 * produce a consistent JSON shape:
 *
 *   Success → { message, data, ... }
 *   Error   → { error, message }
 *
 * Also configures Express to pretty-print JSON (2-space indent).
 */

const responseHelper = (req, res, next) => {
  /**
   * Send a success response.
   *
   * @param {number} statusCode - HTTP status (200, 201, etc.)
   * @param {string} message    - Human-readable message
   * @param {*}      data       - Response payload
   * @param {object} [extra]    - Additional top-level fields (e.g. count)
   */
  res.success = (statusCode, message, data, extra = {}) => {
    res.status(statusCode).json({
      message,
      data,
      ...extra,
    });
  };

  /**
   * Send an error response.
   *
   * @param {number} statusCode - HTTP status (400, 404, 409, 500, 503)
   * @param {string} errorCode  - Machine-readable error code (e.g. VALIDATION_ERROR)
   * @param {string} message    - Human-readable explanation
   * @param {object} [extra]    - Additional fields (e.g. details array)
   */
  res.fail = (statusCode, errorCode, message, extra = {}) => {
    res.status(statusCode).json({
      error: errorCode,
      message,
      ...extra,
    });
  };

  next();
};

module.exports = responseHelper;
