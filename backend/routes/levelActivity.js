const express = require('express');
const router  = express.Router();

const {
  heartbeat,
  getLiveCounts,
  markOffline,
  getActiveStudents,
} = require('../controllers/levelActivity');

const { protect, authorize } = require('../middleware/auth'); // adjust to your auth middleware

/* ── Student routes ───────────────────────────────────────── */

// Heartbeat ping — called every ~30 s by useHeartbeat() hook
router.post('/heartbeat', protect, heartbeat);

// Poll for live counts — called every ~30 s by useLiveCounts() hook
router.get('/live-counts/:courseId', protect, getLiveCounts);

// Explicit offline signal (beforeunload)
router.delete('/offline/:courseId', protect, markOffline);

/* ── Admin routes ─────────────────────────────────────────── */

// Who is studying what right now
router.get(
  '/admin/active-students/:courseId',
  protect,
  authorize('admin'),
  getActiveStudents
);

module.exports = router;