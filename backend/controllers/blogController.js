const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');

// ─── Helpers ────────────────────────────────────────────────────────────────

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

const buildFilter = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = new RegExp(query.category, 'i');
  if (query.tag) filter.tags = query.tag;
  if (query.search) filter.title = new RegExp(query.search, 'i');
  return filter;
};

// ─── Admin: CRUD ─────────────────────────────────────────────────────────────

// POST /api/blogs
exports.createBlog = async (req, res) => {
  try {
    const { title, shortDescription, content, category, tags, status } = req.body;

    const blogData = {
      title,
      shortDescription,
      content,
      category,
      tags: tags ? JSON.parse(tags) : [],
      status: status || 'draft',
      author: req.user._id,
    };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'blogs');
      blogData.featuredImage = { public_id: result.public_id, url: result.secure_url };
    }

    const blog = await Blog.create(blogData);
    await blog.populate('author', 'name avatar');

    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/blogs/:id
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const { title, shortDescription, content, category, tags, status } = req.body;
    if (title) blog.title = title;
    if (shortDescription) blog.shortDescription = shortDescription;
    if (content) blog.content = content;
    if (category) blog.category = category;
    if (tags) blog.tags = JSON.parse(tags);
    if (status) blog.status = status;

    if (req.file) {
      if (blog.featuredImage?.public_id) {
        await cloudinary.uploader.destroy(blog.featuredImage.public_id);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'blogs');
      blog.featuredImage = { public_id: result.public_id, url: result.secure_url };
    }

    await blog.save();
    await blog.populate('author', 'name avatar');

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/blogs/:id
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    if (blog.featuredImage?.public_id) {
      await cloudinary.uploader.destroy(blog.featuredImage.public_id);
    }

    await Comment.deleteMany({ blog: blog._id });
    await blog.deleteOne();

    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/blogs  (all statuses)
exports.adminGetBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = buildFilter(req.query);
    const sort = req.query.sort === 'popular' ? { views: -1 } : { createdAt: -1 };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: blogs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public: Read ────────────────────────────────────────────────────────────

// GET /api/blogs  (published only)
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const filter = buildFilter(req.query);
    filter.status = 'published';

    const sort = req.query.sort === 'popular' ? { views: -1, likes: -1 } : { publishDate: -1 };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-content')
        .lean(),
      Blog.countDocuments(filter),
    ]);

    // Append likeCount & isLiked for authenticated users
    const userId = req.user?._id?.toString();
    const processed = blogs.map((b) => ({
      ...b,
      likeCount: b.likes.length,
      isLiked: userId ? b.likes.map(String).includes(userId) : false,
    }));

    res.json({
      success: true,
      data: processed,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/blogs/categories  — distinct categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { status: 'published' });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/blogs/tags  — distinct tags
exports.getTags = async (req, res) => {
  try {
    const tags = await Blog.distinct('tags', { status: 'published' });
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/blogs/:slug  — single blog + increment views
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar');

    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const userId = req.user?._id?.toString();
    const result = blog.toObject();
    result.likeCount = blog.likes.length;
    result.isLiked = userId ? blog.likes.map(String).includes(userId) : false;

    // Related posts (same category, exclude current)
    const related = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      status: 'published',
    })
      .limit(3)
      .select('title slug shortDescription featuredImage publishDate readTime views')
      .lean();

    res.json({ success: true, data: result, related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Likes ───────────────────────────────────────────────────────────────────

// POST /api/blogs/:id/like  (toggle)
exports.toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const userId = req.user._id;
    const idx = blog.likes.indexOf(userId);
    const liked = idx === -1;

    if (liked) blog.likes.push(userId);
    else blog.likes.splice(idx, 1);

    await blog.save();

    res.json({ success: true, liked, likeCount: blog.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Active Viewers (SSE) ────────────────────────────────────────────────────

// In-memory viewer set per blog slug
const activeViewers = {}; // { blogId: Set<socketId> }

exports.trackViewer = async (req, res) => {
  const { id } = req.params;
  if (!activeViewers[id]) activeViewers[id] = new Set();

  const viewerId = `${req.ip}-${Date.now()}`;
  activeViewers[id].add(viewerId);

  // Update DB
  await Blog.findByIdAndUpdate(id, { activeViewers: activeViewers[id].size });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = () => {
    const count = activeViewers[id]?.size || 0;
    res.write(`data: ${JSON.stringify({ activeViewers: count })}\n\n`);
  };

  send();
  const interval = setInterval(send, 5000);

  req.on('close', async () => {
    clearInterval(interval);
    activeViewers[id]?.delete(viewerId);
    await Blog.findByIdAndUpdate(id, { activeViewers: activeViewers[id]?.size || 0 });
  });
};

// ─── Analytics ───────────────────────────────────────────────────────────────

// GET /api/admin/blogs/analytics
exports.getBlogAnalytics = async (req, res) => {
  try {
    const [totalBlogs, published, drafts, topViewed, topLiked] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Blog.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .select('title slug views likes commentCount readTime'),
      Blog.find({ status: 'published' })
        .sort({ 'likes.length': -1 })
        .limit(5)
        .select('title slug views likes commentCount'),
    ]);

    const totalViews = await Blog.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    const totalLikes = await Blog.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$likes' } } } },
    ]);

    const totalComments = await Comment.countDocuments({ isDeleted: false });

    // Sort topLiked by actual likes array length
    const topLikedSorted = topLiked
      .map((b) => ({ ...b.toObject(), likeCount: b.likes.length }))
      .sort((a, b) => b.likeCount - a.likeCount);

    res.json({
      success: true,
      data: {
        totalBlogs,
        published,
        drafts,
        totalViews: totalViews[0]?.total || 0,
        totalLikes: totalLikes[0]?.total || 0,
        totalComments,
        topViewed,
        topLiked: topLikedSorted,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};