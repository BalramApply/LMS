const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [250, "Subtitle cannot exceed 250 characters"],
    },
    buttonText: {
      type: String,
      trim: true,
      default: "Learn More",
    },
    buttonUrl: {
      type: String,
      trim: true,
      default: "/courses",
    },
    image: {
      url: { type: String, required: [true, "Image is required"] },
      publicId: { type: String }, // Cloudinary public_id for deletion
    },
    type: {
      type: String,
      enum: ["hero", "offer", "announcement", "festival"],
      default: "hero",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast sorted active queries
bannerSchema.index({ isActive: 1, displayOrder: 1, isDeleted: 1 });

module.exports = mongoose.model("Banner", bannerSchema);