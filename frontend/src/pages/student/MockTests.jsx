import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiTarget, FiList, FiLock, FiPlay } from 'react-icons/fi';
import { fetchPublishedTests, startTestAttempt } from '../../redux/slices/mockSlice';
import { displayRazorpayMockTest } from '../../utils/mockTestPayment';
import { formatCurrency } from '../../utils/formatters';
import styles from './styles/MockTests.module.css';

const MockTests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { publishedTests, isLoading } = useSelector((s) => s.mock);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchPublishedTests());
  }, [dispatch]);

  const handleStartTest = async (test) => {
    if (test.accessType === 'Paid') {
      // Launch Razorpay for payment then start
      await displayRazorpayMockTest(test._id, user, () => {
        startTest(test._id);
      });
    } else {
      startTest(test._id);
    }
  };

  const startTest = async (testId) => {
    const result = await dispatch(startTestAttempt(testId));
    if (startTestAttempt.fulfilled.match(result)) {
      navigate(`/mock-tests/${testId}/take`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mock Tests</h1>
        <p className={styles.subtitle}>Practice with timed tests to sharpen your skills</p>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : publishedTests.length === 0 ? (
        <div className={styles.empty}>
          <FiList className={styles.emptyIcon} />
          <p>No mock tests available yet. Check back soon!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {publishedTests.map((test, idx) => (
            <motion.div
              key={test._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${test.accessType === 'Paid' ? styles.badgePaid : styles.badgeFree}`}>
                    {test.accessType === 'Paid' ? formatCurrency(test.price) : 'Free'}
                  </span>
                  {test.negativeMarking && (
                    <span className={styles.badgeNeg}>-ve Marking</span>
                  )}
                </div>
                <h3 className={styles.testTitle}>{test.title}</h3>
                <p className={styles.testDesc}>{test.description}</p>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <FiClock /> {test.duration} min
                </span>
                <span className={styles.metaItem}>
                  <FiList /> {test.totalQuestions} questions
                </span>
                <span className={styles.metaItem}>
                  <FiTarget /> {test.totalMarks} marks
                </span>
              </div>

              {test.negativeMarking && (
                <p className={styles.negNote}>
                  ⚠️ Negative marking: -{test.negativeMarkValue} per wrong answer
                </p>
              )}

              {test.totalAttempts > 0 && (
                <p className={styles.attemptsNote}>
                  {test.totalAttempts} students attempted · Avg score: {test.averageScore}
                </p>
              )}

              <button
                onClick={() => handleStartTest(test)}
                className={styles.startBtn}
              >
                {test.accessType === 'Paid' ? (
                  <><FiLock /> Buy & Start Test</>
                ) : (
                  <><FiPlay /> Start Test</>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MockTests;