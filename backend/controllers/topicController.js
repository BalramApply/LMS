const Course = require('../models/Course');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload to cloudinary
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// @desc    Add topic to level
// @route   POST /api/courses/:courseId/levels/:levelId/topics
// @access  Private/Admin
exports.addTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const level = course.levels.id(req.params.levelId);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    const topicData = {
      topicNumber: req.body.topicNumber,
      topicTitle: req.body.topicTitle,
      quiz: req.body.quiz ? JSON.parse(req.body.quiz) : [],
      miniTask: req.body.miniTask ? JSON.parse(req.body.miniTask) : {},
    };

    // Handle video upload
    if (req.files && req.files.video) {
      const videoResult = await uploadToCloudinary(
        req.files.video[0].buffer,
        'lms/course-videos',
        'video'
      );

      topicData.video = {
        public_id: videoResult.public_id,
        url: videoResult.secure_url,
        duration: videoResult.duration,
      };
    }

    // Handle reading material as HTML content
    if (req.body.readingMaterial) {
      const readingMaterialData = JSON.parse(req.body.readingMaterial);
      topicData.readingMaterial = {
        title: readingMaterialData.title || 'Reading Material',
        content: readingMaterialData.content || '',
      };
    }

    level.topics.push(topicData);
    await course.save();

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update topic
// @route   PUT /api/courses/:courseId/levels/:levelId/topics/:topicId
// @access  Private/Admin
exports.updateTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const level = course.levels.id(req.params.levelId);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    const topic = level.topics.id(req.params.topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Update basic fields
    if (req.body.topicNumber) topic.topicNumber = req.body.topicNumber;
    if (req.body.topicTitle) topic.topicTitle = req.body.topicTitle;
    if (req.body.quiz) topic.quiz = JSON.parse(req.body.quiz);
    if (req.body.miniTask) topic.miniTask = JSON.parse(req.body.miniTask);

    // Handle video update
    if (req.files && req.files.video) {
      // Delete old video
      if (topic.video && topic.video.public_id) {
        await cloudinary.uploader.destroy(topic.video.public_id, {
          resource_type: 'video',
        });
      }

      const videoResult = await uploadToCloudinary(
        req.files.video[0].buffer,
        'lms/course-videos',
        'video'
      );

      topic.video = {
        public_id: videoResult.public_id,
        url: videoResult.secure_url,
        duration: videoResult.duration,
      };
    }

    // Handle reading material update (HTML content)
    if (req.body.readingMaterial) {
      const readingMaterialData = JSON.parse(req.body.readingMaterial);
      topic.readingMaterial = {
        title: readingMaterialData.title || 'Reading Material',
        content: readingMaterialData.content || '',
      };
    }

    await course.save();

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete topic
// @route   DELETE /api/courses/:courseId/levels/:levelId/topics/:topicId
// @access  Private/Admin
exports.deleteTopic = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const level = course.levels.id(req.params.levelId);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    const topic = level.topics.id(req.params.topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Delete video from cloudinary
    if (topic.video && topic.video.public_id) {
      await cloudinary.uploader.destroy(topic.video.public_id, {
        resource_type: 'video',
      });
    }

    // No need to delete reading material from cloudinary anymore
    // as it's stored as HTML in MongoDB

    topic.deleteOne();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add comment to topic
// @route   POST /api/courses/:courseId/levels/:levelId/topics/:topicId/comments
// @access  Private/Student
exports.addComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const level = course.levels.id(req.params.levelId);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    const topic = level.topics.id(req.params.topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Check if student is enrolled
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to comment',
      });
    }

    topic.comments.push({
      student: req.user.id,
      comment: req.body.comment,
    });

    await course.save();

    // Populate the comment with student info
    await course.populate({
      path: 'levels.topics.comments.student',
      select: 'name avatar',
    });

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reply to comment (Admin)
// @route   POST /api/courses/:courseId/levels/:levelId/topics/:topicId/comments/:commentId/reply
// @access  Private/Admin
exports.replyToComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const level = course.levels.id(req.params.levelId);
    const topic = level.topics.id(req.params.topicId);
    const comment = topic.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    comment.replies.push({
      admin: req.user.id,
      reply: req.body.reply,
    });

    await course.save();

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete comment (Admin)
// @route   DELETE /api/courses/:courseId/levels/:levelId/topics/:topicId/comments/:commentId
// @access  Private/Admin
exports.deleteComment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const level = course.levels.id(req.params.levelId);
    const topic = level.topics.id(req.params.topicId);
    const comment = topic.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    comment.deleteOne();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};