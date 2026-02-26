const Banner = require("../models/Banner");
const cloudinary = require("../config/cloudinary"); // ← your existing config

// Helper: upload buffer → Cloudinary (since you use memoryStorage)
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lms/banners",
        resource_type: "image",
        transformation: [
          { width: 1280, height: 640, crop: "fill", quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────

/**
 * GET /api/banners/active?type=hero
 * Active banners for the homepage slider
 */
exports.getActiveBanners = async (req, res) => {
  try {
    const filter = { isActive: true, isDeleted: false };
    if (req.query.type) filter.type = req.query.type; // only filter if type is passed
     const banners = await Banner.find(filter)
      .sort({ displayOrder: 1 })
      .select("-isDeleted -__v");

    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/banners/:id/view  — increment view count
 */
exports.trackView = async (req, res) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/banners/:id/click  — increment click count
 */
exports.trackClick = async (req, res) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

/**
 * GET /api/admin/banners  — all banners for admin table
 */
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isDeleted: false })
      .sort({ displayOrder: 1 })
      .select("-__v");

    res.status(200).json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/banners  — create banner
 */
exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonUrl, type, isActive, displayOrder } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    // Upload buffer → Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    const banner = await Banner.create({
      title,
      subtitle,
      buttonText,
      buttonUrl,
      type,
      isActive: isActive === "true" || isActive === true,
      displayOrder: Number(displayOrder) || 0,
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });

    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/admin/banners/:id  — update banner (optionally replace image)
 */
exports.updateBanner = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonUrl, type, isActive, displayOrder } = req.body;

    const banner = await Banner.findOne({ _id: req.params.id, isDeleted: false });
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // Replace image if a new file was uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (banner.image?.publicId) {
        await cloudinary.uploader.destroy(banner.image.publicId);
      }

      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      banner.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    if (title        !== undefined) banner.title        = title;
    if (subtitle     !== undefined) banner.subtitle     = subtitle;
    if (buttonText   !== undefined) banner.buttonText   = buttonText;
    if (buttonUrl    !== undefined) banner.buttonUrl    = buttonUrl;
    if (type         !== undefined) banner.type         = type;
    if (isActive     !== undefined) banner.isActive     = isActive === "true" || isActive === true;
    if (displayOrder !== undefined) banner.displayOrder = Number(displayOrder);

    await banner.save();
    res.status(200).json({ success: true, data: banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/admin/banners/:id  — soft delete
 */
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/admin/banners/:id/hard  — hard delete + remove from Cloudinary
 */
exports.hardDeleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    if (banner.image?.publicId) {
      await cloudinary.uploader.destroy(banner.image.publicId);
    }
    await banner.deleteOne();

    res.status(200).json({ success: true, message: "Banner permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/admin/banners/:id/toggle  — toggle isActive
 */
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findOne({ _id: req.params.id, isDeleted: false });
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({ success: true, data: banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};