import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiBook,
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
  FiMessageSquare,
  FiUserCheck,
  FiImage,
} from "react-icons/fi";
import api from "../../api/client";
import Loader from "../../components/common/Loader";
import { formatCurrency } from "../../utils/formatters";
import styles from "./styles/AdminDashboard.module.css";

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [studentsRes, coursesRes, commentsRes] = await Promise.all([
        api.get("/admin/students"),
        api.get("/courses"),
        api.get("/admin/comments"),
      ]);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data || []);
      }

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data || []);
      }

      if (commentsRes.data.success) {
        setComments(commentsRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  // Calculate stats from actual data
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.isActive).length;
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.isPublished).length;

  // Calculate enrollments
  const totalEnrollments = students.reduce((sum, student) => {
    return sum + (student.enrolledCourses?.length || 0);
  }, 0);

  const recentEnrollments = totalEnrollments; // Same as total for now

  // Calculate revenue
  const totalRevenue = courses.reduce((sum, course) => {
    return sum + (course.totalRevenue || 0);
  }, 0);

  const stats = [
    {
      icon: FiUsers,
      label: "Total Students",
      value: totalStudents,
      iconClass: styles.iconBlue,
      link: "/admin/students",
    },
    {
      icon: FiUserCheck,
      label: "Active Students",
      value: activeStudents,
      iconClass: styles.iconGreen,
      link: "/admin/students",
    },
    {
      icon: FiBook,
      label: "Total Courses",
      value: totalCourses,
      iconClass: styles.iconPurple,
      link: "/admin/courses",
    },
    {
      icon: FiCheckCircle,
      label: "Published Courses",
      value: publishedCourses,
      iconClass: styles.iconEmerald,
      link: "/admin/courses",
    },
    {
      icon: FiTrendingUp,
      label: "Total Enrollments",
      value: totalEnrollments,
      iconClass: styles.iconIndigo,
    },
    {
      icon: FiTrendingUp,
      label: "Recent Enrollments",
      value: recentEnrollments,
      iconClass: styles.iconCyan,
    },
    {
      icon: FiDollarSign,
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      iconClass: styles.iconYellow,
    },
  ];

  const quickActions = [
    {
      title: "Manage Students",
      description: `${totalStudents} total students (${activeStudents} active)`,
      icon: FiUsers,
      iconClass: styles.iconBlue,
      link: "/admin/students",
    },
    {
      title: "Manage Courses",
      description: `${totalCourses} total courses (${publishedCourses} published)`,
      icon: FiBook,
      iconClass: styles.iconPurple,
      link: "/admin/courses",
    },
    {
      title: "Comment Moderation",
      description: `${comments.length} total comments`,
      icon: FiMessageSquare,
      iconClass: styles.iconOrange,
      link: "/admin/comments",
    },
    {
      title: "Analytics Dashboard",
      description: "View detailed analytics and reports",
      icon: FiTrendingUp,
      iconClass: styles.iconGreen,
      link: "/admin/analytics",
    },
    // ↓ ADD THIS
    {
      title: "Banner Manager",
      description: "Manage hero & promotional banners",
      icon: FiImage,
      iconClass: styles.iconIndigo,
      link: "/admin/banners",
    },
    {
      title: "User Activity",
      description: "see all & user activity live",
      icon: FiImage,
      iconClass: styles.iconIndigo,
      link: "/admin/active-students",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome back! Here's an overview of your platform.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={stat.link || "#"}
                className={`${styles.statCard} ${
                  !stat.link ? styles.statCardDisabled : ""
                }`}
              >
                <div className={styles.statContent}>
                  <div className={`${styles.statIcon} ${stat.iconClass}`}>
                    <stat.icon className={styles.statIconSvg} />
                  </div>
                  <div className={styles.statInfo}>
                    <p className={styles.statLabel}>{stat.label}</p>
                    <p className={styles.statValue}>{stat.value}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={styles.quickActionsSection}
        >
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Link to={action.link} className={styles.actionCard}>
                  <div className={styles.actionContent}>
                    <div className={`${styles.actionIcon} ${action.iconClass}`}>
                      <action.icon className={styles.actionIconSvg} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h3 className={styles.actionTitle}>{action.title}</h3>
                      <p className={styles.actionDescription}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className={styles.systemStatus}
        >
          <div className={styles.systemStatusContent}>
            <div className={styles.systemStatusIcon}>
              <FiCheckCircle className={styles.systemStatusIconSvg} />
            </div>
            <div className={styles.systemStatusInfo}>
              <p className={styles.systemStatusTitle}>System Operational</p>
              <p className={styles.systemStatusText}>
                All services are running smoothly. Last updated:{" "}
                {new Date().toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
