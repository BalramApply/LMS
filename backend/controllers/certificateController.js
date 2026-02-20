const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Course = require('../models/Course');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// ✅ Add this helper above your exports
function checkCourseEligibility(course, enrollment) {
  const eligibility = {
    videoCompletion: false,
    allQuizzesAttempted: false,
    allMiniTasksCompleted: false,
    allMajorTasksCompleted: false,
  };

  let totalVideos = 0, videosWatched = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.video?.url) {
        totalVideos++;
        const vp = enrollment.videoProgress.find(
          (v) => v.topicId.toString() === topic._id.toString()
        );
        if (vp?.watchedPercentage >= 100) videosWatched++;
      }
    });
  });
  eligibility.videoCompletion = totalVideos > 0 && videosWatched === totalVideos;

  let totalQuizzes = 0, quizzesAttempted = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.quiz?.length > 0) {
        totalQuizzes++;
        const qr = enrollment.quizResults.find(
          (q) => q.topicId.toString() === topic._id.toString()
        );
        if (qr?.attempted) quizzesAttempted++;
      }
    });
  });
  eligibility.allQuizzesAttempted = totalQuizzes > 0 && quizzesAttempted === totalQuizzes;

  let totalMini = 0, miniDone = 0;
  course.levels.forEach((level) => {
    level.topics.forEach((topic) => {
      if (topic.miniTask?.title) {
        totalMini++;
        const ts = enrollment.taskSubmissions.find(
          (t) => t.taskId.toString() === topic._id.toString() && t.taskType === 'mini' && t.completed
        );
        if (ts) miniDone++;
      }
    });
  });
  eligibility.allMiniTasksCompleted = totalMini > 0 && miniDone === totalMini;

  let totalMajor = 0, majorDone = 0;
  course.levels.forEach((level) => {
    if (level.majorTask?.title) {
      totalMajor++;
      const ts = enrollment.taskSubmissions.find(
        (t) => t.taskId.toString() === level._id.toString() && t.taskType === 'major' && t.completed
      );
      if (ts) majorDone++;
    }
  });
  eligibility.allMajorTasksCompleted = totalMajor > 0 && majorDone === totalMajor;

  if (course.capstoneProject?.title) {
    const cs = enrollment.taskSubmissions.find(
      (t) => t.taskId.toString() === course._id.toString() && t.taskType === 'capstone' && t.completed
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
        message: 'Course not found',
      });
    }

    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
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
            (vp) => vp.topicId.toString() === topic._id.toString()
          );
          if (videoProgress && videoProgress.watchedPercentage >= 100) {
            videosWatched++;
          }
        }
      });
    });
    eligibility.videoCompletion = totalVideos > 0 && videosWatched === totalVideos;

    // Check all quizzes attempted
    let totalQuizzes = 0;
    let quizzesAttempted = 0;
    course.levels.forEach((level) => {
      level.topics.forEach((topic) => {
        if (topic.quiz && topic.quiz.length > 0) {
          totalQuizzes++;
          const quizResult = enrollment.quizResults.find(
            (qr) => qr.topicId.toString() === topic._id.toString()
          );
          if (quizResult && quizResult.attempted) {
            quizzesAttempted++;
          }
        }
      });
    });
    eligibility.allQuizzesAttempted = totalQuizzes > 0 && quizzesAttempted === totalQuizzes;

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
              ts.taskType === 'mini' &&
              ts.completed
          );
          if (taskSubmission) {
            miniTasksCompleted++;
          }
        }
      });
    });
    eligibility.allMiniTasksCompleted = totalMiniTasks > 0 && miniTasksCompleted === totalMiniTasks;

    // Check all major tasks completed
    let totalMajorTasks = 0;
    let majorTasksCompleted = 0;
    course.levels.forEach((level) => {
      if (level.majorTask && level.majorTask.title) {
        totalMajorTasks++;
        const taskSubmission = enrollment.taskSubmissions.find(
          (ts) =>
            ts.taskId.toString() === level._id.toString() &&
            ts.taskType === 'major' &&
            ts.completed
        );
        if (taskSubmission) {
          majorTasksCompleted++;
        }
      }
    });
    eligibility.allMajorTasksCompleted = totalMajorTasks > 0 && majorTasksCompleted === totalMajorTasks;

    // Check capstone project
    if (course.capstoneProject && course.capstoneProject.title) {
      const capstoneSubmission = enrollment.taskSubmissions.find(
        (ts) =>
          ts.taskId.toString() === course._id.toString() &&
          ts.taskType === 'capstone' &&
          ts.completed
      );
      eligibility.capstoneCompleted = !!capstoneSubmission;
    }

    const isEligible = Object.values(eligibility).every((value) => value === true);

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
        message: 'Course not found',
      });
    }

    const enrollment = user.enrolledCourses.find(
      (ec) => ec.course.toString() === req.params.courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Check if already has certificate
    if (enrollment.certificateIssued) {
      const existingCertificate = await Certificate.findOne({
        certificateId: enrollment.certificateId,
      });
      return res.status(200).json({
        success: true,
        message: 'Certificate already issued',
        data: existingCertificate,
      });
    }

    // Verify eligibility using shared helper
    const { isEligible } = checkCourseEligibility(course, enrollment);
    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for a certificate yet. Complete all course requirements.',
      });
    }

    // Create certificate
    const certificate = await Certificate.create({
      student: user._id,
      course: course._id,
      studentName: user.name,
      courseName: course.title,
      courseDuration: '120 Hours',
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
    folder: 'lms/certificates',
    resource_type: 'image',
    format: 'jpg',
  },
      async (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: 'Error uploading certificate',
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
          message: 'Certificate generated successfully',
          data: certificate,
        });
      }
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
    }).populate('student', 'name email').populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
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
        platformName: 'LMS Platform',
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
    }).populate('course', 'title thumbnail');

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

