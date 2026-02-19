const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

// @desc    Enroll in free course
// @route   POST /api/enrollment/free/:courseId
// @access  Private/Student
exports.enrollFreeCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.courseType !== 'Free') {
      return res.status(400).json({
        success: false,
        message: 'This is a paid course. Please use payment method.',
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already enrolled
    const alreadyEnrolled = user.enrolledCourses.some(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
    }

    // Enroll student
    user.enrolledCourses.push({
      course: course._id,
      enrolledAt: Date.now(),
      progress: 0,
    });

    await user.save();

    // Update course enrolled students count
    course.enrolledStudents += 1;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create Razorpay order for paid course
// @route   POST /api/enrollment/create-order/:courseId
// @access  Private/Student
exports.createOrder = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.courseType !== 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This is a free course. Please enroll directly.',
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already enrolled
    const alreadyEnrolled = user.enrolledCourses.some(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
    }

    // Get effective price (with discount if applicable)
    let amount = course.price;
    if (course.discountPrice && course.discountValidTill) {
      const now = new Date();
      if (now <= course.discountValidTill) {
        amount = course.discountPrice;
      }
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        courseId: course._id.toString(),
        studentId: user._id.toString(),
        courseName: course.title,
      },
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = await Payment.create({
      student: user._id,
      course: course._id,
      razorpayOrderId: order.id,
      amount: amount,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        courseName: course.title,
        studentName: user.name,
        studentEmail: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify Razorpay payment and enroll student
// @route   POST /api/enrollment/verify-payment
// @access  Private/Student
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Update payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    payment.paymentDate = Date.now();
    await payment.save();

    // Enroll student
    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);

    user.enrolledCourses.push({
      course: course._id,
      enrolledAt: Date.now(),
      progress: 0,
    });

    await user.save();

    // Update course statistics
    course.enrolledStudents += 1;
    course.totalRevenue += payment.amount;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Payment successful! You are now enrolled in the course.',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get enrolled courses for student
// @route   GET /api/enrollment/my-courses
// @access  Private/Student
exports.getMyEnrolledCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'enrolledCourses.course',
      select: 'title thumbnail category level courseType price instructorName',
    });

    res.status(200).json({
      success: true,
      data: user.enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get course enrollment details for student
// @route   GET /api/enrollment/course/:courseId
// @access  Private/Student
exports.getCourseEnrollmentDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    const course = await Course.findById(req.params.courseId);

    res.status(200).json({
      success: true,
      data: {
        course,
        enrollment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};