const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt' } = req.query;

    let query = { role: 'student' };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status) {
      query.isActive = status === 'active';
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single student details
// @route   GET /api/admin/students/:id
// @access  Private/Admin
exports.getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'enrolledCourses.course',
        select: 'title thumbnail category level courseType price',
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get payment history
    const payments = await Payment.find({ student: student._id })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        student,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle student active status
// @route   PATCH /api/admin/students/:id/toggle-status
// @access  Private/Admin
exports.toggleStudentStatus = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    student.isActive = !student.isActive;
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all courses (for admin management)
// @route   GET /api/admin/courses
// @access  Private/Admin
exports.getAllCoursesAdmin = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.isPublished = status === 'published';
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all comments from all courses
// @route   GET /api/admin/comments
// @access  Private/Admin
exports.getAllComments = async (req, res) => {
  try {
    const courses = await Course.find().populate({
      path: 'levels.topics.comments.student',
      select: 'name email avatar',
    });

    const allComments = [];

    courses.forEach((course) => {
      course.levels.forEach((level) => {
        level.topics.forEach((topic) => {
          topic.comments.forEach((comment) => {
            allComments.push({
              commentId: comment._id,
              courseId: course._id,
              courseName: course.title,
              levelId: level._id,
              levelTitle: level.levelTitle,
              topicId: topic._id,
              topicTitle: topic.topicTitle,
              student: comment.student,
              comment: comment.comment,
              replies: comment.replies,
              isApproved: comment.isApproved,
              createdAt: comment.createdAt,
            });
          });
        });
      });
    });

    // Sort by newest first
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: allComments.length,
      data: allComments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};