/**
 * Enrollment Controller
 */

const enrollmentModel = require('../models/enrollmentModel');
const studentModel = require('../models/studentModel');
const courseModel = require('../models/courseModel');

const createEnrollment = (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({
      error: '400 BAD_REQUEST',
      message: 'studentId and courseId are required.'
    });
  }

  const student = studentModel.getById(studentId);
  if (!student) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  const course = courseModel.getById(courseId);
  if (!course) {
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

const getAllEnrollments = (req, res) => {
  const enrollments = enrollmentModel.getAll();
  res.json(enrollments);
};

const getEnrollmentsByStudent = (req, res) => {
  const { id } = req.params;

  const student = studentModel.getById(id);
  if (!student) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  const enrollments = enrollmentModel.getByStudentId(id);
  res.json(enrollments);
};

module.exports = { createEnrollment, getAllEnrollments, getEnrollmentsByStudent };
