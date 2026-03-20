/**
 * Student Controller
 */

const studentModel = require('../models/studentModel');
const enrollmentModel = require('../models/enrollmentModel');

const createStudent = (req, res) => {
  const { fullName, email, age } = req.body;

  if (!fullName || !email || !age) {
    return res.status(400).json({
      error: '400 BAD_REQUEST',
      message: 'fullName, email, and age are required.'
    });
  }

  const existingStudent = studentModel.getByEmail(email);
  if (existingStudent) {
    return res.status(409).json({
      error: '409 CONFLICT',
      message: 'Email already exists.'
    });
  }

  const student = studentModel.create({ fullName, email, age });
  res.status(201).json({
    id: student.id,
    message: 'created'
  });
};

const getAllStudents = (req, res) => {
  const students = studentModel.getAll();
  res.json(students);
};

const getStudentById = (req, res) => {
  const student = studentModel.getById(req.params.id);

  if (!student) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  res.json(student);
};

const updateStudent = (req, res) => {
  const { id } = req.params;
  const { fullName, email, age } = req.body;

  const existing = studentModel.getById(id);
  if (!existing) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  if (email && email.toLowerCase() !== existing.email) {
    const duplicate = studentModel.getByEmail(email);
    if (duplicate) {
      return res.status(409).json({
        error: '409 CONFLICT',
        message: 'Email already exists.'
      });
    }
  }

  const updated = studentModel.update(id, { fullName, email, age });
  res.status(200).json({
    id: updated.id,
    message: 'updated'
  });
};

const deleteStudent = (req, res) => {
  const { id } = req.params;

  const deleted = studentModel.remove(id);
  if (!deleted) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  enrollmentModel.removeByStudentId(id);

  res.status(200).json({
    id: deleted.id,
    message: 'deleted'
  });
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
