const mongoose = require('mongoose');

/**
 * LevelActivity
 * ─────────────────────────────────────────────────────────────
 * One document per (student × course × level) combination.
 * Students ping a heartbeat endpoint every ~30 s while studying.
 * Anyone whose lastSeen < (now − LIVE_WINDOW_MS) is considered offline.
 *
 * TTL index auto-deletes stale docs after STALE_AFTER_SECONDS
 * so the collection never grows unbounded.
 */

const LIVE_WINDOW_MS    = 5 * 60 * 1000;   // 5 min  → "live"
const STALE_AFTER_SEC   = 60 * 60;          // 1 hour → Mongo TTL delete

const levelActivitySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    levelIndex: {
      type: Number,
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

/* ── Indexes ─────────────────────────────────────────────── */

// Fast look-up: who is on this course+level?
levelActivitySchema.index({ course: 1, level: 1 });

// Uniqueness: one active row per student×course (student can only
// be on one level at a time within a single course).
levelActivitySchema.index({ student: 1, course: 1 }, { unique: true });

// TTL: Mongo auto-deletes docs where lastSeen is stale
levelActivitySchema.index({ lastSeen: 1 }, { expireAfterSeconds: STALE_AFTER_SEC });

/* ── Statics ─────────────────────────────────────────────── */

/**
 * Upsert the student's current position and return the doc.
 */
levelActivitySchema.statics.heartbeat = async function (studentId, courseId, levelId, levelIndex) {
  return this.findOneAndUpdate(
    { student: studentId, course: courseId },
    { level: levelId, levelIndex, lastSeen: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Returns a map of levelId → liveCount for every level in a course.
 * Only counts students whose lastSeen is within LIVE_WINDOW_MS.
 */
levelActivitySchema.statics.getLiveCountsByCourse = async function (courseId) {
  const since = new Date(Date.now() - LIVE_WINDOW_MS);

  const rows = await this.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(courseId),
        lastSeen: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert to { "<levelId>": count } for easy frontend consumption
  return rows.reduce((acc, { _id, count }) => {
    acc[_id.toString()] = count;
    return acc;
  }, {});
};

/**
 * Mark a student as offline (called on explicit logout / page leave).
 */
levelActivitySchema.statics.markOffline = async function (studentId, courseId) {
  return this.deleteOne({ student: studentId, course: courseId });
};

module.exports = {
  LevelActivity: mongoose.model('LevelActivity', levelActivitySchema),
  LIVE_WINDOW_MS,
};