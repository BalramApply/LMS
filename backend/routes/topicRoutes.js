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

// Build the allowed fields list once and reuse for both POST and PUT
const topicUploadFields = upload.fields([
  { name: 'video',        maxCount: 1 },
  { name: 'quizImage_0',  maxCount: 1 },
  { name: 'quizImage_1',  maxCount: 1 },
  { name: 'quizImage_2',  maxCount: 1 },
  { name: 'quizImage_3',  maxCount: 1 },
  { name: 'quizImage_4',  maxCount: 1 },
  { name: 'quizImage_5',  maxCount: 1 },
  { name: 'quizImage_6',  maxCount: 1 },
  { name: 'quizImage_7',  maxCount: 1 },
  { name: 'quizImage_8',  maxCount: 1 },
  { name: 'quizImage_9',  maxCount: 1 },
]);

// Topic management (Admin)
router.post(
  '/:courseId/levels/:levelId/topics',
  protect,
  authorize('admin'),
  topicUploadFields,
  addTopic
);

router.put(
  '/:courseId/levels/:levelId/topics/:topicId',
  protect,
  authorize('admin'),
  topicUploadFields,
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