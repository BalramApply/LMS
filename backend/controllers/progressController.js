const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Update video progress
// @route   POST /api/progress/video
// @access  Private/Student
exports.updateVideoProgress = async (req, res) => {
  try {
    const { courseId, topicId, watchedPercentage, lastWatchedTimestamp } = req.body;

    const user = await User.findById(req.user.id);
    
    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Find or create video progress entry
    const existingProgress = enrollment.videoProgress.find(
      (vp) => vp.topicId.toString() === topicId
    );

    if (existingProgress) {
      existingProgress.watchedPercentage = Math.max(
        existingProgress.watchedPercentage,
        watchedPercentage
      );
      existingProgress.lastWatchedTimestamp = lastWatchedTimestamp;
    } else {
      enrollment.videoProgress.push({
        topicId,
        watchedPercentage,
        lastWatchedTimestamp,
      });
    }

    // Calculate overall progress
    await calculateProgress(user, courseId);

    await user.save();

    res.status(200).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit quiz
// @route   POST /api/progress/quiz
// @access  Private/Student
exports.submitQuiz = async (req, res) => {
  try {
    const { courseId, topicId, answers } = req.body;

    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Find the topic and quiz
    let quizData = null;
    for (const level of course.levels) {
      for (const topic of level.topics) {
        if (topic._id.toString() === topicId) {
          quizData = topic.quiz;
          break;
        }
      }
      if (quizData) break;
    }

    if (!quizData || quizData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Calculate score
    let score = 0;
    const results = [];

    quizData.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score++;
      }

      results.push({
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    });

    // Save quiz result
    const existingQuiz = enrollment.quizResults.find(
      (qr) => qr.topicId.toString() === topicId
    );

    if (existingQuiz) {
      // Update only if new score is better
      if (score > existingQuiz.score) {
        existingQuiz.score = score;
        existingQuiz.totalQuestions = quizData.length;
        existingQuiz.attemptedAt = Date.now();
      }
      existingQuiz.attempted = true;
    } else {
      enrollment.quizResults.push({
        topicId,
        score,
        totalQuestions: quizData.length,
        attempted: true,
        attemptedAt: Date.now(),
      });
    }

    // Calculate overall progress
    await calculateProgress(user, courseId);

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        score,
        totalQuestions: quizData.length,
        percentage: (score / quizData.length) * 100,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit task (mini/major)
// @route   POST /api/progress/task
// @access  Private/Student
exports.submitTask = async (req, res) => {
  try {
    const { courseId, taskId, taskType, submissionType, content } = req.body;

    const user = await User.findById(req.user.id);
    
    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Check if task already submitted
    const existingSubmission = enrollment.taskSubmissions.find(
      (ts) => ts.taskId.toString() === taskId
    );

    if (existingSubmission) {
      existingSubmission.submissionType = submissionType;
      existingSubmission.content = content;
      existingSubmission.submittedAt = Date.now();
      existingSubmission.completed = true;
    } else {
      enrollment.taskSubmissions.push({
        taskId,
        taskType,
        submissionType,
        content,
        submittedAt: Date.now(),
        completed: true,
      });
    }

    // Calculate overall progress
    await calculateProgress(user, courseId);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Task submitted successfully',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark reading material as complete
// @route   POST /api/progress/reading
// @access  Private/Student
exports.markReadingComplete = async (req, res) => {
  try {
    const { courseId, topicId } = req.body;

    const user = await User.findById(req.user.id);

    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    const existing = enrollment.readingProgress.find(
      (rp) => rp.topicId.toString() === topicId
    );

    if (!existing) {
      enrollment.readingProgress.push({
        topicId,
        completed: true,
        completedAt: Date.now(),
      });
    } else {
      existing.completed = true;
    }

    await calculateProgress(user, courseId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reading marked as complete',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark topic as complete
// @route   POST /api/progress/complete-topic
// @access  Private/Student
exports.completeTopicMark = async (req, res) => {
  try {
    const { courseId, topicId } = req.body;

    const user = await User.findById(req.user.id);
    
    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Check if topic already completed
    const alreadyCompleted = enrollment.completedTopics.some(
      (ct) => ct.toString() === topicId
    );

    if (!alreadyCompleted) {
      enrollment.completedTopics.push(topicId);
    }

    // Calculate overall progress
    await calculateProgress(user, courseId);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Topic marked as complete',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark level as complete and unlock next level
// @route   POST /api/progress/complete-level
// @access  Private/Student
exports.completeLevel = async (req, res) => {
  try {
    const { courseId, levelId } = req.body;

    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);
    
    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Verify all topics in level are completed
    const level = course.levels.id(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    const allTopicsCompleted = level.topics.every((topic) =>
      enrollment.completedTopics.some((ct) => ct.toString() === topic._id.toString())
    );

    if (!allTopicsCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all topics before marking level as complete',
      });
    }

    // Check if level already completed
    const alreadyCompleted = enrollment.completedLevels.some(
      (cl) => cl.toString() === levelId
    );

    if (!alreadyCompleted) {
      enrollment.completedLevels.push(levelId);
    }

    // Calculate overall progress
    await calculateProgress(user, courseId);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Level completed! Next level unlocked.',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get student progress for a course
// @route   GET /api/progress/:courseId
// @access  Private/Student
exports.getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    
    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        progress: enrollment.progress,
        completedLevels: enrollment.completedLevels,
        completedTopics: enrollment.completedTopics,
        videoProgress: enrollment.videoProgress,
        quizResults: enrollment.quizResults,
        taskSubmissions: enrollment.taskSubmissions,
        readingProgress: enrollment.readingProgress, // ← add this
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to calculate overall progress
async function calculateProgress(user, courseId) {
  const course = await Course.findById(courseId);
  const enrollment = user.enrolledCourses.find(
    (ec) => ec.course.toString() === courseId
  );

  if (!course || !enrollment) return;

  let totalItems = 0;
  let completedItems = 0;

  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {

  const hasVideo = topic.video?.url;
  const hasQuiz = topic.quiz && topic.quiz.length > 0;
  const hasMiniTask = topic.miniTask?.title;
  const hasReading = topic.readingMaterial?.content;

  if (hasVideo) totalItems++;
  if (hasQuiz) totalItems++;
  if (hasMiniTask) totalItems++;
  if (hasReading) totalItems++;

  const videoProgress = enrollment.videoProgress.find(
    (vp) => vp.topicId.toString() === topic._id.toString()
  );

  const quizResult = enrollment.quizResults.find(
    (qr) => qr.topicId.toString() === topic._id.toString()
  );

  const miniTaskSubmission = enrollment.taskSubmissions.find(
    (ts) =>
      ts.taskId.toString() === topic._id.toString() &&
      ts.taskType === "mini" &&
      ts.completed
  );

  const videoCompleted =
    videoProgress && videoProgress.watchedPercentage >= 90;

  const quizCompleted =
    quizResult && quizResult.attempted;

  const taskCompleted = miniTaskSubmission;

  if (hasVideo && videoCompleted) completedItems++;
  if (hasQuiz && quizCompleted) completedItems++;
  if (hasMiniTask && taskCompleted) completedItems++;
  // NEW (correct — uses its own readingProgress)
const readingResult = enrollment.readingProgress?.find(
  (rp) => rp.topicId.toString() === topic._id.toString()
);
const readingCompleted = readingResult?.completed === true;

if (hasReading && readingCompleted) completedItems++;

  // Auto complete topic
  const topicRequirementsMet =
    (!hasVideo || videoCompleted) &&
    (!hasQuiz || quizCompleted) &&
    (!hasMiniTask || taskCompleted)&&
  (!hasReading || readingCompleted); // ← add this line

  if (topicRequirementsMet) {
    if (
      !enrollment.completedTopics.some(
        (ct) => ct.toString() === topic._id.toString()
      )
    ) {
      enrollment.completedTopics.push(topic._id);
    }
  }
});


    // ✅ AUTO MARK LEVEL COMPLETE
    const allTopicsDone = level.topics.every((topic) =>
      enrollment.completedTopics.some(
        (ct) => ct.toString() === topic._id.toString()
      )
    );

    if (allTopicsDone) {
      if (
        !enrollment.completedLevels.some(
          (cl) => cl.toString() === level._id.toString()
        )
      ) {
        enrollment.completedLevels.push(level._id);
      }
    }

    // Major Task
    if (level.majorTask && level.majorTask.title) {
      totalItems++;

      const majorTaskSubmission = enrollment.taskSubmissions.find(
        (ts) =>
          ts.taskId.toString() === level._id.toString() &&
          ts.taskType === "major" &&
          ts.completed
      );

      if (majorTaskSubmission) completedItems++;
    }
  });

  enrollment.progress =
    totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;
}


module.exports.calculateProgress = calculateProgress;