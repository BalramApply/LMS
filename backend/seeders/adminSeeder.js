require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@lms.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('\n⚠️  Please change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();