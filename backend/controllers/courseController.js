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

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, courseType, search, sort } = req.query;

    let query = { isPublished: true };

    // Filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (courseType) query.courseType = courseType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { enrolledStudents: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };

    const courses = await Course.find(query).sort(sortOption);

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

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: "levels.topics.comments.student",
        select: "name email avatar",
      })
      .populate({
        path: "levels.topics.comments.replies.admin",
        select: "name",
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

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


// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    let courseData = { ...req.body };

    // Parse JSON fields if they're strings
    if (typeof courseData.roadmap === 'string') {
      courseData.roadmap = JSON.parse(courseData.roadmap);
    }

    // Upload thumbnail
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'lms/course-thumbnails',
        'image'
      );
      
      courseData.thumbnail = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const course = await Course.create(courseData);

    res.status(201).json({
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

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    let updateData = { ...req.body };

    // Parse JSON fields if they're strings
    if (typeof updateData.roadmap === 'string') {
      updateData.roadmap = JSON.parse(updateData.roadmap);
    }

    // Upload new thumbnail if provided
    if (req.file) {
      // Delete old thumbnail
      if (course.thumbnail && course.thumbnail.public_id) {
        await cloudinary.uploader.destroy(course.thumbnail.public_id);
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        'lms/course-thumbnails',
        'image'
      );

      updateData.thumbnail = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
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

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Delete thumbnail from cloudinary
    if (course.thumbnail && course.thumbnail.public_id) {
      await cloudinary.uploader.destroy(course.thumbnail.public_id);
    }

    // Delete all videos and reading materials
    for (const level of course.levels) {
      for (const topic of level.topics) {
        if (topic.video && topic.video.public_id) {
          await cloudinary.uploader.destroy(topic.video.public_id, {
            resource_type: 'video',
          });
        }
        if (topic.readingMaterial && topic.readingMaterial.public_id) {
          await cloudinary.uploader.destroy(topic.readingMaterial.public_id);
        }
      }
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add level to course
// @route   POST /api/courses/:id/levels
// @access  Private/Admin
exports.addLevel = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const { levelNumber, levelTitle, levelDescription, majorTask } = req.body;

    course.levels.push({
      levelNumber,
      levelTitle,
      levelDescription,
      topics: [],
      majorTask: majorTask || {},
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

// @desc    Update level
// @route   PUT /api/courses/:courseId/levels/:levelId
// @access  Private/Admin
exports.updateLevel = async (req, res) => {
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

    Object.assign(level, req.body);
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

// @desc    Delete level
// @route   DELETE /api/courses/:courseId/levels/:levelId
// @access  Private/Admin
exports.deleteLevel = async (req, res) => {
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

    // Delete associated media files
    for (const topic of level.topics) {
      if (topic.video && topic.video.public_id) {
        await cloudinary.uploader.destroy(topic.video.public_id, {
          resource_type: 'video',
        });
      }
      if (topic.readingMaterial && topic.readingMaterial.public_id) {
        await cloudinary.uploader.destroy(topic.readingMaterial.public_id);
      }
    }

    level.deleteOne();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Level deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle course publish status
// @route   PATCH /api/courses/:id/publish
// @access  Private/Admin
exports.togglePublishStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.isPublished = !course.isPublished;
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