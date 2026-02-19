#!/bin/bash

echo "🚀 LMS System - Quick Start Script"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed ($(node -v))"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB."
    echo "   Visit: https://www.mongodb.com/try/download/community"
    exit 1
fi

echo "✅ MongoDB is installed"

# Navigate to backend directory
cd backend

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "📋 Checking .env file..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit the .env file with your credentials before continuing."
    echo "   Required: MongoDB URI, Cloudinary credentials, Razorpay keys"
    exit 1
else
    echo "✅ .env file found"
fi

echo ""
echo "🗄️  Starting MongoDB..."
# Start MongoDB in background (adjust command based on your OS)
mongod --fork --logpath /tmp/mongodb.log

echo ""
echo "👤 Seeding admin account..."
npm run seed:admin

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  cd backend && npm run dev"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@lms.com"
echo "  Password: Admin@123456"
echo ""
echo "Server will run on: http://localhost:5000"
echo "API Documentation: See README.md"