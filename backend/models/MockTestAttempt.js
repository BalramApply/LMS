const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOption: {
    type: String,
    default: null, // null = skipped
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  isSkipped: {
    type: Boolean,
    default: true,
  },
});

const mockTestAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true,
    },

    // ── Answers ───────────────────────────────────────────────────────────────
    answers: [answerSchema],

    // ── Scoring ───────────────────────────────────────────────────────────────
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0, // percentage
    },

    // ── Timing ────────────────────────────────────────────────────────────────
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    timeTaken: {
      type: Number, // seconds
      default: 0,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },

    // ── Payment ───────────────────────────────────────────────────────────────
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTestPayment',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MockTestAttempt', mockTestAttemptSchema);