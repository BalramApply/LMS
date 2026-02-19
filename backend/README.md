# LMS Backend - Learning Management System

Complete backend API for a feature-rich Learning Management System built with MERN stack and Razorpay integration.

## 🚀 Features

### Admin Features
- ✅ Admin seed system for initial setup
- 📊 Comprehensive analytics dashboard
- 👥 Student management (view, activate/deactivate, delete)
- 📚 Complete course CRUD operations
- 🎯 Course content management (Levels, Topics, Videos, Quizzes, Tasks)
- 💬 Comment moderation and replies
- 📈 Revenue tracking and reports
- 📜 Certificate management

### Student Features
- 🔐 Secure registration and authentication with strong password validation
- 🎓 Browse and explore all courses
- 💳 Razorpay payment integration for paid courses
- 📖 Course enrollment (free and paid)
- ▶️ Video progress tracking with resume functionality
- 📝 Interactive quizzes with instant feedback
- ✍️ Task submissions (code/link)
- 💬 Comment on topics
- 📊 Personal progress tracking (0-100%)
- 🏆 Certificate generation upon course completion
- ✔️ Certificate verification system

### Course Structure
```
Course
 ├── Level 1
 │    ├── Topic 0.1
 │    │    ├── Video Lesson
 │    │    ├── Reading Material (PDF)
 │    │    ├── Practice Quiz
 │    │    ├── Mini Task
 │    │    └── Comments
 │    ├── Topic 0.2
 │    ├── ...
 │    └── Major Task (Level completion)
 ├── Level 2
 ├── ...
 └── Capstone Project
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary (videos, images, PDFs)
- **Payment**: Razorpay
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **Security**: bcryptjs, cookie-parser

## 📦 Installation

1. **Clone the repository**
```bash
cd lms-system/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/lms_system

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Admin Credentials
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@lms.com
ADMIN_PASSWORD=Admin@123456
```

4. **Setup Database**

Make sure MongoDB is running on your system:
```bash
mongod
```

5. **Seed Admin Account**
```bash
npm run seed:admin
```

This will create an admin account with credentials from your `.env` file.

6. **Start Development Server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /register           - Register new student
POST   /login             - Login (admin/student)
GET    /me                - Get current user
GET    /logout            - Logout user
PUT    /updateprofile     - Update user profile
PUT    /updatepassword    - Update password
```

### Course Routes (`/api/courses`)
```
GET    /                  - Get all published courses
GET    /:id               - Get single course
POST   /                  - Create course (Admin)
PUT    /:id               - Update course (Admin)
DELETE /:id               - Delete course (Admin)
PATCH  /:id/publish       - Toggle publish status (Admin)

# Level Management
POST   /:id/levels                        - Add level
PUT    /:courseId/levels/:levelId         - Update level
DELETE /:courseId/levels/:levelId         - Delete level
```

### Topic Routes (`/api/topics`)
```
POST   /:courseId/levels/:levelId/topics                          - Add topic
PUT    /:courseId/levels/:levelId/topics/:topicId                 - Update topic
DELETE /:courseId/levels/:levelId/topics/:topicId                 - Delete topic

# Comments
POST   /:courseId/levels/:levelId/topics/:topicId/comments                  - Add comment (Student)
POST   /:courseId/levels/:levelId/topics/:topicId/comments/:commentId/reply - Reply to comment (Admin)
DELETE /:courseId/levels/:levelId/topics/:topicId/comments/:commentId       - Delete comment (Admin)
```

### Enrollment Routes (`/api/enrollment`)
```
POST   /free/:courseId            - Enroll in free course
POST   /create-order/:courseId    - Create Razorpay order
POST   /verify-payment            - Verify payment and enroll
GET    /my-courses                - Get enrolled courses
GET    /course/:courseId          - Get course enrollment details
```

### Progress Routes (`/api/progress`)
```
POST   /video              - Update video progress
POST   /quiz               - Submit quiz
POST   /task               - Submit task
POST   /complete-topic     - Mark topic complete
POST   /complete-level     - Complete level
GET    /:courseId          - Get progress for course
```

