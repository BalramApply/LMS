import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FiBook,
  FiAward,
  FiTrendingUp,
  FiClock,
  FiPlay,
  FiCheckCircle,
} from "react-icons/fi";
import { getEnrolledCourses } from "../../redux/slices/courseSlice";
import { SkeletonCard } from "../../components/common/Loader";
import { formatDate } from "../../utils/formatters";
import styles from "./styles/StudentDashboard.module.css";
import MockTestPerformance from "./components/MockTestPerformance";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { enrolledCourses, isLoading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getEnrolledCourses());
  }, [dispatch]);

  const totalCourses = enrolledCourses?.length || 0; // total enrolled (all)
  const visibleCourses =
    enrolledCourses?.filter((e) => e.course?.isPublished) || [];
  const completedCourses = visibleCourses.filter(
    (e) => e.progress === 100,
  ).length;
  const inProgressCourses = visibleCourses.filter(
    (e) => e.progress > 0 && e.progress < 100,
  ).length;
  const avgProgress =
    visibleCourses.length > 0
      ? Math.round(
          visibleCourses.reduce((sum, e) => sum + (e.progress || 0), 0) /
            visibleCourses.length,
        )
      : 0;

  const stats = [
    {
      icon: FiBook,
      label: "Enrolled Courses",
      value: totalCourses,
      color: styles.statBlue,
    },
    {
      icon: FiCheckCircle,
      label: "Completed",
      value: completedCourses,
      color: styles.statGreen,
    },
    {
      icon: FiClock,
      label: "In Progress",
      value: inProgressCourses,
      color: styles.statYellow,
    },
    {
      icon: FiTrendingUp,
      label: "Avg. Progress",
      value: `${avgProgress}%`,
      color: styles.statPurple,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.headerTitle}>Welcome back, {user?.name}! 👋</h1>
          <p className={styles.headerSubtitle}>
            Continue your learning journey and track your progress
          </p>
        </motion.div>

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.statCard}
            >
              <div className={styles.statCardContent}>
                <div>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <p className={styles.statValue}>{stat.value}</p>
                </div>
                <div className={`${styles.statIcon} ${stat.color}`}>
                  <stat.icon className={styles.icon} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Continue Learning ── */}
        {inProgressCourses > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={styles.section}
          >
            <h2 className={styles.sectionTitle}>Continue Learning</h2>
            <div className={styles.continueGrid}>
              {visibleCourses
                .filter((e) => e.progress > 0 && e.progress < 100)
                .slice(0, 2)
                .map((enrollment, index) => (
                  <motion.div
                    key={enrollment._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={styles.continueCard}
                  >
                    {/* Details */}
                    <div className={styles.continueDetails}>
                      {/* Course title — prominent */}
                      <h3 className={styles.continueTitle}>
                        {enrollment.course?.title}
                      </h3>

                      <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Progress</span>
                          <span className={styles.progressPercentage}>
                            {enrollment.progress}%
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                          <div className={styles.progressGlow} />
                        </div>
                      </div>

                      <Link
                        to={`/learning/${enrollment.course?._id}`}
                        className={styles.continueButton}
                      >
                        <FiPlay className={styles.buttonIcon} />
                        Continue Learning
                      </Link>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* ── My Courses ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.coursesHeader}>
            <h2 className={styles.sectionTitle}>My Courses</h2>
            <Link to="/courses" className={styles.browseButton}>
              Browse More Courses
            </Link>
          </div>

          {isLoading ? (
            <div className={styles.coursesGrid}>
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visibleCourses.length > 0 ? (
            <div className={styles.coursesGrid}>
              {visibleCourses.map((enrollment, index) => (
                <motion.div
                  key={enrollment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={styles.courseCard}
                >
                  {/* Content */}
                  <div className={styles.courseContent}>
                    {/* Course title — always visible & prominent */}
                    <h3 className={styles.courseTitle}>
                      {enrollment.course?.title}
                    </h3>

                    <p className={styles.enrolledDate}>
                      Enrolled {formatDate(enrollment.enrolledAt, "PP")}
                    </p>

                    {/* Progress */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>Progress</span>
                        <span className={styles.progressPercentage}>
                          {enrollment.progress}%
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${enrollment.progress}%` }}
                        />
                        <div className={styles.progressGlow} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                      <Link
                        to={`/learning/${enrollment.course?._id}`}
                        className={styles.actionButton}
                      >
                        {enrollment.progress === 0
                          ? "Start Learning"
                          : enrollment.progress === 100
                            ? "Review"
                            : "Continue"}
                      </Link>
                      {enrollment.progress === 100 &&
                        enrollment.certificateId && (
                          <Link
                            to="/my-certificates"
                            className={styles.certificateButton}
                          >
                            <FiAward className={styles.buttonIcon} />
                          </Link>
                        )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <FiBook className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No courses yet</h3>
              <p className={styles.emptyText}>
                Start your learning journey by enrolling in a course
              </p>
              <Link to="/courses" className={styles.emptyButton}>
                Browse Courses
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* ── Mock Test Performance ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <MockTestPerformance />
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
