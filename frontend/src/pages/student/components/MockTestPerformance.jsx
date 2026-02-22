import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiTarget, FiAward, FiClock } from 'react-icons/fi';
import { fetchMyAttempts } from '../../../redux/slices/mockSlice';
import styles from './styles/MockTestPerformance.module.css';

const MockTestPerformance = () => {
  const dispatch = useDispatch();
  const { myAttempts, myStats, isLoading } = useSelector((s) => s.mock);

  useEffect(() => {
    dispatch(fetchMyAttempts());
  }, [dispatch]);

  const formatTime = (secs) => {
    if (!secs) return '-';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getScoreColor = (score, total) => {
    const pct = (score / total) * 100;
    if (pct >= 75) return styles.scoreHigh;
    if (pct >= 50) return styles.scoreMid;
    return styles.scoreLow;
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <FiBarChart2 /> Mock Test Performance
        </h2>
        <Link to="/mock-tests" className={styles.viewAllLink}>
          Take a Test →
        </Link>
      </div>

      {/* Stats Cards */}
      {myStats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiAward /></div>
            <div>
              <p className={styles.statLabel}>Tests Attempted</p>
              <p className={styles.statValue}>{myStats.totalAttempts}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiBarChart2 /></div>
            <div>
              <p className={styles.statLabel}>Average Score</p>
              <p className={styles.statValue}>{myStats.avgScore}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiTarget /></div>
            <div>
              <p className={styles.statLabel}>Average Accuracy</p>
              <p className={styles.statValue}>{myStats.avgAccuracy}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Attempts Table */}
      {isLoading ? (
        <div className={styles.loadingRows}>
          {[...Array(3)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : myAttempts.length === 0 ? (
        <div className={styles.empty}>
          <FiBarChart2 className={styles.emptyIcon} />
          <p>You haven't taken any mock tests yet.</p>
          <Link to="/mock-tests" className={styles.emptyBtn}>Browse Tests</Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Time Taken</th>
                <th>Date</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {myAttempts.map((attempt, idx) => (
                <motion.tr
                  key={attempt._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <td className={styles.testNameCell}>
                    {attempt.mockTest?.title || 'Test'}
                  </td>
                  <td>
                    <span className={`${styles.score} ${getScoreColor(attempt.score, attempt.totalMarks)}`}>
                      {attempt.score} / {attempt.totalMarks}
                    </span>
                  </td>
                  <td>
                    <div className={styles.accuracyBar}>
                      <div
                        className={styles.accuracyFill}
                        style={{ width: `${attempt.accuracy}%` }}
                      />
                      <span className={styles.accuracyText}>{attempt.accuracy}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.time}>
                      <FiClock /> {formatTime(attempt.timeTaken)}
                    </span>
                  </td>
                  <td>{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/mock-tests/result/${attempt._id}`} className={styles.reviewLink}>
                      Review
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MockTestPerformance;