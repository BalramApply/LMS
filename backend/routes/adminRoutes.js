const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentDetails,
  toggleStudentStatus,
  deleteStudent,
  getAllCoursesAdmin,
  getAllComments,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Admin routes
router.get('/students', protect, authorize('admin'), getAllStudents);
router.get('/students/:id', protect, authorize('admin'), getStudentDetails);
router.patch('/students/:id/toggle-status', protect, authorize('admin'), toggleStudentStatus);
router.delete('/students/:id', protect, authorize('admin'), deleteStudent);
router.get('/courses', protect, authorize('admin'), getAllCoursesAdmin);
router.get('/comments', protect, authorize('admin'), getAllComments);

module.exports = router;