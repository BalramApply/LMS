const express = require('express');
const router = express.Router();
const {
  checkEligibility,
  generateCertificate,
  verifyCertificate,
  getMyCertificates,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.get('/check-eligibility/:courseId', protect, authorize('student'), checkEligibility);
router.post('/generate/:courseId', protect, authorize('student'), generateCertificate);
router.get('/my-certificates', protect, authorize('student'), getMyCertificates);

// Public route
router.get('/verify/:certificateId', verifyCertificate);

module.exports = router;