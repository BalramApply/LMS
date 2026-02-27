const asyncHandler = require('express-async-handler');
const { LevelActivity } = require('../models/levelActivity');
const Course = require('../models/Course'); // adjust path to yours

/* ─────────────────────────────────────────────────────────────
   POST /api/level-activity/heartbeat
   Body: { courseId, levelId, levelIndex }
   Auth: protect (student)

   Called by the frontend every ~30 s while the student is on a
   level. Creates or updates the activity row and returns the
   current live counts for the whole course so the UI can refresh
   all blinking dots in one round-trip.
───────────────────────────────────────────────────────────── */
exports.heartbeat = asyncHandler(async (req, res) => {
  const { courseId, levelId, levelIndex } = req.body;
  const studentId = req.user._id;

  if (!courseId || !levelId || levelIndex === undefined) {
    res.status(400);
    throw new Error('courseId, levelId and levelIndex are required');
  }

  // Verify the student is actually enrolled (security check)
  const enrolled = req.user.enrolledCourses?.some(
    (e) => e.course?.toString() === courseId.toString()
  );

  if (!enrolled && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  await LevelActivity.heartbeat(studentId, courseId, levelId, levelIndex);

  // Return full live-counts map so frontend can update all levels at once
  const liveCounts = await LevelActivity.getLiveCountsByCourse(courseId);

  res.status(200).json({
    success: true,
    data: { liveCounts },
  });
});

/* ─────────────────────────────────────────────────────────────
   GET /api/level-activity/live-counts/:courseId
   Auth: protect (student or admin)

   Returns { "<levelId>": count } for every level that currently
   has at least one live student.
   Also includes the full ordered level list so the frontend can
   render counts even for levels with 0 live students.
───────────────────────────────────────────────────────────── */
exports.getLiveCounts = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Fetch the course to get the ordered level list
  const course = await Course.findById(courseId).select('levels');
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Security: student must be enrolled (admin can always view)
  if (req.user.role !== 'admin') {
    const enrolled = req.user.enrolledCourses?.some(
      (e) => e.course?.toString() === courseId.toString()
    );
    if (!enrolled) {
      res.status(403);
      throw new Error('You are not enrolled in this course');
    }
  }

  const liveCounts = await LevelActivity.getLiveCountsByCourse(courseId);

  // Build response: one entry per level with its live count (0 if none)
  const levels = course.levels.map((lvl, idx) => ({
    levelId:    lvl._id.toString(),
    levelIndex: idx,
    liveCount:  liveCounts[lvl._id.toString()] ?? 0,
  }));

  res.status(200).json({
    success: true,
    data: { levels, liveCounts },
  });
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/level-activity/offline/:courseId
   Auth: protect (student)

   Explicit "I left" signal — removes the activity row immediately
   instead of waiting for the TTL / heartbeat timeout.
   Call this on page unload / beforeunload.
───────────────────────────────────────────────────────────── */
exports.markOffline = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  await LevelActivity.markOffline(req.user._id, courseId);

  res.status(200).json({ success: true, message: 'Marked offline' });
});

/* ─────────────────────────────────────────────────────────────
   GET /api/level-activity/admin/active-students/:courseId
   Auth: protect + admin only

   Admin dashboard view: who is currently studying what level,
   with student name + avatar, sorted by lastSeen desc.
───────────────────────────────────────────────────────────── */
exports.getActiveStudents = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { LIVE_WINDOW_MS } = require('../models/levelActivity');
  const since = new Date(Date.now() - LIVE_WINDOW_MS);

  const rows = await LevelActivity.find({
    course:   courseId,
    lastSeen: { $gte: since },
  })
    .populate('student', 'name avatar email')
    .sort({ lastSeen: -1 })
    .lean();

  // Fetch level titles for display
  const course = await Course.findById(courseId).select('levels title').lean();

  const levelMap = {};
  (course?.levels || []).forEach((lvl, idx) => {
    levelMap[lvl._id.toString()] = {
      levelTitle:  lvl.levelTitle,
      levelNumber: lvl.levelNumber ?? idx + 1,
    };
  });

  const students = rows.map((row) => ({
    student:     row.student,
    levelId:     row.level.toString(),
    levelIndex:  row.levelIndex,
    levelInfo:   levelMap[row.level.toString()] || null,
    lastSeen:    row.lastSeen,
    secondsAgo:  Math.round((Date.now() - new Date(row.lastSeen)) / 1000),
  }));

  res.status(200).json({
    success: true,
    data: {
      courseTitle:    course?.title,
      totalLive:      students.length,
      students,
    },
  });
});