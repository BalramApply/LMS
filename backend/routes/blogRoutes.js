const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

const {
  createBlog,
  updateBlog,
  deleteBlog,
  adminGetBlogs,
  getBlogs,
  getCategories,
  getTags,
  getBlogBySlug,
  toggleLike,
  trackViewer,
  getBlogAnalytics,
} = require('../controllers/blogController');

const {
  addComment,
  getComments,
  editComment,
  deleteComment,
  adminGetComments,
} = require('../controllers/commentController');

// ─── Public Static Routes (must come FIRST) ───────────────────────────────────
router.get('/', optionalProtect, getBlogs); //
router.get('/categories', getCategories); //
router.get('/tags', getTags); //

// ─── Admin Routes (static — must be before /:slug) ───────────────────────────
router.get('/admin/all', protect, authorize('admin'), adminGetBlogs);
router.get('/admin/analytics', protect, authorize('admin'), getBlogAnalytics);
router.get('/admin/comments', protect, authorize('admin'), adminGetComments);  // ← was being swallowed by /:slug

router.post('/', protect, authorize('admin'), upload.single('image'), createBlog); //

// ─── Comment routes (static — must be before /:id) ───────────────────────────
router.put('/comments/:commentId', protect, editComment);
router.delete('/comments/:commentId', protect, deleteComment);

// ─── Wildcard routes LAST ────────────────────────────────────────────────────
router.get('/:slug',optionalProtect, getBlogBySlug);          // ← wildcards go here
router.get('/:id/comments',optionalProtect, getComments);
router.get('/:id/viewers', trackViewer);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);

router.put('/:id', protect, authorize('admin'), upload.single('image'), updateBlog);
router.delete('/:id', protect, authorize('admin'), deleteBlog);

module.exports = router;