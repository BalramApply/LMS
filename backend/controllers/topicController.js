const Course = require('../models/Course');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const isYoutubeUrl = (url) =>
  url && /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);

/**
 * Quiz images arrive as req.files.quizImage_0, quizImage_1, …
 * This function builds the final quiz array by:
 *  1. Taking the JSON quiz payload from req.body.quiz
 *  2. For each question, uploading a new image if one was sent, or keeping
 *     the existingImageUrl that the frontend echoed back.
 */
const processQuizImages = async (quizPayload, files) => {
  const quiz = [];

  for (let i = 0; i < quizPayload.length; i++) {
    const q = { ...quizPayload[i] };
    const fileKey = `quizImage_${i}`;

    // Remove helper field before saving to DB
    const existingImageUrl = q.existingImageUrl || '';
    delete q.existingImageUrl;

    if (files && files[fileKey]) {
      // Upload new image to Cloudinary
      const result = await uploadToCloudinary(
        files[fileKey][0].buffer,
        'lms/quiz-images',
        'image'
      );
      q.image = { public_id: result.public_id, url: result.secure_url };
    } else if (existingImageUrl) {
      // Keep whatever is already on Cloudinary — reconstruct the image object.
      // We only have the URL from the frontend; public_id is recoverable from it
      // but we don't need it for display, so store url only when public_id unknown.
      q.image = { public_id: '', url: existingImageUrl };
    }
    // else: no image for this question — don't set q.image at all

    quiz.push(q);
  }

  return quiz;
};

// @desc    Add topic to level
// @route   POST /api/topics/:courseId/levels/:levelId/topics
// @access  Private/Admin
exports.addTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const level = course.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });

    const topicData = {
      topicNumber: req.body.topicNumber,
      topicTitle: req.body.topicTitle,
      miniTask: req.body.miniTask ? JSON.parse(req.body.miniTask) : {},
    };

    // ── Video ─────────────────────────────────────────────────────────────────
    if (req.body.youtubeUrl && isYoutubeUrl(req.body.youtubeUrl)) {
      topicData.video = { public_id: null, url: req.body.youtubeUrl, duration: 0 };
    } else if (req.files && req.files.video) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'lms/course-videos', 'video');
      topicData.video = { public_id: result.public_id, url: result.secure_url, duration: result.duration };
    }

    // ── Reading material ──────────────────────────────────────────────────────
    if (req.body.readingMaterial) {
      const rm = JSON.parse(req.body.readingMaterial);
      topicData.readingMaterial = { title: rm.title || 'Reading Material', content: rm.content || '' };
    }

    // ── Quiz (with optional per-question images) ───────────────────────────────
    if (req.body.quiz) {
      const quizPayload = JSON.parse(req.body.quiz);
      topicData.quiz = await processQuizImages(quizPayload, req.files);
    } else {
      topicData.quiz = [];
    }

    level.topics.push(topicData);
    await course.save();

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update topic
// @route   PUT /api/topics/:courseId/levels/:levelId/topics/:topicId
// @access  Private/Admin
exports.updateTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const level = course.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });

    const topic = level.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    if (req.body.topicNumber) topic.topicNumber = req.body.topicNumber;
    if (req.body.topicTitle)  topic.topicTitle  = req.body.topicTitle;
    if (req.body.miniTask)    topic.miniTask    = JSON.parse(req.body.miniTask);

    // ── Video ─────────────────────────────────────────────────────────────────
    if (req.body.youtubeUrl && isYoutubeUrl(req.body.youtubeUrl)) {
      if (topic.video?.public_id) {
        await cloudinary.uploader.destroy(topic.video.public_id, { resource_type: 'video' });
      }
      topic.video = { public_id: null, url: req.body.youtubeUrl, duration: 0 };
    } else if (req.files && req.files.video) {
      if (topic.video?.public_id) {
        await cloudinary.uploader.destroy(topic.video.public_id, { resource_type: 'video' });
      }
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'lms/course-videos', 'video');
      topic.video = { public_id: result.public_id, url: result.secure_url, duration: result.duration };
    }

    // ── Reading material ──────────────────────────────────────────────────────
    if (req.body.readingMaterial) {
      const rm = JSON.parse(req.body.readingMaterial);
      topic.readingMaterial = { title: rm.title || 'Reading Material', content: rm.content || '' };
    }

    // ── Quiz (with optional per-question images) ───────────────────────────────
    if (req.body.quiz) {
      const quizPayload = JSON.parse(req.body.quiz);

      // Delete old Cloudinary quiz images whose question slot now has a NEW file
      for (let i = 0; i < quizPayload.length; i++) {
        const fileKey = `quizImage_${i}`;
        if (req.files && req.files[fileKey]) {
          const oldQuestion = topic.quiz[i];
          if (oldQuestion?.image?.public_id) {
            await cloudinary.uploader.destroy(oldQuestion.image.public_id);
          }
        }
      }

      topic.quiz = await processQuizImages(quizPayload, req.files);
    }

    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete topic
// @route   DELETE /api/topics/:courseId/levels/:levelId/topics/:topicId
// @access  Private/Admin
exports.deleteTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const level = course.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });

    const topic = level.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    // Delete Cloudinary video (not YouTube)
    if (topic.video?.public_id && !isYoutubeUrl(topic.video.url)) {
      await cloudinary.uploader.destroy(topic.video.public_id, { resource_type: 'video' });
    }

    // Delete all quiz images from Cloudinary
    for (const q of topic.quiz || []) {
      if (q.image?.public_id) {
        await cloudinary.uploader.destroy(q.image.public_id);
      }
    }

    topic.deleteOne();
    await course.save();

    res.status(200).json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to topic
// @route   POST /api/topics/:courseId/levels/:levelId/topics/:topicId/comments
// @access  Private/Student
exports.addComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const level = course.levels.id(req.params.levelId);
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });

    const topic = level.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some((ec) => ec.course.toString() === req.params.courseId);
    if (!isEnrolled) return res.status(403).json({ success: false, message: 'You must be enrolled in this course to comment' });

    topic.comments.push({ student: req.user.id, comment: req.body.comment });
    await course.save();
    await course.populate({ path: 'levels.topics.comments.student', select: 'name avatar' });

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to comment (Admin)
// @route   POST /api/topics/:courseId/levels/:levelId/topics/:topicId/comments/:commentId/reply
// @access  Private/Admin
exports.replyToComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const level = course.levels.id(req.params.levelId);
    const topic = level.topics.id(req.params.topicId);
    const comment = topic.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.replies.push({ admin: req.user.id, reply: req.body.reply });
    await course.save();

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete comment (Admin)
// @route   DELETE /api/topics/:courseId/levels/:levelId/topics/:topicId/comments/:commentId
// @access  Private/Admin
exports.deleteComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const level = course.levels.id(req.params.levelId);
    const topic = level.topics.id(req.params.topicId);
    const comment = topic.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.deleteOne();
    await course.save();

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};