### Analytics Routes (`/api/analytics`) - Admin Only
```
GET    /dashboard                        - Dashboard statistics
GET    /enrollments-over-time            - Enrollment trends
GET    /revenue                          - Revenue analytics
GET    /best-selling-courses             - Top courses by revenue
GET    /course-completion                - Course completion stats
GET    /active-students                  - Most active students
GET    /student-performance/:courseId    - Student performance heatmap
GET    /quiz-scores/:courseId            - Average quiz scores
```

### Certificate Routes (`/api/certificates`)
```
GET    /check-eligibility/:courseId  - Check certificate eligibility
POST   /generate/:courseId           - Generate certificate
GET    /my-certificates              - Get student certificates
GET    /verify/:certificateId        - Verify certificate (Public)
```

### Admin Routes (`/api/admin`)
```
GET    /students              - Get all students
GET    /students/:id          - Get student details
PATCH  /students/:id/toggle-status  - Activate/Deactivate student
DELETE /students/:id          - Delete student
GET    /courses               - Get all courses (admin view)
GET    /comments              - Get all comments
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in requests:

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

**Or Cookie:**
```
token=<your_jwt_token>
```

## 📝 Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## 💳 Razorpay Integration

### Setup
1. Create a Razorpay account
2. Get your API keys from dashboard
3. Add keys to `.env` file

### Payment Flow
1. Student clicks "Buy Course"
2. Frontend calls `/api/enrollment/create-order/:courseId`
3. Backend creates Razorpay order
4. Frontend shows Razorpay checkout
5. After payment, frontend calls `/api/enrollment/verify-payment`
6. Backend verifies signature and enrolls student

## 📜 Certificate System

### Eligibility Criteria
Students can download certificates only after:
- ✅ 100% video completion
- ✅ All quizzes attempted
- ✅ All mini tasks completed
- ✅ All major tasks completed
- ✅ Capstone project completed (if applicable)

### Certificate Features
- Unique Certificate ID
- QR Code for verification
- PDF generation
- Public verification endpoint
- Revocation support

## 🗂️ File Upload Structure

### Cloudinary Folders
```
lms/
├── avatars/              - User profile pictures
├── course-thumbnails/    - Course thumbnails
├── course-videos/        - Video lessons
├── reading-materials/    - PDF documents
└── certificates/         - Generated certificates
```

## 📊 Progress Tracking

Progress is automatically calculated based on:
- Video watch percentage (>90% = completed)
- Quiz attempts
- Task submissions
- Reading material access

Formula:
```
Progress = (Completed Items / Total Items) × 100
```

## 🎯 Smart Features

### Auto Level Unlock
- Levels unlock automatically after completing previous level
- All topics must be completed
- Major task must be submitted

### Resume Watching
- Video progress saved with timestamp
- Students resume from where they left off

### Quiz System
- Multiple question types: MCQ, True/False, Code-Output
- Instant feedback
- Best score tracking
- Explanations provided

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- XSS protection
- CORS configuration

## 🛠️ Development Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Seed admin account
npm run seed:admin
```

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── razorpay.js
├── controllers/
│   ├── adminController.js
│   ├── analyticsController.js
│   ├── authController.js
│   ├── certificateController.js
│   ├── courseController.js
│   ├── enrollmentController.js
│   ├── progressController.js
│   └── topicController.js
├── middleware/
│   ├── auth.js
│   ├── error.js
│   └── upload.js
├── models/
│   ├── Certificate.js
│   ├── Course.js
│   ├── Payment.js
│   └── User.js
├── routes/
│   ├── adminRoutes.js
│   ├── analyticsRoutes.js
│   ├── authRoutes.js
│   ├── certificateRoutes.js
│   ├── courseRoutes.js
│   ├── enrollmentRoutes.js
│   ├── progressRoutes.js
│   └── topicRoutes.js
├── seeders/
│   └── adminSeeder.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## 🚨 Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 📞 Support

For issues or questions, please check the documentation or create an issue in the repository.

## 📄 License

ISC

---

Built with ❤️ using MERN Stack