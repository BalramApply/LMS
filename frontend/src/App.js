import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './redux/slices/authSlice';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loader from './components/common/Loader';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ExploreCourses from './pages/student/ExploreCourses';
import CourseDetails from './pages/student/CourseDetails';
import VerifyCertificate from './pages/public/VerifyCertificate';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import LearningView from './pages/student/LearningView';
import MyProfile from './pages/student/MyProfile';
import MyCertificates from './pages/student/MyCertificates';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import CourseForm from './pages/admin/CourseForm';
import CourseContent from './pages/admin/CourseContent';
import ManageStudents from './pages/admin/ManageStudents';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import CommentModeration from './pages/admin/CommentModeration';
import BannerManager from './pages/admin/BannerManager';

// mock test
import MockTests       from './pages/student/MockTests';
import TakeTest        from './pages/student/TakeTest';
import MockTestResult  from './pages/student/MockTestResult';
import ManageMockTests from './pages/admin/ManageMockTests';

// 404 Page
import NotFound from './pages/public/NotFound';

function App() {
  const dispatch = useDispatch();
  const { isLoading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch]);


  if (isLoading && !user) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
       <main className="flex-grow">
        <Routes>
        
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<ExploreCourses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/verify-certificate" element={<VerifyCertificate />} />
          <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
        
          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute role="student">
                <MockTests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mock-tests/:testId/take"
            element={
              <ProtectedRoute role="student">
                <TakeTest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mock-tests/result/:attemptId"
            element={
              <ProtectedRoute role="student">
                <MockTestResult />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/learning/:courseId"
            element={
              <ProtectedRoute role="student">
                <LearningView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="student">
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-certificates"
            element={
              <ProtectedRoute role="student">
                <MyCertificates />
              </ProtectedRoute>
            }
          />

         
          <Route
            path="/admin/mock-tests"
            element={
              <ProtectedRoute role="admin">
                <ManageMockTests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute role="admin">
                <ManageCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/new"
            element={
              <ProtectedRoute role="admin">
                <CourseForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/edit/:id"
            element={
              <ProtectedRoute role="admin">
                <CourseForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/content"
            element={
              <ProtectedRoute role="admin">
                <CourseContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute role="admin">
                <ManageStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute role="admin">
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/comments"
            element={
              <ProtectedRoute role="admin">
                <CommentModeration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/banners"
            element={
              <ProtectedRoute role="admin">
                <BannerManager />
              </ProtectedRoute>
            }
          />

       
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main> 
      <Footer />
    </div>
  );
}

export default App;