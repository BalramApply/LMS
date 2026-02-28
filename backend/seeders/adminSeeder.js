require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const connectDB = require('../config/db');

// ── Configure Cloudinary ───────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Upload avatar helper ───────────────────────────────────────────────────────
const uploadAdminAvatar = async () => {
  const imagePath = path.join(__dirname, '../assets/adminProfile.png');

  if (!fs.existsSync(imagePath)) {
    console.warn('⚠️  adminProfile.png not found at', imagePath);
    console.warn('    Admin will be created without an avatar.');
    return null;
  }

  console.log('📤 Uploading admin avatar to Cloudinary...');

  const result = await cloudinary.uploader.upload(imagePath, {
    folder: 'lms/avatars',
    public_id: 'admin_avatar',
    overwrite: true,
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  });

  console.log('🖼️  Avatar uploaded:', result.secure_url);
  return { public_id: result.public_id, url: result.secure_url };
};

// ── Main seeder ────────────────────────────────────────────────────────────────
const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log(`   Email : ${existingAdmin.email}`);
      console.log(`   Avatar: ${existingAdmin.avatar?.url || 'none'}`);

      // Offer to update avatar even if admin exists
      const avatar = await uploadAdminAvatar();
      if (avatar) {
        existingAdmin.avatar = avatar;
        await existingAdmin.save();
        console.log('✅ Avatar updated on existing admin.');
      }

      process.exit(0);
    }

    // Upload avatar (non-blocking — admin is created even if upload fails)
    let avatar = null;
    try {
      avatar = await uploadAdminAvatar();
    } catch (uploadErr) {
      console.warn('⚠️  Avatar upload failed:', uploadErr.message);
      console.warn('    Continuing without avatar...');
    }

    // Build admin payload
    const adminData = {
      name:     process.env.ADMIN_NAME     || 'Admin',
      email:    process.env.ADMIN_EMAIL    || 'admin@lms.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role:     'admin',
    };

    if (avatar) adminData.avatar = avatar;

    const admin = await User.create(adminData);

    console.log('\n✅ Admin created successfully!');
    console.log('   Name   :', admin.name);
    console.log('   Email  :', admin.email);
    console.log('   Role   :', admin.role);
    console.log('   Avatar :', admin.avatar?.url || 'none');
    console.log('   🔑 Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('\n⚠️  Please change the default password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();