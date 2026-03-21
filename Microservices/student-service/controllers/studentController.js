/**
 * Student Controller (Microservice)
 */

const studentModel = require('../models/studentModel');

const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';
const FETCH_TIMEOUT_MS = 5000;

const createStudent = (req, res) => {
  const { fullName, email, age } = req.body;

  if (!fullName || !email || !age) {
    return res.status(400).json({
      error: '400 Validation failed',
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
    message: 'created',
    data: student
  });
};

const getAllStudents = (req, res) => {
  const students = studentModel.getAll();
  res.json({ data: students, count: students.length });
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

const deleteStudent = async (req, res) => {
  const { id } = req.params;

  const deleted = studentModel.remove(id);
  if (!deleted) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Student not found.'
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    await fetch(`${ENROLLMENT_SERVICE_URL}/enrollments/student/${id}`, {
      method: 'DELETE',
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
  }

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