const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function generateCertificatePDF(certificate) {
  const width = 1754;
  const height = 1240;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

// ── 1. BACKGROUND GRADIENT ───────────────────────────────
const bgGrad = ctx.createLinearGradient(0, 0, width, height);
bgGrad.addColorStop(0, '#0a0015');   // deep purple-black
bgGrad.addColorStop(0.5, '#0d001f');
bgGrad.addColorStop(1, '#000d1a');   // deep teal-black
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, width, height);

// ── SCANLINE OVERLAY (cyberpunk CRT effect) ──────────────
for (let y = 0; y < height; y += 4) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, y, width, 2);
}

// ── NEON GRID BACKGROUND ────────────────────────────────
ctx.strokeStyle = 'rgba(0,255,255,0.04)';
ctx.lineWidth = 1;
for (let x = 0; x < width; x += 60) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
}
for (let y = 0; y < height; y += 60) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
}

  // ── 6. DECORATIVE CORNER DIAMONDS ───────────────────────
  const drawDiamond = (cx, cy, size, color) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawDiamond(width / 2, 95, 10, '#ff00ff');      // magenta
drawDiamond(width / 2 - 30, 95, 6, '#00ffff');  // cyan
drawDiamond(width / 2 + 30, 95, 6, '#00ffff');
drawDiamond(width / 2, height - 95, 10, '#ff00ff');
drawDiamond(width / 2 - 30, height - 95, 6, '#00ffff');
drawDiamond(width / 2 + 30, height - 95, 6, '#00ffff');

  // ── 7. DOUBLE NEON BORDER ───────────────────────────────
// Outer magenta glow border
ctx.shadowColor = '#ff00ff';
ctx.shadowBlur = 20;
ctx.strokeStyle = '#ff00ff';
ctx.lineWidth = 3;
ctx.strokeRect(22, 22, width - 44, height - 44);

// Inner cyan border
ctx.shadowColor = '#00ffff';
ctx.shadowBlur = 15;
ctx.strokeStyle = '#00ffff';
ctx.lineWidth = 1.5;
ctx.strokeRect(32, 32, width - 64, height - 64);
ctx.shadowBlur = 0;
ctx.shadowColor = 'transparent';

// ── 8. LOGO (top left, inside border) ───────────────────
try {
  const logoPath = path.join(__dirname, '../assets/logo.jpg');
  const logo = await loadImage(logoPath);
  ctx.save();
  ctx.beginPath();
  ctx.arc(85, 95, 48, 0, Math.PI * 2);  // moved down from y=45 → y=95
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(logo, 37, 47, 96, 96);  // moved down from y=7 → y=47
  ctx.restore();
} catch (err) {
  console.log('Logo load error:', err.message);
}

// Company name next to logo — cyberpunk colors
ctx.fillStyle = '#00ffff';          // cyan
ctx.font = 'bold 26px sans-serif';
ctx.textAlign = 'left';
ctx.fillText('SUCCESSFUL', 148, 82);
ctx.fillStyle = '#ff00ff';          // magenta
ctx.font = 'bold 26px sans-serif';
ctx.fillText('LEARNING', 148, 112);

  // ── 9. QUALITY BADGE ────────────────────────────────────
