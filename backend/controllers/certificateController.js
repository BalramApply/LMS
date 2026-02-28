const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Course = require("../models/Course");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ✅ Add this helper above your exports
function checkCourseEligibility(course, enrollment) {
  const eligibility = {
    videoCompletion: false,
    allQuizzesAttempted: false,
    allMiniTasksCompleted: false,
    allMajorTasksCompleted: false,
  };

  let totalVideos = 0,
    videosWatched = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.video?.url) {
        totalVideos++;
        const vp = enrollment.videoProgress.find(
          (v) => v.topicId.toString() === topic._id.toString(),
        );
        // ✅ Match the >= 90 threshold used in calculateProgress
        if (vp?.watchedPercentage >= 90) videosWatched++;
      }
    });
  });
  eligibility.videoCompletion =
    totalVideos > 0 && videosWatched === totalVideos;

  let totalQuizzes = 0,
    quizzesAttempted = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.quiz?.length > 0) {
        totalQuizzes++;
        const qr = enrollment.quizResults.find(
          (q) => q.topicId.toString() === topic._id.toString(),
        );
        if (qr?.attempted) quizzesAttempted++;
      }
    });
  });
  eligibility.allQuizzesAttempted =
    totalQuizzes > 0 && quizzesAttempted === totalQuizzes;

  let totalMini = 0,
    miniDone = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.miniTask?.title) {
        totalMini++;
        const ts = enrollment.taskSubmissions.find(
          (t) =>
            t.taskId.toString() === topic._id.toString() &&
            t.taskType === "mini" &&
            t.completed,
        );
        if (ts) miniDone++;
      }
    });
  });
  eligibility.allMiniTasksCompleted = totalMini > 0 && miniDone === totalMini;

  let totalMajor = 0,
    majorDone = 0;
  course.levels.forEach((level) => {
    if (level.majorTask?.title) {
      totalMajor++;
      const ts = enrollment.taskSubmissions.find(
        (t) =>
          t.taskId.toString() === level._id.toString() &&
          t.taskType === "major" &&
          t.completed,
      );
      if (ts) majorDone++;
    }
  });
  eligibility.allMajorTasksCompleted =
    totalMajor > 0 && majorDone === totalMajor;

  if (course.capstoneProject?.title) {
    const cs = enrollment.taskSubmissions.find(
      (t) =>
        t.taskId.toString() === course._id.toString() &&
        t.taskType === "capstone" &&
        t.completed,
    );
    eligibility.capstoneCompleted = !!cs;
  }

  const isEligible = Object.values(eligibility).every((v) => v === true);
  return { isEligible, eligibility };
}
// @desc    Check if student eligible for certificate
// @route   GET /api/certificates/check-eligibility/:courseId
// @access  Private/Student
exports.checkEligibility = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === req.params.courseId,
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Check eligibility criteria
    const eligibility = {
      videoCompletion: false,
      allQuizzesAttempted: false,
      allMiniTasksCompleted: false,
      allMajorTasksCompleted: false,
    };

    // Check video completion (100%)
    let totalVideos = 0;
    let videosWatched = 0;
    course.levels.forEach((level) => {
      level.topics.forEach((topic) => {
        if (topic.video && topic.video.url) {
          totalVideos++;
          const videoProgress = enrollment.videoProgress.find(
            (vp) => vp.topicId.toString() === topic._id.toString(),
          );
          if (videoProgress && videoProgress.watchedPercentage >= 100) {
            videosWatched++;
          }
        }
      });
    });
    eligibility.videoCompletion =
      totalVideos > 0 && videosWatched === totalVideos;

    // Check all quizzes attempted
    let totalQuizzes = 0;
    let quizzesAttempted = 0;
    course.levels.forEach((level) => {
      level.topics.forEach((topic) => {
        if (topic.quiz && topic.quiz.length > 0) {
          totalQuizzes++;
          const quizResult = enrollment.quizResults.find(
            (qr) => qr.topicId.toString() === topic._id.toString(),
          );
          if (quizResult && quizResult.attempted) {
            quizzesAttempted++;
          }
        }
      });
    });
    eligibility.allQuizzesAttempted =
      totalQuizzes > 0 && quizzesAttempted === totalQuizzes;

    // Check all mini tasks completed
    let totalMiniTasks = 0;
    let miniTasksCompleted = 0;
    course.levels.forEach((level) => {
      level.topics.forEach((topic) => {
        if (topic.miniTask && topic.miniTask.title) {
          totalMiniTasks++;
          const taskSubmission = enrollment.taskSubmissions.find(
            (ts) =>
              ts.taskId.toString() === topic._id.toString() &&
              ts.taskType === "mini" &&
              ts.completed,
          );
          if (taskSubmission) {
            miniTasksCompleted++;
          }
        }
      });
    });
    eligibility.allMiniTasksCompleted =
      totalMiniTasks > 0 && miniTasksCompleted === totalMiniTasks;

    // Check all major tasks completed
    let totalMajorTasks = 0;
    let majorTasksCompleted = 0;
    course.levels.forEach((level) => {
      if (level.majorTask && level.majorTask.title) {
        totalMajorTasks++;
        const taskSubmission = enrollment.taskSubmissions.find(
          (ts) =>
            ts.taskId.toString() === level._id.toString() &&
            ts.taskType === "major" &&
            ts.completed,
        );
        if (taskSubmission) {
          majorTasksCompleted++;
        }
      }
    });
    eligibility.allMajorTasksCompleted =
      totalMajorTasks > 0 && majorTasksCompleted === totalMajorTasks;

    // Check capstone project
    if (course.capstoneProject && course.capstoneProject.title) {
      const capstoneSubmission = enrollment.taskSubmissions.find(
        (ts) =>
          ts.taskId.toString() === course._id.toString() &&
          ts.taskType === "capstone" &&
          ts.completed,
      );
      eligibility.capstoneCompleted = !!capstoneSubmission;
    }

    const isEligible = Object.values(eligibility).every(
      (value) => value === true,
    );

    res.status(200).json({
      success: true,
      data: {
        isEligible,
        eligibility,
        certificateIssued: enrollment.certificateIssued,
        certificateId: enrollment.certificateId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate certificate for student
// @route   POST /api/certificates/generate/:courseId
// @access  Private/Student
exports.generateCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === req.params.courseId,
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Check if already has certificate
    if (enrollment.certificateIssued) {
      const existingCertificate = await Certificate.findOne({
        certificateId: enrollment.certificateId,
      });
      return res.status(200).json({
        success: true,
        message: "Certificate already issued",
        data: existingCertificate,
      });
    }

    // Verify eligibility using shared helper
    const { isEligible } = checkCourseEligibility(course, enrollment);
    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message:
          "You are not eligible for a certificate yet. Complete all course requirements.",
      });
    }

    // Create certificate
    const certificate = await Certificate.create({
      student: user._id,
      course: course._id,
      studentName: user.name,
      courseName: course.title,
      courseDuration: "120 Hours",
    });

    // Generate QR code
    const qrCodeData = `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificateId}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    certificate.qrCode = qrCodeImage;

    // Generate PDF certificate
    const pdfBuffer = await generateCertificatePDF(certificate);

    // Upload to Cloudinary
    // ✅ After
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "lms/certificates",
        resource_type: "image",
        format: "jpg",
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Error uploading certificate",
          });
        }

        certificate.certificatePDF = {
          public_id: result.public_id,
          url: result.secure_url,
        };

        await certificate.save();

        // Update user enrollment
        enrollment.certificateIssued = true;
        enrollment.certificateId = certificate.certificateId;
        enrollment.certificateIssuedDate = certificate.issueDate;
        await user.save();

        res.status(201).json({
          success: true,
          message: "Certificate generated successfully",
          data: certificate,
        });
      },
    );

    streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    })
      .populate("student", "name email")
      .populate("course", "title");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
        issueDate: certificate.issueDate,
        status: certificate.status,
        platformName: "LMS Platform",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get student certificates
// @route   GET /api/certificates/my-certificates
// @access  Private/Student
exports.getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      student: req.user.id,
    }).populate("course", "title thumbnail");

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// ── PROFESSIONAL COLOR PALETTE ─────────────────────────────
// Deep Navy:       #1a2e4a  (primary brand)
// Royal Blue:      #1e4d9b  (accents / headings)
// Gold:            #b8963e  (premium accent)
// Light Gold:      #d4af6a  (secondary gold)
// Pale Gold:       #f5e6c8  (subtle fills)
// Off-White:       #fdfcf8  (background)
// Light Gray:      #f0eff0  (panel fill)
// Mid Gray:        #a0a4ab  (secondary text)
// Dark Text:       #1a2e4a  (body copy)

async function generateCertificatePDF(certificate) {
  const width = 1754;
  const height = 1240;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ── 1. WHITE BACKGROUND ──────────────────────────────────
  ctx.fillStyle = "#fdfcf8";
  ctx.fillRect(0, 0, width, height);

  // ── 2. SUBTLE WATERMARK PATTERN (diagonal lines) ─────────
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = "#1a2e4a";
  ctx.lineWidth = 1;
  for (let d = -height; d < width + height; d += 40) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + height, height);
    ctx.stroke();
  }
  ctx.restore();

  // ── 3. OUTER TRIPLE BORDER ───────────────────────────────
  // Outermost thin gold line
  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Middle gap — white
  // Main thick navy border
  ctx.strokeStyle = "#1a2e4a";
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // Inner fine gold line
  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  // ── 4. CORNER ORNAMENTS ──────────────────────────────────
  const drawCornerOrnament = (cx, cy, flipX, flipY) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flipX, flipY);

    // Corner L-bracket
    ctx.strokeStyle = "#b8963e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(0, 0);
    ctx.lineTo(50, 0);
    ctx.stroke();

    // Inner bracket
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#1a2e4a";
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(10, 10);
    ctx.lineTo(50, 10);
    ctx.stroke();

    // Corner dot
    ctx.beginPath();
    ctx.arc(10, 10, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#b8963e";
    ctx.fill();

    // Small diamond
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(55, 5);
    ctx.lineTo(50, 10);
    ctx.lineTo(45, 5);
    ctx.closePath();
    ctx.fillStyle = "#b8963e";
    ctx.fill();

    ctx.restore();
  };

  drawCornerOrnament(44, 44, 1, 1);
  drawCornerOrnament(width - 44, 44, -1, 1);
  drawCornerOrnament(44, height - 44, 1, -1);
  drawCornerOrnament(width - 44, height - 44, -1, -1);

  // ── 5. TOP HEADER PANEL ──────────────────────────────────
  // Pale gold header band
  ctx.fillStyle = "#f7f1e3";
  ctx.fillRect(44, 44, width - 88, 130);

  // Gold accent line at bottom of header
  ctx.fillStyle = "#b8963e";
  ctx.fillRect(44, 174, width - 88, 2);
  ctx.fillStyle = "#1a2e4a";
  ctx.fillRect(44, 178, width - 88, 1);

  // ── 6. LOGO (top left) ───────────────────────────────────
  try {
    const logoPath = path.join(__dirname, "../assets/logo.jpg");
    const logo = await loadImage(logoPath);
    ctx.save();
    ctx.beginPath();
    ctx.arc(112, 109, 52, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, 60, 57, 104, 104);
    ctx.restore();
    // Circle border
    ctx.beginPath();
    ctx.arc(112, 109, 52, 0, Math.PI * 2);
    ctx.strokeStyle = "#b8963e";
    ctx.lineWidth = 2;
    ctx.stroke();
  } catch (err) {
    // Fallback monogram
    ctx.beginPath();
    ctx.arc(112, 109, 52, 0, Math.PI * 2);
    ctx.fillStyle = "#1a2e4a";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("SL", 112, 120);
  }

  // Company name
  ctx.textAlign = "left";
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "bold 22px Georgia, serif";
  ctx.letterSpacing = "0.1em";
  ctx.fillText("SUCCESSFUL LEARNING", 178, 100);
  ctx.fillStyle = "#b8963e";
  ctx.font = "14px Georgia, serif";
  ctx.fillText("Excellence in Online Education", 178, 126);
  ctx.fillStyle = "#a0a4ab";
  ctx.font = "12px sans-serif";
  ctx.fillText("www.successfullearning.com", 178, 150);

  // ── 7. QUALITY SEAL (top right) ──────────────────────────
  const sx = width - 135,
    sy = 109,
    sr = 72;

  // Outer gold ring
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Navy fill
  ctx.beginPath();
  ctx.arc(sx, sy, sr - 5, 0, Math.PI * 2);
  ctx.fillStyle = "#1a2e4a";
  ctx.fill();

  // Scalloped edge
  ctx.fillStyle = "#b8963e";
  const petalCount = 24;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const px = sx + Math.cos(angle) * (sr - 3);
    const py = sy + Math.sin(angle) * (sr - 3);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inner circle
  ctx.beginPath();
  ctx.arc(sx, sy, sr - 22, 0, Math.PI * 2);
  ctx.strokeStyle = "#d4af6a";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Seal text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("QUALITY", sx, sy - 14);
  ctx.fillStyle = "#d4af6a";
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillText("✦ ✦ ✦", sx, sy + 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("ASSURED", sx, sy + 18);

  // ── 8. DECORATIVE CENTRE TOP ELEMENT ─────────────────────
  ctx.textAlign = "center";
  // Small ornament row above "Certificate"
  ctx.fillStyle = "#b8963e";
  ctx.font = "18px Georgia, serif";
  ctx.fillText("— ✦ —", width / 2, 230);

  // ── 9. "Certificate" TITLE ───────────────────────────────
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "italic 110px Georgia, serif";
  ctx.fillText("Certificate", width / 2, 345);

  // ── 10. "OF COMPLETION" SUBTITLE ─────────────────────────
  // Letter-spaced caps
  ctx.fillStyle = "#b8963e";
  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText("O F   C O M P L E T I O N", width / 2, 400);

  // Gold rule lines
  const ruleY = 420;
  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 1.5;
  [
    [250, 580],
    [width - 250, width - 580],
  ].forEach(([outer, inner]) => {
    ctx.beginPath();
    ctx.moveTo(outer, ruleY);
    ctx.lineTo(inner, ruleY);
    ctx.stroke();
  });
  // Dot in center
  ctx.beginPath();
  ctx.arc(width / 2, ruleY, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#b8963e";
  ctx.fill();

  // ── 11. PRESENTED TO LABEL ───────────────────────────────
  ctx.fillStyle = "#a0a4ab";
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("This certificate is proudly presented to", width / 2, 475);

  // ── 12. STUDENT NAME ─────────────────────────────────────
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "italic bold 78px Georgia, serif";
  ctx.fillText(certificate.studentName, width / 2, 580);

  // Elegant underline
  const nameWidth = ctx.measureText(certificate.studentName).width;
  const nameX = width / 2;

  ctx.strokeStyle = "#1a2e4a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(nameX - nameWidth / 2, 600);
  ctx.lineTo(nameX + nameWidth / 2, 600);
  ctx.stroke();

  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(nameX - nameWidth / 2 + 20, 606);
  ctx.lineTo(nameX + nameWidth / 2 - 20, 606);
  ctx.stroke();

  // Flanking diamonds
  const drawSolidDiamond = (cx, cy, size) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fillStyle = "#b8963e";
    ctx.fill();
  };
  drawSolidDiamond(nameX - nameWidth / 2 - 15, 603, 7);
  drawSolidDiamond(nameX + nameWidth / 2 + 15, 603, 7);

  // ── 13. COMPLETION TEXT ──────────────────────────────────
  ctx.fillStyle = "#5a6270";
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("for successfully completing the course in", width / 2, 660);

  // ── 14. COURSE NAME ──────────────────────────────────────
  ctx.fillStyle = "#1e4d9b";
  ctx.font = "bold 52px Georgia, serif";
  ctx.fillText(certificate.courseName.toUpperCase(), width / 2, 740);

  // Thin gold rule under course name
  ctx.strokeStyle = "#d4af6a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, 760);
  ctx.lineTo(width - 300, 760);
  ctx.stroke();

  // ── 15. DURATION / MODE ROW ──────────────────────────────
  ctx.fillStyle = "#a0a4ab";
  ctx.font = "21px Georgia, serif";
  ctx.fillText(
    `Duration: ${certificate.courseDuration}   ✦   Mode: Online`,
    width / 2,
    810,
  );

  // ── 16. MAIN DIVIDER ─────────────────────────────────────
  // Full-width elegant rule
  ctx.strokeStyle = "#1a2e4a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 845);
  ctx.lineTo(width - 200, 845);
  ctx.stroke();
  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(200, 850);
  ctx.lineTo(width - 200, 850);
  ctx.stroke();
  drawSolidDiamond(width / 2, 847, 10);

  // ── 17. FOOTER DISCLAIMER ────────────────────────────────
  ctx.fillStyle = "#a0a4ab";
  ctx.font = "italic 19px Georgia, serif";
  ctx.fillText(
    "This is a computer-generated certificate and does not require a signature.",
    width / 2,
    900,
  );

  ctx.fillStyle = "#c8cbd0";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Credential ID: ${certificate.certificateId}`, width / 2, 935);

  // ── 18. BOTTOM BRANDING ──────────────────────────────────
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "bold 20px Georgia, serif";
  ctx.fillText("S U C C E S S F U L   L E A R N I N G", width / 2, height - 50);

  // Bottom gold rule
  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, height - 60);
  ctx.lineTo(width - 200, height - 60);
  ctx.stroke();

  // ── 19. DATE BLOCK (bottom right) ────────────────────────
  const issueDate = new Date(certificate.issueDate).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  ctx.textAlign = "right";
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "bold 24px Georgia, serif";
  ctx.fillText(issueDate, width - 220, 990);

  ctx.strokeStyle = "#b8963e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width - 480, 1003);
  ctx.lineTo(width - 205, 1003);
  ctx.stroke();

  ctx.fillStyle = "#a0a4ab";
  ctx.font = "italic 17px Georgia, serif";
  ctx.fillText("Date of Completion", width - 220, 1025);

  // ── 20. QR CODE (bottom left) ────────────────────────────
  if (certificate.qrCode) {
    try {
      const qrImage = await loadImage(certificate.qrCode);

      // QR background box
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#b8963e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(195, 955, 175, 175, 4);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(qrImage, 202, 962, 161, 161);

      ctx.fillStyle = "#a0a4ab";
      ctx.font = "italic 16px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan to Verify", 282, 1152);
    } catch (err) {
      console.log("QR error:", err);
    }
  }

  // ── 21. SIGNATORY BLOCK (bottom centre-left) ─────────────
  const sigX = width / 2 - 160;
  const sigY = 980;

  // Signature "Balram" in cursive style
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "italic bold 52px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Balram", sigX, sigY + 45);

  // Signature underline flourish
  const sigTextWidth = ctx.measureText("Balram").width;
  ctx.strokeStyle = "#1a2e4a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sigX - sigTextWidth / 2 - 10, sigY + 56);
  ctx.bezierCurveTo(
    sigX - sigTextWidth / 4,
    sigY + 62,
    sigX + sigTextWidth / 4,
    sigY + 50,
    sigX + sigTextWidth / 2 + 18,
    sigY + 60,
  );
  ctx.stroke();

  // Horizontal rule below signature
  ctx.strokeStyle = "#1a2e4a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sigX - 140, sigY + 75);
  ctx.lineTo(sigX + 140, sigY + 75);
  ctx.stroke();

  ctx.fillStyle = "#a0a4ab";
  ctx.font = "italic 17px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Director, Successful Learning", sigX, sigY + 100);

  // ── 22. EMBOSSED CENTRE WATERMARK ────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#1a2e4a";
  ctx.font = "bold 220px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("SL", width / 2, height / 2 + 60);
  ctx.restore();

  return canvas.toBuffer("image/jpeg", { quality: 0.97 });
}

// module.exports = { generateCertificatePDF };
