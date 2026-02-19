/**
 * Calculate course progress percentage
 */
export const calculateProgress = (enrollment, course) => {
  if (!enrollment || !course) return 0;

  let totalItems = 0;
  let completedItems = 0;

  // Count video progress
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.video && topic.video.url) {
        totalItems++;
        const videoProgress = enrollment.videoProgress.find(
          (vp) => vp.topicId === topic._id
        );
        if (videoProgress && videoProgress.watchedPercentage >= 90) {
          completedItems++;
        }
      }

      // Count quizzes
      if (topic.quiz && topic.quiz.length > 0) {
        totalItems++;
        const quizResult = enrollment.quizResults.find(
          (qr) => qr.topicId === topic._id
        );
        if (quizResult && quizResult.attempted) {
          completedItems++;
        }
      }

      // Count mini tasks
      if (topic.miniTask && topic.miniTask.title) {
        totalItems++;
        const taskSubmission = enrollment.taskSubmissions.find(
          (ts) => ts.taskId === topic._id && ts.taskType === 'mini'
        );
        if (taskSubmission && taskSubmission.completed) {
          completedItems++;
        }
      }
    });

    // Count major tasks
    if (level.majorTask && level.majorTask.title) {
      totalItems++;
      const majorTask = enrollment.taskSubmissions.find(
        (ts) => ts.taskId === level._id && ts.taskType === 'major'
      );
      if (majorTask && majorTask.completed) {
        completedItems++;
      }
    }
  });

  // Count capstone project
  if (course.capstoneProject && course.capstoneProject.title) {
    totalItems++;
    const capstone = enrollment.taskSubmissions.find(
      (ts) => ts.taskId === course._id && ts.taskType === 'capstone'
    );
    if (capstone && capstone.completed) {
      completedItems++;
    }
  }

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};

/**
 * Check if topic is completed
 */
export const isTopicCompleted = (topicId, completedTopics) => {
  return completedTopics.some((ct) => ct.toString() === topicId);
};

/**
 * Check if level is completed
 */
export const isLevelCompleted = (levelId, completedLevels) => {
  return completedLevels.some((cl) => cl.toString() === levelId);
};

/**
 * Check if level is unlocked
 */
export const isLevelUnlocked = (levelIndex, completedLevels, levels) => {
  // First level is always unlocked
  if (levelIndex === 0) return true;

  // Check if previous level is completed
  if (levelIndex > 0) {
    const previousLevel = levels[levelIndex - 1];
    return isLevelCompleted(previousLevel._id, completedLevels);
  }

  return false;
};

/**
 * Get video progress for a topic
 */
export const getVideoProgress = (topicId, videoProgressArray) => {
  const progress = videoProgressArray.find((vp) => vp.topicId === topicId);
  return progress
    ? {
        percentage: progress.watchedPercentage,
        timestamp: progress.lastWatchedTimestamp,
      }
    : { percentage: 0, timestamp: 0 };
};

/**
 * Get quiz result for a topic
 */
export const getQuizResult = (topicId, quizResults) => {
  return quizResults.find((qr) => qr.topicId === topicId);
};

/**
 * Get task submission
 */
export const getTaskSubmission = (taskId, taskType, taskSubmissions) => {
  return taskSubmissions.find(
    (ts) => ts.taskId === taskId && ts.taskType === taskType
  );
};

/**
 * Check certificate eligibility
 */
export const checkCertificateEligibility = (enrollment, course) => {
  if (!enrollment || !course) return false;

  // Must be 100% complete
  if (enrollment.progress < 100) return false;

  // All videos watched
  let totalVideos = 0;
  let watchedVideos = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.video && topic.video.url) {
        totalVideos++;
        const progress = getVideoProgress(topic._id, enrollment.videoProgress);
        if (progress.percentage >= 100) {
          watchedVideos++;
        }
      }
    });
  });

  if (totalVideos !== watchedVideos) return false;

  // All quizzes attempted
  let totalQuizzes = 0;
  let attemptedQuizzes = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.quiz && topic.quiz.length > 0) {
        totalQuizzes++;
        const result = getQuizResult(topic._id, enrollment.quizResults);
        if (result && result.attempted) {
          attemptedQuizzes++;
        }
      }
    });
  });

  if (totalQuizzes !== attemptedQuizzes) return false;

  // All tasks submitted
  let totalTasks = 0;
  let submittedTasks = 0;

  // Mini tasks
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.miniTask && topic.miniTask.title) {
        totalTasks++;
        const submission = getTaskSubmission(
          topic._id,
          'mini',
          enrollment.taskSubmissions
        );
        if (submission && submission.completed) {
          submittedTasks++;
        }
      }
    });

    // Major tasks
    if (level.majorTask && level.majorTask.title) {
      totalTasks++;
      const submission = getTaskSubmission(
        level._id,
        'major',
        enrollment.taskSubmissions
      );
      if (submission && submission.completed) {
        submittedTasks++;
      }
    }
  });

  // Capstone
  if (course.capstoneProject && course.capstoneProject.title) {
    totalTasks++;
    const submission = getTaskSubmission(
      course._id,
      'capstone',
      enrollment.taskSubmissions
    );
    if (submission && submission.completed) {
      submittedTasks++;
    }
  }

  return totalTasks === submittedTasks;
};

/**
 * Format time duration (seconds to readable format)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (percentage) => {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Get progress text color
 */
export const getProgressTextColor = (percentage) => {
  if (percentage >= 75) return 'text-green-600';
  if (percentage >= 50) return 'text-yellow-600';
  if (percentage >= 25) return 'text-orange-600';
  return 'text-red-600';
};