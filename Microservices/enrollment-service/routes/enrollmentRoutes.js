/**
 * Enrollment Routes
 *
 * Based on monolith, with two additional DELETE routes
 * for inter-service cascade deletes.
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

// DELETE /enrollments/student/:id    -> Remove enrollments by student (inter-service)
router.delete('/student/:id', enrollmentController.deleteEnrollmentsByStudent);

// DELETE /enrollments/course/:id     -> Remove enrollments by course (inter-service)
router.delete('/course/:id', enrollmentController.deleteEnrollmentsByCourse);

module.exports = router;
