const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getEnrollmentsOverTime,
  getRevenueAnalytics,
  getBestSellingCourses,
  getCourseCompletionStats,
  getMostActiveStudents,
  getStudentPerformanceHeatmap,
  getAverageQuizScores,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// Admin analytics routes
router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/enrollments-over-time', protect, authorize('admin'), getEnrollmentsOverTime);
router.get('/revenue', protect, authorize('admin'), getRevenueAnalytics);
router.get('/best-selling-courses', protect, authorize('admin'), getBestSellingCourses);
router.get('/course-completion', protect, authorize('admin'), getCourseCompletionStats);
router.get('/active-students', protect, authorize('admin'), getMostActiveStudents);
router.get('/student-performance/:courseId', protect, authorize('admin'), getStudentPerformanceHeatmap);
router.get('/quiz-scores/:courseId', protect, authorize('admin'), getAverageQuizScores);

module.exports = router;