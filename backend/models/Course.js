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
          if (this.courseType === 'Paid') {
            return value > 0;
          }
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
          // skip validation if price not set
          if (!this.price) return true;

          // discount must be less than or equal to price
          return Number(value) <= Number(this.price);
        },
        message: 'Discount price cannot be greater than actual price',
      },
    },

    discountValidTill: {
      type: Date,
    },

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
          if (this.accessType === 'Limited') {
            return value && value > 0;
          }
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
        levelNumber: {
          type: Number,
          required: true,
        },
        levelTitle: {
          type: String,
          required: true,
        },
        levelDescription: String,
        topics: [
          {
            topicNumber: {
              type: String, // e.g., "0.1", "0.2"
              required: true,
            },
            topicTitle: {
              type: String,
              required: true,
            },
            
            // Video Lesson
            video: {
              public_id: String,
              url: String,
              duration: Number, // in seconds
            },

            // Reading Material - Now stored as HTML content
            readingMaterial: {
              title: String,
              content: String, // Rich text HTML content
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
                options: [String], // For MCQ
                correctAnswer: {
                  type: String,
                  required: true,
                },
                explanation: String,
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
                    repliedAt: {
                      type: Date,
                      default: Date.now,
                    },
                  },
                ],
                isApproved: {
                  type: Boolean,
                  default: true,
                },
                createdAt: {
                  type: Date,
                  default: Date.now,
                },
              },
            ],
          },
        ],

        // Major Task (After all topics)
        majorTask: {
          title: String,
          description: String,
          requirements: [String],
          estimatedTime: String,
        },
      },
    ],

    // Statistics
    enrolledStudents: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },

    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate effective price based on discount
courseSchema.virtual('effectivePrice').get(function () {
  if (this.courseType === 'Free') return 0;
  
  if (this.discountPrice && this.discountValidTill) {
    const now = new Date();
    if (now <= this.discountValidTill) {
      return this.discountPrice;
    }
  }
  
  return this.price;
});

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')        // spaces to hyphens
    .replace(/-+/g, '-');        // collapse multiple hyphens
}

// Auto-generate slug before saving
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

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);