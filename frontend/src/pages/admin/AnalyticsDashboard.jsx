import React, { useEffect, useState, useCallback  } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { FiUsers, FiDollarSign, FiTrendingUp, FiBook } from 'react-icons/fi';
import api from '../../api/client';
import Loader from '../../components/common/Loader';
import styles from './styles/AnalyticsDashboard.module.css';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [revenueMonthly, setRevenueMonthly] = useState([]);
  const [revenueDaily, setRevenueDaily] = useState([]);
  const [bestCourses, setBestCourses] = useState([]);
  const [completionStats, setCompletionStats] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [period, setPeriod] = useState(30);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [quizScores, setQuizScores] = useState([]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseAnalytics(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchAllAnalytics = useCallback(async () => {
  try {
    setLoading(true);

    const [
      enrollRes,
      revenueMonthRes,
      revenueDayRes,
      bestRes,
      completionRes,
      activeRes
    ] = await Promise.all([
      api.get(`/analytics/enrollments-over-time?period=${period}`),
      api.get(`/analytics/revenue?period=month`),
      api.get(`/analytics/revenue?period=day`),
      api.get(`/analytics/best-selling-courses`),
      api.get(`/analytics/course-completion`),
      api.get(`/analytics/active-students`)
    ]);

    setEnrollments(enrollRes.data.data);
    setRevenueMonthly(revenueMonthRes.data.data);
    setRevenueDaily(revenueDayRes.data.data);
    setBestCourses(bestRes.data.data);
    setCompletionStats(completionRes.data.data);
    setActiveStudents(activeRes.data.data);

    if (completionRes.data.data.length > 0) {
      setSelectedCourse(completionRes.data.data[0].courseId);
    }

  } catch (error) {
    console.error("Analytics fetch failed", error);
  } finally {
    setLoading(false);
  }
}, [period]);   // 👈 IMPORTANT

useEffect(() => {
  fetchAllAnalytics();
}, [fetchAllAnalytics]);

  const fetchCourseAnalytics = async (courseId) => {
    try {
      const [performanceRes, quizRes] = await Promise.all([
        api.get(`/analytics/student-performance/${courseId}`),
        api.get(`/analytics/quiz-scores/${courseId}`)
      ]);

      setStudentPerformance(performanceRes.data.data);
      setQuizScores(quizRes.data.data);
    } catch (error) {
      console.error("Course analytics error", error);
    }
  };

  if (loading) return <Loader fullScreen />;

  const totalRevenue = revenueMonthly.reduce((sum, item) => sum + item.revenue, 0);
  const totalEnrollments = enrollments.reduce((sum, item) => sum + item.enrollments, 0);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Analytics Dashboard</h1>
            <p className={styles.subtitle}>Platform performance overview</p>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={styles.periodSelect}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <StatCard icon={FiDollarSign} label="Total Revenue" value={`₹${totalRevenue}`} />
          <StatCard icon={FiTrendingUp} label="Total Enrollments" value={totalEnrollments} />
          <StatCard icon={FiBook} label="Courses" value={bestCourses.length} />
          <StatCard icon={FiUsers} label="Active Students" value={activeStudents.length} />
        </div>

        {/* Enrollment Trend */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Enrollments (Last {period} Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollments}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f3a',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#e0e7ff'
                }}
              />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#00f0ff"
                strokeWidth={3}
                dot={{ fill: '#00f0ff', r: 4 }}
                activeDot={{ r: 6, fill: '#00f0ff', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Charts */}
        <div className={styles.revenueSection}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f3a',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#e0e7ff'
                  }}
                />
                <Bar dataKey="revenue" fill="#00ff88" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Daily Revenue</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f3a',
                    border: '1px solid rgba(255, 189, 0, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#e0e7ff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffbd00"
                  strokeWidth={3}
                  dot={{ fill: '#ffbd00', r: 4 }}
                  activeDot={{ r: 6, fill: '#ffbd00', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Selling Courses */}
        <div className={styles.listCard}>
          <h2 className={styles.cardTitle}>Best Selling Courses</h2>
          <div className={styles.coursesList}>
            {bestCourses.map((course, index) => (
              <div key={course._id} className={styles.courseItem}>
                <div className={styles.courseInfo}>
                  <img
                    src={course.thumbnail?.url}
                    alt={course.title}
                    className={styles.courseThumbnail}
                  />
                  <div>
                    <p className={styles.courseTitle}>{course.title}</p>
                    <p className={styles.courseStats}>
                      {course.enrolledStudents} students
                    </p>
                  </div>
                </div>
                <p className={styles.courseRevenue}>₹{course.totalRevenue}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course Completion */}
        <div className={styles.listCard}>
          <h2 className={styles.cardTitle}>Course Completion Stats</h2>
          <div className={styles.completionList}>
            {completionStats.map((course) => (
              <div key={course.courseId} className={styles.completionItem}>
                <p className={styles.completionCourse}>{course.courseName}</p>
                <div className={styles.completionStats}>
                  <span className={styles.completionText}>
                    {course.completed}/{course.totalEnrolled} completed
                  </span>
                  <span className={styles.completionRate}>
                    {course.completionRate}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${course.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Students */}
        <div className={styles.listCard}>
          <h2 className={styles.cardTitle}>Most Active Students</h2>
          <div className={styles.studentsList}>
            {activeStudents.slice(0, 5).map((student) => (
              <div key={student.studentId} className={styles.studentItem}>
                <img
                  src={student.avatar?.url || 'https://via.placeholder.com/40'}
                  alt={student.name}
                  className={styles.studentAvatar}
                />
                <div>
                  <p className={styles.studentName}>{student.name}</p>
                  <p className={styles.studentStats}>
                    {student.coursesEnrolled} courses • {student.avgProgress}% progress
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Performance Section */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.cardTitle}>Student Performance</h2>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className={styles.courseSelect}
            >
              {completionStats.map(course => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.thLeft}>Student</th>
                  <th className={styles.th}>Progress</th>
                  <th className={styles.th}>Levels</th>
                  <th className={styles.th}>Topics</th>
                  <th className={styles.th}>Quiz Avg</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {studentPerformance.map(student => (
                  <tr key={student.studentId} className={styles.tableRow}>
                    <td className={styles.tdLeft}>{student.studentName}</td>
                    <td className={styles.td}>{student.progress}%</td>
                    <td className={styles.td}>{student.completedLevels}</td>
                    <td className={styles.td}>{student.completedTopics}</td>
                    <td className={styles.td}>
                      <span className={styles.quizScore}>{student.avgQuizScore}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quiz Score Chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Average Quiz Scores (By Topic)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quizScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
              <XAxis dataKey="topicTitle" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f3a',
                  border: '1px solid rgba(255, 0, 255, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#e0e7ff'
                }}
              />
              <Bar dataKey="avgScore" fill="#ff00ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={styles.statCard}
  >
    <div className={styles.statContent}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
    <Icon className={styles.statIcon} />
  </motion.div>
);

export default AnalyticsDashboard;