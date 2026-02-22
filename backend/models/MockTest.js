const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide question text'],
  },
  questionType: {
    type: String,
    enum: ['MCQ'],
    default: 'MCQ',
  },
  image: {
    public_id: String,
    url: String,
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.length >= 2 && v.length <= 6;
      },
      message: 'MCQ must have between 2 and 6 options',
    },
  },
  correctAnswer: {
    type: String,
    required: [true, 'Please provide the correct answer'],
  },
  explanation: String,
});

const mockTestSchema = new mongoose.Schema(
  {
    // ── Basic Info ─────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Please provide test title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide test description'],
    },

    // ── Timing ────────────────────────────────────────────────────────────────
    duration: {
      type: Number, // minutes
      required: [true, 'Please provide test duration in minutes'],
      min: [1, 'Duration must be at least 1 minute'],
    },

    // ── Marking Scheme ────────────────────────────────────────────────────────
    markPerQuestion: {
      type: Number,
      required: [true, 'Please provide marks per question'],
      min: [1, 'Marks per question must be at least 1'],
    },
    negativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarkValue: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          if (this.negativeMarking) return v > 0;
          return true;
        },
        message: 'Negative mark value must be greater than 0 when negative marking is enabled',
      },
    },

    // ── Questions ─────────────────────────────────────────────────────────────
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 0,
        message: 'Test must have at least one question',
      },
    },

    // ── Access & Pricing ──────────────────────────────────────────────────────
    accessType: {
      type: String,
      enum: ['Free', 'Paid'],
      default: 'Free',
    },
    price: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          if (this.accessType === 'Paid') return v > 0;
          return true;
        },
        message: 'Paid test must have a price greater than 0',
      },
    },

    // ── Meta ──────────────────────────────────────────────────────────────────
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

mockTestSchema.virtual('totalQuestions').get(function () {
  return Array.isArray(this.questions) ? this.questions.length : 0;
});

mockTestSchema.virtual('totalMarks').get(function () {
  const totalQuestions = Array.isArray(this.questions)
    ? this.questions.length
    : 0;

  return totalQuestions * (this.markPerQuestion || 0);
});

mockTestSchema.set('toJSON', { virtuals: true });
mockTestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MockTest', mockTestSchema);