const bx = width - 150, by = 140, br = 95;

// Glow
const glowGrad = ctx.createRadialGradient(bx, by, br - 20, bx, by, br + 20);
glowGrad.addColorStop(0, 'rgba(255,0,255,0.5)');
glowGrad.addColorStop(1, 'rgba(255,0,255,0)');
ctx.beginPath();
ctx.arc(bx, by, br + 20, 0, Math.PI * 2);
ctx.fillStyle = glowGrad;
ctx.fill();

// Dark circle
ctx.beginPath();
ctx.arc(bx, by, br, 0, Math.PI * 2);
ctx.fillStyle = '#0a0015';
ctx.fill();

// Star burst — cyan
ctx.fillStyle = '#00ffff';
for (let i = 0; i < 20; i++) {
  const angle = (i * Math.PI * 2) / 20;
  const outerR = br - 5;
  const innerR = br - 18;
  ctx.beginPath();
  ctx.moveTo(bx + Math.cos(angle) * outerR, by + Math.sin(angle) * outerR);
  ctx.lineTo(bx + Math.cos(angle + 0.16) * innerR, by + Math.sin(angle + 0.16) * innerR);
  ctx.lineTo(bx + Math.cos(angle + 0.31) * outerR, by + Math.sin(angle + 0.31) * outerR);
  ctx.fill();
}

// Inner magenta ring
ctx.shadowColor = '#ff00ff';
ctx.shadowBlur = 10;
ctx.beginPath();
ctx.arc(bx, by, br - 20, 0, Math.PI * 2);
ctx.strokeStyle = '#ff00ff';
ctx.lineWidth = 2;
ctx.stroke();
ctx.shadowBlur = 0;

// Badge text
ctx.fillStyle = '#00ffff';
ctx.font = 'bold 17px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('ASSURANCE', bx, by - 20);
ctx.font = '13px sans-serif';
ctx.fillText('★ ON QUALITY ★', bx, by + 2);
ctx.font = 'bold 17px sans-serif';
ctx.fillText('EDUCATION', bx, by + 24);
ctx.shadowBlur = 0;

  // ── 10. "Certificate" TITLE ──────────────────────────────
ctx.shadowColor = '#ff00ff';
ctx.shadowBlur = 25;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
ctx.fillStyle = '#ffffff';
ctx.font = 'italic bold 100px Georgia, serif';
ctx.textAlign = 'center';
ctx.fillText('Certificate', width / 2, 165);
// Double render for stronger glow
ctx.fillStyle = 'rgba(255,0,255,0.4)';
ctx.fillText('Certificate', width / 2, 165);
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;

  // ── 11. "OF COMPLETION" ──────────────────────────────────
ctx.shadowColor = '#00ffff';
ctx.shadowBlur = 15;
ctx.fillStyle = '#00ffff';
ctx.font = 'bold 40px Georgia, serif';
ctx.fillText('OF  COMPLETION', width / 2, 230);
ctx.shadowBlur = 0;

