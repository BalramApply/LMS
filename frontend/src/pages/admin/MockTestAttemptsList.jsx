import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiTrendingUp, FiUsers, FiTarget } from 'react-icons/fi';
import { fetchTestAttempts } from '../../redux/slices/mockSlice';
import styles from './styles/MockTestAttemptsList.module.css';

const MockTestAttemptsList = ({ test, onBack }) => {
  const dispatch = useDispatch();
  const { testAttempts, testAttemptsStats, isLoading } = useSelector((s) => s.mock);

  useEffect(() => {
    dispatch(fetchTestAttempts(test._id));
  }, [dispatch, test._id]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <FiArrowLeft /> Back to Tests
        </button>
        <h1 className={styles.title}>{test.title} — Attempts</h1>
      </div>

      {/* Stats Overview */}
      {testAttemptsStats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FiUsers className={styles.statIcon} />
            <div>
              <p className={styles.statLabel}>Total Attempts</p>
              <p className={styles.statValue}>{testAttemptsStats.totalAttempts}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiTrendingUp className={styles.statIcon} />
            <div>
              <p className={styles.statLabel}>Avg Score</p>
              <p className={styles.statValue}>{testAttemptsStats.avgScore} / {test.questions?.length * test.markPerQuestion || 0}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiTarget className={styles.statIcon} />
            <div>
              <p className={styles.statLabel}>Avg Accuracy</p>
              <p className={styles.statValue}>{testAttemptsStats.avgAccuracy}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <p>Loading attempts...</p>
      ) : testAttempts.length === 0 ? (
        <div className={styles.empty}>No attempts yet for this test.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Skipped</th>
                <th>Time Taken</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {testAttempts.map((attempt) => (
                <tr key={attempt._id}>
                  <td>
                    <div className={styles.studentCell}>
                      {attempt.student?.avatar?.url ? (
                        <img src={attempt.student.avatar.url} alt="" className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {attempt.student?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className={styles.studentName}>{attempt.student?.name}</p>
                        <p className={styles.studentEmail}>{attempt.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.score}>
                      {attempt.score} / {attempt.totalMarks}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.accuracy} ${
                      attempt.accuracy >= 70 ? styles.accuracyHigh :
                      attempt.accuracy >= 40 ? styles.accuracyMid : styles.accuracyLow
                    }`}>
                      {attempt.accuracy}%
                    </span>
                  </td>
                  <td className={styles.correct}>{attempt.correctCount}</td>
                  <td className={styles.incorrect}>{attempt.incorrectCount}</td>
                  <td className={styles.skipped}>{attempt.skippedCount}</td>
                  <td>{formatTime(attempt.timeTaken)}</td>
                  <td>{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MockTestAttemptsList;