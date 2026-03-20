/**
 * Student Routes
 *
 * Defines all endpoints for student management.
 * Applies validation middleware before controller logic.
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudent } = require('../middleware/validate');

// POST   /students        -> Create a new student
router.post('/', validateStudent, studentController.createStudent);

// GET    /students        -> Get all students
router.get('/', studentController.getAllStudents);

// GET    /students/:id    -> Get a student by ID
router.get('/:id', studentController.getStudentById);

// PUT    /students/:id    -> Update a student
router.put('/:id', validateStudent, studentController.updateStudent);

// DELETE /students/:id    -> Delete a student
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
