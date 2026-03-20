/**
 * Course Routes
 *
 * Defines all endpoints for course management.
 * Applies validation middleware before controller logic.
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { validateCourse } = require('../middleware/validate');

// POST   /courses        -> Create a new course
router.post('/', validateCourse, courseController.createCourse);

// GET    /courses        -> Get all courses
router.get('/', courseController.getAllCourses);

// GET    /courses/:id    -> Get a course by ID
router.get('/:id', courseController.getCourseById);

// PUT    /courses/:id    -> Update a course
router.put('/:id', validateCourse, courseController.updateCourse);

// DELETE /courses/:id    -> Delete a course
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
