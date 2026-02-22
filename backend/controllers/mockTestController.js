const MockTest = require('../models/MockTest');
const MockTestAttempt = require('../models/MockTestAttempt');
const MockTestPayment = require('../models/MockTestPayment');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Create a new mock test
// @route   POST /api/mock-tests
// @access  Private/Admin
exports.createMockTest = async (req, res) => {
  try {
    const mockTest = await MockTest.create(req.body);
    res.status(201).json({ success: true, data: mockTest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all mock tests (admin sees unpublished too)
// @route   GET /api/mock-tests/admin
// @access  Private/Admin
exports.getAllMockTestsAdmin = async (req, res) => {
  try {
    const tests = await MockTest.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a mock test (basic info only, no questions)
// @route   PUT /api/mock-tests/:id
// @access  Private/Admin
exports.updateMockTest = async (req, res) => {
  try {
    const mockTest = await MockTest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mockTest)
      return res.status(404).json({ success: false, message: 'Test not found' });

    res.status(200).json({ success: true, data: mockTest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a mock test
// @route   DELETE /api/mock-tests/:id
// @access  Private/Admin
exports.deleteMockTest = async (req, res) => {
  try {
    const mockTest = await MockTest.findByIdAndDelete(req.params.id);
    if (!mockTest)
      return res.status(404).json({ success: false, message: 'Test not found' });

    // Delete all attempts for this test
    await MockTestAttempt.deleteMany({ mockTest: req.params.id });

    res.status(200).json({ success: true, message: 'Mock test deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle publish status
// @route   PATCH /api/mock-tests/:id/publish
// @access  Private/Admin
exports.togglePublish = async (req, res) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest)
      return res.status(404).json({ success: false, message: 'Test not found' });

    mockTest.isPublished = !mockTest.isPublished;
    await mockTest.save();

    res.status(200).json({
      success: true,
      data: mockTest,
      message: `Test ${mockTest.isPublished ? 'published' : 'unpublished'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Question Management ───────────────────────────────────────────────────────

// @desc    Add a question to a test
// @route   POST /api/mock-tests/:id/questions
// @access  Private/Admin
exports.addQuestion = async (req, res) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest)
      return res.status(404).json({ success: false, message: 'Test not found' });

    const questionData = { ...req.body };

    // If an image was uploaded via multer + cloudinary, attach it
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'lms/mock-tests/questions' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        require('stream').Readable.from(req.file.buffer).pipe(stream);
      });
      questionData.image = { public_id: result.public_id, url: result.secure_url };
    }

    mockTest.questions.push(questionData);
    await mockTest.save();

    res.status(201).json({
      success: true,
      data: mockTest.questions[mockTest.questions.length - 1],
      message: 'Question added successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a specific question
// @route   PUT /api/mock-tests/:id/questions/:questionId
// @access  Private/Admin
exports.updateQuestion = async (req, res) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest)
      return res.status(404).json({ success: false, message: 'Test not found' });

    const question = mockTest.questions.id(req.params.questionId);
    if (!question)
      return res.status(404).json({ success: false, message: 'Question not found' });

    // Handle image upload
    if (req.file) {
      // Delete old image from cloudinary if exists
      if (question.image?.public_id) {
        await cloudinary.uploader.destroy(question.image.public_id);
      }
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'lms/mock-tests/questions' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        require('stream').Readable.from(req.file.buffer).pipe(stream);
      });
      req.body.image = { public_id: result.public_id, url: result.secure_url };
    }

    Object.assign(question, req.body);
    await mockTest.save();

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a specific question
// @route   DELETE /api/mock-tests/:id/questions/:questionId
// @access  Private/Admin
exports.deleteQuestion = async (req, res) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest)
      return res.status(404).json({ success: false, message: 'Test not found' });

    const question = mockTest.questions.id(req.params.questionId);
    if (!question)
      return res.status(404).json({ success: false, message: 'Question not found' });

    // Delete question image if exists
    if (question.image?.public_id) {
      await cloudinary.uploader.destroy(question.image.public_id);
    }

    question.deleteOne();
    await mockTest.save();

    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all attempts for a test (admin analytics)
// @route   GET /api/mock-tests/:id/attempts
// @access  Private/Admin
exports.getTestAttempts = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({
      mockTest: req.params.id,
      status: 'completed',
    })
      .populate('student', 'name email avatar')
      .sort({ submittedAt: -1 });

    // Compute overview stats
    const totalAttempts = attempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
        : 0;
    const avgAccuracy =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / totalAttempts)
        : 0;

    res.status(200).json({
      success: true,
      data: attempts,
      stats: { totalAttempts, avgScore, avgAccuracy },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get all published mock tests
// @route   GET /api/mock-tests
// @access  Private/Student
exports.getPublishedMockTests = async (req, res) => {
  try {
    const tests = await MockTest.find({ isPublished: true })
      .select('-questions.correctAnswer -questions.explanation')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single published test (questions without answers)
// @route   GET /api/mock-tests/:id
// @access  Private/Student
exports.getMockTestById = async (req, res) => {
  try {
    const test = await MockTest.findOne({
      _id: req.params.id,
      isPublished: true,
    }).select('-questions.correctAnswer -questions.explanation');

    if (!test)
      return res.status(404).json({ success: false, message: 'Test not found' });

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay order for a paid test
// @route   POST /api/mock-tests/:id/create-order
// @access  Private/Student
exports.createTestOrder = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test)
      return res.status(404).json({ success: false, message: 'Test not found' });

    if (test.accessType !== 'Paid')
      return res.status(400).json({ success: false, message: 'This test is free' });

    const user = await User.findById(req.user.id);

    // Check if already paid
    const existingPayment = await MockTestPayment.findOne({
      student: user._id,
      mockTest: test._id,
      status: 'completed',
    });
    if (existingPayment)
      return res.status(400).json({ success: false, message: 'You have already purchased this test' });

    const options = {
      amount: test.price * 100,
      currency: 'INR',
      receipt: `mock_${Date.now()}`,
      notes: {
        mockTestId: test._id.toString(),
        studentId: user._id.toString(),
        testName: test.title,
      },
    };

    const order = await razorpay.orders.create(options);
    await MockTestPayment.create({
      student: user._id,
      mockTest: test._id,
      razorpayOrderId: order.id,
      amount: test.price,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: test.price,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        testName: test.title,
        studentName: user.name,
        studentEmail: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment and unlock test
// @route   POST /api/mock-tests/verify-payment
// @access  Private/Student
exports.verifyTestPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mockTestId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed' });

    const payment = await MockTestPayment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment)
      return res.status(404).json({ success: false, message: 'Payment record not found' });

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    payment.paymentDate = Date.now();
    await payment.save();

    res.status(200).json({ success: true, message: 'Payment verified! You can now take the test.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start a test attempt
// @route   POST /api/mock-tests/:id/start
// @access  Private/Student
exports.startAttempt = async (req, res) => {
  try {
    const test = await MockTest.findOne({ _id: req.params.id, isPublished: true });
    if (!test)
      return res.status(404).json({ success: false, message: 'Test not found' });

    // Paid test: verify payment
    if (test.accessType === 'Paid') {
      const payment = await MockTestPayment.findOne({
        student: req.user.id,
        mockTest: test._id,
        status: 'completed',
      });
      if (!payment)
        return res.status(403).json({ success: false, message: 'Please purchase this test first' });
    }

    // Check for existing in-progress attempt (resume it)
    let attempt = await MockTestAttempt.findOne({
      student: req.user.id,
      mockTest: test._id,
      status: 'in-progress',
    });

    if (!attempt) {
      attempt = await MockTestAttempt.create({
        student: req.user.id,
        mockTest: test._id,
        totalMarks: test.questions.length * test.markPerQuestion,
        startedAt: Date.now(),
        isPaid: test.accessType === 'Paid',
      });
    }

    // Return test with questions but WITHOUT correct answers
    const testForStudent = await MockTest.findById(test._id).select(
      '-questions.correctAnswer -questions.explanation'
    );

    res.status(200).json({
      success: true,
      data: {
        attempt,
        test: testForStudent,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit a test attempt
// @route   POST /api/mock-tests/attempts/:attemptId/submit
// @access  Private/Student
exports.submitAttempt = async (req, res) => {
  try {
    const { answers } = req.body;
    // answers: [{ questionId, selectedOption }]

    const attempt = await MockTestAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user.id,
      status: 'in-progress',
    });

    if (!attempt)
      return res.status(404).json({ success: false, message: 'Active attempt not found' });

    const test = await MockTest.findById(attempt.mockTest);
    if (!test)
      return res.status(404).json({ success: false, message: 'Test not found' });

    // Build answer map from request
    const answerMap = {};
    (answers || []).forEach((a) => {
      answerMap[a.questionId] = a.selectedOption || null;
    });

    // Evaluate each question
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const evaluatedAnswers = [];

    test.questions.forEach((q) => {
      const selected = answerMap[q._id.toString()] || null;
      const isSkipped = selected === null;
      const isCorrect = !isSkipped && selected === q.correctAnswer;

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
        score += test.markPerQuestion;
      } else {
        incorrectCount++;
        if (test.negativeMarking) {
          score -= test.negativeMarkValue;
        }
      }

      evaluatedAnswers.push({
        questionId: q._id,
        selectedOption: selected,
        isCorrect,
        isSkipped,
      });
    });

    // Accuracy based on attempted (non-skipped) questions
    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

    // Floor score at 0
    score = Math.max(0, score);

    const timeTaken = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

    attempt.answers = evaluatedAnswers;
    attempt.score = score;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.skippedCount = skippedCount;
    attempt.accuracy = accuracy;
    attempt.timeTaken = timeTaken;
    attempt.submittedAt = Date.now();
    attempt.status = 'completed';
    await attempt.save();

    await User.findByIdAndUpdate(req.user.id, {
  $push: {
    mockTests: {
      mockTest:   attempt.mockTest,
      attemptId:  attempt._id,
      score,
      totalMarks: attempt.totalMarks,
      accuracy,
      attemptedAt: Date.now(),
    },
  },
});

    // Update test aggregate stats
    const allAttempts = await MockTestAttempt.find({ mockTest: test._id, status: 'completed' });
    test.totalAttempts = allAttempts.length;
    test.averageScore =
      allAttempts.length > 0
        ? Math.round(allAttempts.reduce((s, a) => s + a.score, 0) / allAttempts.length)
        : 0;
    await test.save();

    // Build detailed result with correct answers
    const detailedResult = test.questions.map((q) => {
      const ans = evaluatedAnswers.find((a) => a.questionId.toString() === q._id.toString());
      return {
        questionId: q._id,
        question: q.question,
        image: q.image,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        selectedOption: ans?.selectedOption || null,
        isCorrect: ans?.isCorrect || false,
        isSkipped: ans?.isSkipped || true,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        score,
        totalMarks: attempt.totalMarks,
        correctCount,
        incorrectCount,
        skippedCount,
        accuracy,
        timeTaken,
        detailedResult,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get result of a completed attempt
// @route   GET /api/mock-tests/attempts/:attemptId/result
// @access  Private/Student
exports.getAttemptResult = async (req, res) => {
  try {
    const attempt = await MockTestAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user.id,
      status: 'completed',
    }).populate('mockTest');

    if (!attempt)
      return res.status(404).json({ success: false, message: 'Result not found' });

    const test = await MockTest.findById(attempt.mockTest._id);

    const detailedResult = test.questions.map((q) => {
      const ans = attempt.answers.find((a) => a.questionId.toString() === q._id.toString());
      return {
        questionId: q._id,
        question: q.question,
        image: q.image,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        selectedOption: ans?.selectedOption || null,
        isCorrect: ans?.isCorrect || false,
        isSkipped: ans?.isSkipped || true,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...attempt.toObject(),
        detailedResult,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAttempts = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    let attempts = await MockTestAttempt.find({
      student: req.user._id,
      status: "completed",
    })
      .populate("mockTest", "title duration markPerQuestion")
      .sort({ submittedAt: -1 });

    // 🛡 Force array safety
    if (!Array.isArray(attempts)) {
      attempts = [];
    }

    const totalAttempts = attempts.length;

    const avgScore =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce((sum, attempt) => {
              return sum + (attempt?.score || 0);
            }, 0) / totalAttempts
          )
        : 0;

    const avgAccuracy =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce((sum, attempt) => {
              return sum + (attempt?.accuracy || 0);
            }, 0) / totalAttempts
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: attempts,
      stats: { totalAttempts, avgScore, avgAccuracy },
    });

  } catch (error) {
    console.error("GET MY ATTEMPTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};