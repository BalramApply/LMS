const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Please provide course title'],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide short description'],
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    fullDescription: {
      type: String,
      required: [true, 'Please provide full description'],
    },
    thumbnail: {
      public_id: String,
      url: {
        type: String,
        required: [true, 'Please provide course thumbnail'],
      },
    },

    // Course Metadata
    category: {
      type: String,
      required: [true, 'Please provide course category'],
      enum: [
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
        'AI',
        'Cloud Computing',
        'Cybersecurity',
        'DevOps',
        'Blockchain',
        'Game Development',
        'UI/UX Design',
        'Digital Marketing',
        'Other',
      ],
    },
    level: {
      type: String,
      required: [true, 'Please provide course level'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    language: {
      type: String,
      required: [true, 'Please provide course language'],
      default: 'English',
    },

    // Instructor Information
    instructorName: {
      type: String,
      required: [true, 'Please provide instructor name'],
    },
    instructorBio: {
      type: String,
      required: [true, 'Please provide instructor bio'],
      maxlength: [500, 'Instructor bio cannot exceed 500 characters'],
    },

    // Pricing
    courseType: {
      type: String,
      enum: ['Free', 'Paid'],
      required: [true, 'Please specify course type'],
      default: 'Free',
    },
    price: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          if (this.courseType === 'Paid') return value > 0;
          return true;
        },
        message: 'Paid course must have a price greater than 0',
      },
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          if (!this.price) return true;
          return Number(value) <= Number(this.price);
        },
        message: 'Discount price cannot be greater than actual price',
      },
    },
    discountValidTill: { type: Date },

    // Access & Batch Type
    accessType: {
      type: String,
      enum: ['Lifetime', 'Limited'],
      default: 'Lifetime',
    },
    accessDuration: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          if (this.accessType === 'Limited') return value && value > 0;
          return true;
        },
        message: 'Limited access must have duration in months',
      },
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    batchType: {
      type: String,
      enum: ['Live', 'Live + Recorded', 'Recorded'],
      default: 'Recorded',
    },

    // Course Roadmap
    roadmap: [
      {
        title: String,
        description: String,
        duration: String,
      },
    ],

    // Course Content Structure
    levels: [
      {
        levelNumber: { type: Number, required: true },
        levelTitle:  { type: String, required: true },
        levelDescription: String,

        topics: [
          {
            topicNumber: { type: String, required: true },
            topicTitle:  { type: String, required: true },

            // Video Lesson
            video: {
              public_id: String,
              url: String,
              duration: Number, // seconds; 0 for YouTube links
            },

            // Reading Material (rich HTML)
            readingMaterial: {
              title: String,
              content: String,
            },

            // Practice Quiz
            quiz: [
              {
                question: {
                  type: String,
                  required: true,
                },
                questionType: {
                  type: String,
                  enum: ['MCQ', 'True/False', 'Code-Output'],
                  default: 'MCQ',
                },
                options: [String],
                correctAnswer: {
                  type: String,
                  required: true,
                },
                explanation: String,

                // ── NEW: optional diagram / image for the question ──────────
                image: {
                  public_id: String, // Cloudinary public_id (empty for existing-URL-only case)
                  url: String,       // Cloudinary secure_url
                },
              },
            ],

            // Mini Task
            miniTask: {
              title: String,
              description: String,
              requirements: [String],
            },

            // Comments
            comments: [
              {
                student: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                },
                comment: String,
                replies: [
                  {
                    admin: {
                      type: mongoose.Schema.Types.ObjectId,
                      ref: 'User',
                    },
                    reply: String,
                    repliedAt: { type: Date, default: Date.now },
                  },
                ],
                isApproved: { type: Boolean, default: true },
                createdAt:  { type: Date, default: Date.now },
              },
            ],
          },
        ],

        // Major Task (after all topics in this level)
        majorTask: {
          title: String,
          description: String,
          requirements: [String],
          estimatedTime: String,
        },
      },
    ],

    // Statistics
    enrolledStudents: { type: Number, default: 0 },
    totalRevenue:     { type: Number, default: 0 },
    averageRating:    { type: Number, default: 0 },
    completionRate:   { type: Number, default: 0 },

    // Status
    isPublished: { type: Boolean, default: false },
    isFeatured:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────
courseSchema.virtual('effectivePrice').get(function () {
  if (this.courseType === 'Free') return 0;
  if (this.discountPrice && this.discountValidTill && new Date() <= this.discountValidTill) {
    return this.discountPrice;
  }
  return this.price;
});

// ── Slug generation ───────────────────────────────────────────────────────────
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

courseSchema.pre('save', async function () {
  if (!this.isModified('title') && this.slug) return;
  let baseSlug = generateSlug(this.title);
  let slug = baseSlug;
  let count = 1;
  while (await mongoose.model('Course').exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${count++}`;
  }
  this.slug = slug;
});

courseSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (!update.title) return;
  let baseSlug = generateSlug(update.title);
  let slug = baseSlug;
  let count = 1;
  const docId = this.getQuery()._id;
  while (await mongoose.model('Course').exists({ slug, _id: { $ne: docId } })) {
    slug = `${baseSlug}-${count++}`;
  }
  update.slug = slug;
});

courseSchema.set('toJSON',   { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);