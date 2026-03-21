/**
 * Validation Middleware — Enrollment only
 *
 * Validates enrollment requests with integer IDs.
 */

const validateEnrollment = (req, res, next) => {
  const { studentId, courseId } = req.body;
  const errors = [];

  // Accept both numbers and numeric strings
  const parsedStudentId = Number(studentId);
  const parsedCourseId = Number(courseId);

  if (!studentId || isNaN(parsedStudentId) || parsedStudentId <= 0) {
    errors.push('studentId is required');
  }

  if (!courseId || isNaN(parsedCourseId) || parsedCourseId <= 0) {
    errors.push('courseId is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: '400 Validation failed', details: errors });
  }

  // Convert to integers for downstream use
  req.body.studentId = parsedStudentId;
  req.body.courseId = parsedCourseId;

  next();
};

module.exports = { validateEnrollment };
