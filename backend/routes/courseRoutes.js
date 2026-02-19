const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addLevel,
  updateLevel,
  deleteLevel,
  togglePublishStatus,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Admin routes
router.post('/', protect, authorize('admin'), upload.single('thumbnail'), createCourse);
router.put('/:id', protect, authorize('admin'), upload.single('thumbnail'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);
router.patch('/:id/publish', protect, authorize('admin'), togglePublishStatus);

// Level management
router.post('/:id/levels', protect, authorize('admin'), addLevel);
router.put('/:courseId/levels/:levelId', protect, authorize('admin'), updateLevel);
router.delete('/:courseId/levels/:levelId', protect, authorize('admin'), deleteLevel);

module.exports = router;