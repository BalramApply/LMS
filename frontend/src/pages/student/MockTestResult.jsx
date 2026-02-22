import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiMinus, FiTarget, FiClock, FiList } from 'react-icons/fi';
import { fetchAttemptResult, clearResult } from '../../redux/slices/mockSlice';
import styles from './styles/MockTestResult.module.css';

const MockTestResult = () => {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentResult, isLoading } = useSelector((s) => s.mock);

  useEffect(() => {
    dispatch(fetchAttemptResult(attemptId));
    return () => dispatch(clearResult());
  }, [attemptId, dispatch]);

  if (isLoading || !currentResult) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading result...</p>
      </div>
    );
  }

  const {
    score, totalMarks, correctCount, incorrectCount,
    skippedCount, accuracy, timeTaken, detailedResult,
  } = currentResult;

  const percentage = Math.round((score / totalMarks) * 100);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Excellent!', color: styles.gradeA };
    if (percentage >= 75) return { label: 'Great Job!', color: styles.gradeB };
    if (percentage >= 60) return { label: 'Good Effort', color: styles.gradeC };
    if (percentage >= 40) return { label: 'Keep Practicing', color: styles.gradeD };
    return { label: 'Needs Improvement', color: styles.gradeF };
  };

  const grade = getGrade();

  return (
    <div className={styles.container}>
      {/* Score Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.summaryCard}
      >
        <div className={`${styles.gradeLabel} ${grade.color}`}>{grade.label}</div>

        {/* Circular Score */}
        <div className={styles.scoreCircle}>
          <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
            <circle cx="60" cy="60" r="54" className={styles.trackCircle} />
            <circle
              cx="60" cy="60" r="54"
              className={styles.progressCircle}
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
            />
          </svg>
          <div className={styles.scoreText}>
            <span className={styles.scoreValue}>{score}</span>
            <span className={styles.scoreDivider}>/{totalMarks}</span>
          </div>
        </div>

        <p className={styles.percentageText}>{percentage}%</p>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <FiCheckCircle className={styles.iconCorrect} />
            <span className={styles.statNum}>{correctCount}</span>
            <span className={styles.statLbl}>Correct</span>
          </div>
          <div className={styles.statItem}>
            <FiXCircle className={styles.iconWrong} />
            <span className={styles.statNum}>{incorrectCount}</span>
            <span className={styles.statLbl}>Wrong</span>
          </div>
          <div className={styles.statItem}>
            <FiMinus className={styles.iconSkipped} />
            <span className={styles.statNum}>{skippedCount}</span>
            <span className={styles.statLbl}>Skipped</span>
          </div>
          <div className={styles.statItem}>
            <FiTarget className={styles.iconAccuracy} />
            <span className={styles.statNum}>{accuracy}%</span>
            <span className={styles.statLbl}>Accuracy</span>
          </div>
          <div className={styles.statItem}>
            <FiClock className={styles.iconTime} />
            <span className={styles.statNum}>{formatTime(timeTaken)}</span>
            <span className={styles.statLbl}>Time Taken</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/mock-tests" className={styles.btnSecondary}>
            <FiList /> All Tests
          </Link>
          <Link to="/dashboard" className={styles.btnPrimary}>
            Go to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Detailed Review */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={styles.reviewSection}
      >
        <h2 className={styles.reviewTitle}>Detailed Review</h2>

        {detailedResult?.map((item, idx) => (
          <div
            key={item.questionId}
            className={`${styles.reviewCard} ${
              item.isSkipped ? styles.reviewSkipped :
              item.isCorrect ? styles.reviewCorrect : styles.reviewWrong
            }`}
          >
            <div className={styles.reviewHeader}>
              <span className={styles.reviewNum}>Q{idx + 1}</span>
              <span className={`${styles.reviewStatus} ${
                item.isSkipped ? styles.statusSkipped :
                item.isCorrect ? styles.statusCorrect : styles.statusWrong
              }`}>
                {item.isSkipped ? 'Skipped' : item.isCorrect ? 'Correct' : 'Wrong'}
              </span>
            </div>

            {item.image?.url && (
              <img src={item.image.url} alt="Question" className={styles.reviewImage} />
            )}

            <p className={styles.reviewQuestion}>{item.question}</p>

            <div className={styles.reviewOptions}>
              {item.options.map((opt, oi) => {
                const isCorrect = opt === item.correctAnswer;
                const isSelected = opt === item.selectedOption;
                return (
                  <div
                    key={oi}
                    className={`${styles.reviewOpt} ${
                      isCorrect ? styles.optCorrect :
                      isSelected && !isCorrect ? styles.optWrong : ''
                    }`}
                  >
                    <span className={styles.optLetter}>{String.fromCharCode(65 + oi)}</span>
                    <span>{opt}</span>
                    {isCorrect && <FiCheckCircle className={styles.optCheckIcon} />}
                    {isSelected && !isCorrect && <FiXCircle className={styles.optXIcon} />}
                  </div>
                );
              })}
            </div>

            {!item.isSkipped && (
              <p className={styles.yourAnswer}>
                Your answer: <strong>{item.selectedOption || 'None'}</strong>
                {' · '}Correct: <strong className={styles.correctAnswer}>{item.correctAnswer}</strong>
              </p>
            )}

            {item.explanation && (
              <div className={styles.explanation}>
                <strong>Explanation:</strong> {item.explanation}
              </div>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default MockTestResult;