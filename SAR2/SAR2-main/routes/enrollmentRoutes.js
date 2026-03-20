/**
 * Enrollment Routes
 *
 * Defines all endpoints for enrollment management.
 * Applies validation middleware before controller logic.
 */

const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { validateEnrollment } = require('../middleware/validate');

// POST   /enrollments                -> Enroll a student in a course
router.post('/', validateEnrollment, enrollmentController.createEnrollment);

// GET    /enrollments                -> Get all enrollments
router.get('/', enrollmentController.getAllEnrollments);

// GET    /enrollments/student/:id    -> Get enrollments for a student
router.get('/student/:id', enrollmentController.getEnrollmentsByStudent);

module.exports = router;
