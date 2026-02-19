const express = require('express');
const router = express.Router();
const {
  enrollFreeCourse,
  createOrder,
  verifyPayment,
  getMyEnrolledCourses,
  getCourseEnrollmentDetails,
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/free/:courseId', protect, authorize('student'), enrollFreeCourse);
router.post('/create-order/:courseId', protect, authorize('student'), createOrder);
router.post('/verify-payment', protect, authorize('student'), verifyPayment);
router.get('/my-courses', protect, authorize('student'), getMyEnrolledCourses);
router.get('/course/:courseId', protect, authorize('student'), getCourseEnrollmentDetails);

module.exports = router;