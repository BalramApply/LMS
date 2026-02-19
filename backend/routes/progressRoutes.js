const express = require('express');
const router = express.Router();
const {
  updateVideoProgress,
  submitQuiz,
  submitTask,
  completeTopicMark,
  completeLevel,
  markReadingComplete,
  getProgress,
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

// Student progress routes
router.post('/video', protect, authorize('student'), updateVideoProgress);
router.post('/quiz', protect, authorize('student'), submitQuiz);
router.post('/task', protect, authorize('student'), submitTask);
router.post('/complete-topic', protect, authorize('student'), completeTopicMark);
router.post('/complete-level', protect, authorize('student'), completeLevel);
router.get('/:courseId', protect, authorize('student'), getProgress);
router.post('/reading', protect, markReadingComplete);  // ← add this

module.exports = router;