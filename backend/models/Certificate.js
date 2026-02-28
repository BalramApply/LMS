const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    courseDuration: {
      type: String,
      required: true,
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Valid', 'Revoked'],
      default: 'Valid',
    },
    certificatePDF: {
      public_id: String,
      url: String,
    },
    qrCode: {
      type: String, // Base64 encoded QR code
    },
  },
  {
    timestamps: true,
  }
);

// ✅ After — async, no next needed
certificateSchema.pre('validate', async function () {
  if (!this.certificateId) {
    const year = new Date().getFullYear();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.certificateId = `SL-${year}-${randomString}`;
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);