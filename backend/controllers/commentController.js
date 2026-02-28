const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

// POST /api/blogs/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const comment = await Comment.create({
      blog: blogId,
      user: req.user._id,
      content,
      parent: parentId || null,
    });

    await comment.populate('user', 'name avatar');

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/blogs/:id/comments  — threaded
exports.getComments = async (req, res) => {
  try {
    const blogId = req.params.id;

    // Get all top-level + replies in one query
    const all = await Comment.find({ blog: blogId, isDeleted: false })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();

    // Build tree structure
    const map = {};
    const roots = [];

    all.forEach((c) => {
      c.replies = [];
      map[c._id] = c;
    });

    all.forEach((c) => {
      if (c.parent) {
        if (map[c.parent]) map[c.parent].replies.push(c);
      } else {
        roots.push(c);
      }
    });

    res.json({ success: true, data: roots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/comments/:commentId
exports.editComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Only owner or admin can edit
    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.content = req.body.content;
    await comment.save();
    await comment.populate('user', 'name avatar');

    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Soft delete (preserve thread structure)
    comment.isDeleted = true;
    comment.content = '[This comment has been deleted]';
    await comment.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/comments  — all comments across blogs
exports.adminGetComments = async (req, res) => {
  console.log('✅ adminGetComments hit');
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ isDeleted: false })
        .populate('user', 'name email avatar')
        .populate('blog', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ isDeleted: false }),
    ]);

    res.json({
      success: true,
      data: comments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};