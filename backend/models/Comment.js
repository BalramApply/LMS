const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null, // null = top-level comment, ObjectId = reply
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.index({ blog: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });

// After saving a comment, update blog's commentCount
commentSchema.post('save', async function () {
  const Blog = mongoose.model('Blog');
  const count = await mongoose.model('Comment').countDocuments({
    blog: this.blog,
    isDeleted: false,
  });
  await Blog.findByIdAndUpdate(this.blog, { commentCount: count });
});

// After deleting, recalculate count
commentSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const Blog = mongoose.model('Blog');
    const count = await mongoose.model('Comment').countDocuments({
      blog: doc.blog,
      isDeleted: false,
    });
    await Blog.findByIdAndUpdate(doc.blog, { commentCount: count });
  }
});

module.exports = mongoose.model('Comment', commentSchema);