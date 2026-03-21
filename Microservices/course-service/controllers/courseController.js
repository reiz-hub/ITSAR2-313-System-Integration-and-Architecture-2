/**
 * Course Controller (Microservice)
 */

const courseModel = require('../models/courseModel');

const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';
const FETCH_TIMEOUT_MS = 5000;

const createCourse = (req, res) => {
  const { name, description, credits } = req.body;

  if (!name || !description || !credits) {
    return res.status(400).json({
      error: '400 Validation failed',
      message: 'name, description, and credits are required.'
    });
  }

  const course = courseModel.create({ name, description, credits });
  res.status(201).json({
    message: 'created',
    data: course
  });
};

const getAllCourses = (req, res) => {
  const courses = courseModel.getAll();
  res.json({ data: courses, count: courses.length });
};

const getCourseById = (req, res) => {
  const course = courseModel.getById(req.params.id);

  if (!course) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Course not found.'
    });
  }

  res.json(course);
};

const updateCourse = (req, res) => {
  const { id } = req.params;
  const { name, description, credits } = req.body;

  const existing = courseModel.getById(id);
  if (!existing) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Course not found.'
    });
  }

  const updated = courseModel.update(id, { name, description, credits });
  res.status(200).json({
    id: updated.id,
    message: 'updated'
  });
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;

  const deleted = courseModel.remove(id);
  if (!deleted) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Course not found.'
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    await fetch(`${ENROLLMENT_SERVICE_URL}/enrollments/course/${id}`, {
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
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
