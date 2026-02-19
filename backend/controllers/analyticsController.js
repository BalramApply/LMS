const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Total courses
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });

    // Total students
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({
      role: 'student',
      isActive: true,
    });

    // Total revenue
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Total enrollments
    const users = await User.find({ role: 'student' });
    const totalEnrollments = users.reduce(
      (sum, user) => sum + user.enrolledCourses.length,
      0
    );

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentEnrollments = 0;
    users.forEach((user) => {
      user.enrolledCourses.forEach((ec) => {
        if (new Date(ec.enrolledAt) >= thirtyDaysAgo) {
          recentEnrollments++;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        publishedCourses,
        totalStudents,
        activeStudents,
        totalRevenue,
        totalEnrollments,
        recentEnrollments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get enrollments over time
// @route   GET /api/analytics/enrollments-over-time
// @access  Private/Admin
exports.getEnrollmentsOverTime = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const users = await User.find({ role: 'student' });

    // Create date map
    const enrollmentMap = {};
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      enrollmentMap[dateStr] = 0;
    }

    // Count enrollments by date
    users.forEach((user) => {
      user.enrolledCourses.forEach((ec) => {
        const enrollDate = new Date(ec.enrolledAt);
        if (enrollDate >= startDate) {
          const dateStr = enrollDate.toISOString().split('T')[0];
          if (enrollmentMap[dateStr] !== undefined) {
            enrollmentMap[dateStr]++;
          }
        }
      });
    });

    // Convert to array format
    const data = Object.keys(enrollmentMap)
      .sort()
      .map((date) => ({
        date,
        enrollments: enrollmentMap[date],
      }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month or day

    const payments = await Payment.find({ status: 'completed' }).populate(
      'course',
      'title'
    );

    let revenueMap = {};
    let totalRevenue = 0;

    if (period === 'day') {
      // Last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        revenueMap[dateStr] = 0;
      }

      payments.forEach((payment) => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        if (revenueMap[paymentDate] !== undefined) {
          revenueMap[paymentDate] += payment.amount;
        }
        totalRevenue += payment.amount;
      });

      const data = Object.keys(revenueMap)
        .sort()
        .map((date) => ({
          date,
          revenue: revenueMap[date],
        }));

      res.status(200).json({
        success: true,
        data,
        totalRevenue,
      });
    } else {
      // Last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueMap[monthYear] = 0;
      }

      payments.forEach((payment) => {
        const date = new Date(payment.paymentDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (revenueMap[monthYear] !== undefined) {
          revenueMap[monthYear] += payment.amount;
        }
        totalRevenue += payment.amount;
      });

      const data = Object.keys(revenueMap)
        .sort()
        .map((month) => ({
          month,
          revenue: revenueMap[month],
        }));

      res.status(200).json({
        success: true,
        data,
        totalRevenue,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get best-selling courses
// @route   GET /api/analytics/best-selling-courses
// @access  Private/Admin
exports.getBestSellingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ courseType: 'Paid' })
      .sort({ totalRevenue: -1 })
      .limit(10)
      .select('title totalRevenue enrolledStudents thumbnail');

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get course completion statistics
// @route   GET /api/analytics/course-completion
// @access  Private/Admin
exports.getCourseCompletionStats = async (req, res) => {
  try {
    const courses = await Course.find().select('title enrolledStudents');
    const users = await User.find({ role: 'student' });

    const courseStats = [];

    for (const course of courses) {
      let totalEnrolled = 0;
      let totalProgress = 0;
      let completed = 0;

      users.forEach((user) => {
        const enrollment = user.enrolledCourses.find(
          (ec) => ec.course.toString() === course._id.toString()
        );
        if (enrollment) {
          totalEnrolled++;
          totalProgress += enrollment.progress;
          if (enrollment.progress === 100) {
            completed++;
          }
        }
      });

      const avgCompletion = totalEnrolled > 0 ? totalProgress / totalEnrolled : 0;
      const completionRate = totalEnrolled > 0 ? (completed / totalEnrolled) * 100 : 0;

      courseStats.push({
        courseId: course._id,
        courseName: course.title,
        totalEnrolled,
        completed,
        avgCompletion: Math.round(avgCompletion),
        completionRate: Math.round(completionRate),
      });
    }

    res.status(200).json({
      success: true,
      data: courseStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get most active students
// @route   GET /api/analytics/active-students
// @access  Private/Admin
exports.getMostActiveStudents = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('name email avatar enrolledCourses')
      .sort({ 'enrolledCourses.length': -1 })
      .limit(10);

    const activeStudents = users.map((user) => ({
      studentId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coursesEnrolled: user.enrolledCourses.length,
      avgProgress: Math.round(
        user.enrolledCourses.reduce((sum, ec) => sum + ec.progress, 0) /
          (user.enrolledCourses.length || 1)
      ),
    }));

    res.status(200).json({
      success: true,
      data: activeStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get student performance heatmap
// @route   GET /api/analytics/student-performance/:courseId
// @access  Private/Admin
exports.getStudentPerformanceHeatmap = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    const users = await User.find({ role: 'student' });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const performanceData = [];

    users.forEach((user) => {
      const enrollment = user.enrolledCourses.find(
        (ec) => ec.course.toString() === req.params.courseId
      );

      if (enrollment) {
        performanceData.push({
          studentId: user._id,
          studentName: user.name,
          progress: enrollment.progress,
          completedLevels: enrollment.completedLevels.length,
          completedTopics: enrollment.completedTopics.length,
          quizzesAttempted: enrollment.quizResults.length,
          avgQuizScore: Math.round(
            enrollment.quizResults.reduce((sum, qr) => sum + (qr.score / qr.totalQuestions) * 100, 0) /
              (enrollment.quizResults.length || 1)
          ),
        });
      }
    });

    res.status(200).json({
      success: true,
      data: performanceData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get average quiz scores per topic
// @route   GET /api/analytics/quiz-scores/:courseId
// @access  Private/Admin
exports.getAverageQuizScores = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    const users = await User.find({ role: 'student' });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const topicScores = {};

    // Initialize topic scores
    course.levels.forEach((level) => {
      level.topics.forEach((topic) => {
        topicScores[topic._id] = {
          topicId: topic._id,
          topicTitle: topic.topicTitle,
          levelNumber: level.levelNumber,
          scores: [],
        };
      });
    });

    // Collect all quiz scores
    users.forEach((user) => {
      const enrollment = user.enrolledCourses.find(
        (ec) => ec.course.toString() === req.params.courseId
      );

      if (enrollment) {
        enrollment.quizResults.forEach((qr) => {
          if (topicScores[qr.topicId]) {
            const percentage = (qr.score / qr.totalQuestions) * 100;
            topicScores[qr.topicId].scores.push(percentage);
          }
        });
      }
    });

    // Calculate averages
    const results = Object.values(topicScores).map((topic) => ({
      ...topic,
      avgScore: topic.scores.length > 0
        ? Math.round(topic.scores.reduce((a, b) => a + b, 0) / topic.scores.length)
        : 0,
      attempts: topic.scores.length,
      scores: undefined, // Remove raw scores from response
    }));

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};