/**
 * Enrollment Controller (Microservice)
 */

const enrollmentModel = require('../models/enrollmentModel');

const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
const FETCH_TIMEOUT_MS = 5000;

async function fetchStudent(studentId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${STUDENT_SERVICE_URL}/students/${studentId}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return { data: null, error: 'NOT_FOUND' };
    const result = await response.json();
    return { data: result, error: null };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { data: null, error: 'TIMEOUT' };
    }
    return { data: null, error: 'SERVICE_UNAVAILABLE' };
  }
}

async function fetchCourse(courseId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${COURSE_SERVICE_URL}/courses/${courseId}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return { data: null, error: 'NOT_FOUND' };
    const result = await response.json();
    return { data: result, error: null };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { data: null, error: 'TIMEOUT' };
    }
    return { data: null, error: 'SERVICE_UNAVAILABLE' };
  }
}

const createEnrollment = async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({
      error: '400 Validation failed',
      message: 'studentId and courseId are required.'
    });
  }

  const studentResult = await fetchStudent(studentId);
  if (studentResult.error === 'TIMEOUT') {
    return res.status(504).json({
      error: '504 GATEWAY_TIMEOUT',
      message: 'Student Service did not respond in time.'
    });
  }
  if (studentResult.error === 'SERVICE_UNAVAILABLE') {
    return res.status(503).json({
      error: '503 SERVICE_UNAVAILABLE',
      message: 'Student Service is unavailable.'
    });
  }
  if (studentResult.error === 'NOT_FOUND') {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  const courseResult = await fetchCourse(courseId);
  if (courseResult.error === 'TIMEOUT') {
    return res.status(504).json({
      error: '504 GATEWAY_TIMEOUT',
      message: 'Course Service did not respond in time.'
    });
  }
  if (courseResult.error === 'SERVICE_UNAVAILABLE') {
    return res.status(503).json({
      error: '503 SERVICE_UNAVAILABLE',
      message: 'Course Service is unavailable.'
    });
  }
  if (courseResult.error === 'NOT_FOUND') {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Course not found.'
    });
  }

  if (enrollmentModel.exists(studentId, courseId)) {
    return res.status(409).json({
      error: '409 CONFLICT',
      message: 'Student is already enrolled in this course.'
    });
  }

  const enrollment = enrollmentModel.create({ studentId, courseId });

  res.status(201).json({
    id: enrollment.id,
    message: 'created'
  });
};

const getAllEnrollments = async (req, res) => {
  const enrollments = enrollmentModel.getAll();

  // Enrich enrollments with student and course names
  const enrichedEnrollments = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [studentResult, courseResult] = await Promise.all([
        fetchStudent(enrollment.studentId),
        fetchCourse(enrollment.courseId),
      ]);

      return {
        ...enrollment,
        studentName: studentResult.data?.fullName || 'Unknown Student',
        courseName: courseResult.data?.name || 'Unknown Course',
      };
    })
  );

  res.json({ data: enrichedEnrollments, count: enrichedEnrollments.length });
};

const getEnrollmentsByStudent = async (req, res) => {
  const { id } = req.params;

  const studentResult = await fetchStudent(id);
  if (studentResult.error === 'TIMEOUT') {
    return res.status(504).json({
      error: '504 GATEWAY_TIMEOUT',
      message: 'Student Service did not respond in time.'
    });
  }
  if (studentResult.error === 'SERVICE_UNAVAILABLE') {
    return res.status(503).json({
      error: '503 SERVICE_UNAVAILABLE',
      message: 'Student Service is unavailable.'
    });
  }
  if (studentResult.error === 'NOT_FOUND') {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  const enrollments = enrollmentModel.getByStudentId(id);
  res.json(enrollments);
};

const deleteEnrollmentsByStudent = (req, res) => {
  const { id } = req.params;
  const removedCount = enrollmentModel.removeByStudentId(id);
  res.json({
    id: id,
    message: 'deleted',
    removedCount
  });
};

const deleteEnrollmentsByCourse = (req, res) => {
  const { id } = req.params;
  const removedCount = enrollmentModel.removeByCourseId(id);
  res.json({
    id: id,
    message: 'deleted',
    removedCount
  });
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentsByStudent,
  deleteEnrollmentsByStudent,
  deleteEnrollmentsByCourse,
};
