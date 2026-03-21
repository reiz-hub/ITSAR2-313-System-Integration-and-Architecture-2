/**
 * Course Controller
 */

const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');

const createCourse = (req, res) => {
  const { name, description, credits } = req.body;

  if (!name || !description || !credits) {
    return res.status(400).json({
      error: '400 BAD_REQUEST',
      message: 'name, description, and credits are required.'
    });
  }

  const course = courseModel.create({ name, description, credits });
  res.status(201).json({
    id: course.id,
    message: 'created'
  });
};

const getAllCourses = (req, res) => {
  const courses = courseModel.getAll();
  res.json(courses);
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

const deleteCourse = (req, res) => {
  const { id } = req.params;

  const deleted = courseModel.remove(id);
  if (!deleted) {
    return res.status(404).json({
      error: '404 NOT_FOUND',
      message: 'Course not found.'
    });
  }

  enrollmentModel.removeByCourseId(id);

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
