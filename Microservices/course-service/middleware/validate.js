/**
 * Validation Middleware — Course only
 *
 * Extracted from the monolith's validate.js (only the course validator).
 */

const validateCourse = (req, res, next) => {
  const { name, description, credits } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }

  if (credits === undefined || credits === null || typeof credits !== 'number' || credits <= 0) {
    errors.push('credits is required and must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

module.exports = { validateCourse };
