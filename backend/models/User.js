const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    avatar: {
      public_id: String,
      url: String,
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
        },
        completedLevels: [
          {
            type: mongoose.Schema.Types.ObjectId,
          },
        ],
        completedTopics: [
          {
            type: mongoose.Schema.Types.ObjectId,
          },
        ],
        videoProgress: [
          {
            topicId: mongoose.Schema.Types.ObjectId,
            watchedPercentage: {
              type: Number,
              default: 0,
            },
            lastWatchedTimestamp: {
              type: Number,
              default: 0,
            },
          },
        ],
        quizResults: [
          {
            topicId: mongoose.Schema.Types.ObjectId,
            score: Number,
            totalQuestions: Number,
            attempted: {
              type: Boolean,
              default: false,
            },
            attemptedAt: Date,
          },
        ],
        taskSubmissions: [
          {
            taskId: mongoose.Schema.Types.ObjectId,
            taskType: {
              type: String,
              enum: ['mini', 'major'],
            },
            submissionType: {
              type: String,
              enum: ['code', 'link'],
            },
            content: String,
            submittedAt: Date,
            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
        readingProgress: [
  {
    topicId: mongoose.Schema.Types.ObjectId,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
],
        certificateIssued: {
          type: Boolean,
          default: false,
        },
        certificateId: String,
        certificateIssuedDate: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
})

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', userSchema);