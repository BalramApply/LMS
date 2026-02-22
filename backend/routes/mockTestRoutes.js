const express = require('express');
const router = express.Router();
const {
  // Admin
  createMockTest,
  getAllMockTestsAdmin,
  updateMockTest,
  deleteMockTest,
  togglePublish,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getTestAttempts,
  // Student
  getPublishedMockTests,
  getMockTestById,
  createTestOrder,
  verifyTestPayment,
  startAttempt,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
} = require('../controllers/mockTestController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), createMockTest);
router.get('/admin', protect, authorize('admin'), getAllMockTestsAdmin);
router.put('/:id', protect, authorize('admin'), updateMockTest);
router.delete('/:id', protect, authorize('admin'), deleteMockTest);
router.patch('/:id/publish', protect, authorize('admin'), togglePublish);

// Questions
router.post('/:id/questions', protect, authorize('admin'), upload.single('questionImage'), addQuestion);
router.put('/:id/questions/:questionId', protect, authorize('admin'), upload.single('questionImage'), updateQuestion);
router.delete('/:id/questions/:questionId', protect, authorize('admin'), deleteQuestion);

// Admin Analytics
router.get('/:id/attempts', protect, authorize('admin'), getTestAttempts);

// ── Student Routes ────────────────────────────────────────────────────────────
router.get('/', protect, authorize('student'), getPublishedMockTests);

router.get('/my-attempts', protect, authorize('student'), getMyAttempts);

router.get('/attempts/:attemptId/result', protect, authorize('student'), getAttemptResult);

router.post('/verify-payment', protect, authorize('student'), verifyTestPayment);

router.post('/attempts/:attemptId/submit', protect, authorize('student'), submitAttempt);

router.post('/:id/create-order', protect, authorize('student'), createTestOrder);

router.post('/:id/start', protect, authorize('student'), startAttempt);

// 🚨 KEEP THIS LAST
router.get('/:id', protect, authorize('student'), getMockTestById);

module.exports = router;