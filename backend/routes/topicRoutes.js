const express = require('express');
const router = express.Router();
const {
  addTopic,
  updateTopic,
  deleteTopic,
  addComment,
  replyToComment,
  deleteComment,
} = require('../controllers/topicController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Topic management (Admin)
router.post(
  '/:courseId/levels/:levelId/topics',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'readingMaterial', maxCount: 1 },
  ]),
  addTopic
);

router.put(
  '/:courseId/levels/:levelId/topics/:topicId',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'readingMaterial', maxCount: 1 },
  ]),
  updateTopic
);

router.delete(
  '/:courseId/levels/:levelId/topics/:topicId',
  protect,
  authorize('admin'),
  deleteTopic
);

// Comments (Student)
router.post(
  '/:courseId/levels/:levelId/topics/:topicId/comments',
  protect,
  authorize('student'),
  addComment
);

// Comment management (Admin)
router.post(
  '/:courseId/levels/:levelId/topics/:topicId/comments/:commentId/reply',
  protect,
  authorize('admin'),
  replyToComment
);

router.delete(
  '/:courseId/levels/:levelId/topics/:topicId/comments/:commentId',
  protect,
  authorize('admin'),
  deleteComment
);

module.exports = router;