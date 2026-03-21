/**
 * Validation Middleware — Student only
 *
 * Extracted from the monolith's validate.js (only the student validator).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateStudent = (req, res, next) => {
  const { fullName, email, age } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    errors.push('fullName is required');
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('email is required');
  }

  if (age === undefined || age === null || typeof age !== 'number' || age <= 0 || !Number.isInteger(age)) {
    errors.push('age is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: '400 Validation failed', details: errors });
  }

  next();
};

module.exports = { validateStudent };