// Flanking lines — magenta
const lineY = 215;
ctx.strokeStyle = '#ff00ff';
ctx.lineWidth = 1.5;
[[340, 600], [width - 340, width - 600]].forEach(([outer, inner]) => {
  const dir = outer < inner ? 1 : -1;
  ctx.beginPath(); ctx.moveTo(outer, lineY); ctx.lineTo(inner, lineY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(outer, lineY + 18); ctx.lineTo(inner, lineY + 18); ctx.stroke();
  drawDiamond(outer + dir * 10, lineY + 9, 8, '#ff00ff');
});

  // ── 12. PRESENTED TO label ───────────────────────────────
ctx.fillStyle = '#aaaacc';
ctx.font = '24px Georgia, serif';
ctx.fillText('THIS CERTIFICATE IS PROUDLY PRESENTED TO:', width / 2, 310);

  // ── 13. STUDENT NAME ────────────────────────────────────
ctx.shadowColor = '#ff00ff';
ctx.shadowBlur = 30;
ctx.fillStyle = '#ffffff';
ctx.font = 'italic bold 82px Georgia, serif';
ctx.fillText(certificate.studentName, width / 2, 420);
ctx.shadowBlur = 0;

// Decorative underline — cyan + magenta double line
const nw = ctx.measureText(certificate.studentName).width;
const nx = width / 2;
ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10;
ctx.strokeStyle = '#00ffff';
ctx.lineWidth = 2.5;
ctx.beginPath(); ctx.moveTo(nx - nw / 2, 438); ctx.lineTo(nx + nw / 2, 438); ctx.stroke();
ctx.strokeStyle = '#ff00ff';
ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(nx - nw / 2, 443); ctx.lineTo(nx + nw / 2, 443); ctx.stroke();
ctx.shadowBlur = 0;
drawDiamond(nx - nw / 2 - 12, 440, 7, '#ff00ff');
drawDiamond(nx + nw / 2 + 12, 440, 7, '#ff00ff');

  // ── 14. COURSE LABEL & NAME ──────────────────────────────
ctx.fillStyle = '#8888aa';
ctx.font = '26px Georgia, serif';
ctx.fillText('For successfully completing the course in', width / 2, 510);

// Course name — electric yellow-green gradient
const courseGrad = ctx.createLinearGradient(0, 560, 0, 635);
courseGrad.addColorStop(0, '#ccff00');   // electric lime
courseGrad.addColorStop(1, '#00ffcc');   // neon teal
ctx.shadowColor = '#ccff00';
ctx.shadowBlur = 20;
ctx.fillStyle = courseGrad;
ctx.font = 'bold 58px Georgia, serif';
ctx.fillText(certificate.courseName.toUpperCase(), width / 2, 620);
ctx.shadowBlur = 0;


  // ── 15. DURATION ─────────────────────────────────────────
ctx.fillStyle = '#6688aa';
ctx.font = '25px sans-serif';
ctx.fillText(`Duration: ${certificate.courseDuration}   •   Mode: Online`, width / 2, 690);

  // ── 16. DIVIDER ──────────────────────────────────────────
ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 8;
ctx.strokeStyle = '#ff00ff';
ctx.lineWidth = 1.5;
ctx.beginPath(); ctx.moveTo(300, 725); ctx.lineTo(width - 300, 725); ctx.stroke();
ctx.strokeStyle = '#00ffff';
ctx.lineWidth = 0.7;
ctx.beginPath(); ctx.moveTo(300, 730); ctx.lineTo(width - 300, 730); ctx.stroke();
ctx.shadowBlur = 0;
drawDiamond(width / 2, 727, 10, '#ff00ff');

  // ── 17. FOOTER TEXT ──────────────────────────────────────
ctx.fillStyle = '#7777aa';
ctx.font = 'italic 23px Georgia, serif';
ctx.fillText('This is a computer-generated certificate & no signature is required.', width / 2, 785);

ctx.fillStyle = '#556688';
ctx.font = '21px sans-serif';
ctx.fillText(`Credential ID: ${certificate.certificateId}`, width / 2, 830);

  // ── 18. BOTTOM BRANDING ──────────────────────────────────
ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
ctx.fillStyle = '#00ffff';
ctx.font = 'bold 24px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('SUCCESSFUL LEARNING', width / 2, height - 52);
ctx.shadowBlur = 0;
ctx.fillStyle = 'rgba(255,0,255,0.5)';
ctx.font = '18px sans-serif';
ctx.fillText('www.successfullearning.com', width / 2, height - 28);

// ── 19. DATE BLOCK ───────────────────────────────────────
const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});

ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10;
ctx.fillStyle = '#00ffff';
ctx.font = 'bold 30px Georgia, serif';
ctx.textAlign = 'right';
ctx.fillText(issueDate, width - 185, 1050);
ctx.shadowBlur = 0;
ctx.strokeStyle = '#ff00ff';
ctx.lineWidth = 1.5;
ctx.beginPath(); ctx.moveTo(width - 390, 1063); ctx.lineTo(width - 165, 1063); ctx.stroke();
ctx.fillStyle = '#7788aa';
ctx.font = '20px sans-serif';
ctx.fillText('Course Completed Date', width - 185, 1088);

// ── 20. QR CODE ──────────────────────────────────────────
if (certificate.qrCode) {
  try {
    const qrImage = await loadImage(certificate.qrCode);
    ctx.fillStyle = '#0a0015';
    ctx.fillRect(185, 960, 170, 170);
    ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(185, 960, 170, 170);
    ctx.shadowBlur = 0;
    ctx.drawImage(qrImage, 190, 965, 160, 160);
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Verify', 270, 1155);
  } catch (err) {
    console.log('QR error:', err);
  }
}

  return canvas.toBuffer('image/jpeg', { quality: 0.97 });
}