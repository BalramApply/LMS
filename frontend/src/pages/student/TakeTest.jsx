import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiAlertTriangle, FiChevronLeft, FiChevronRight, FiSend } from 'react-icons/fi';
import { submitTestAttempt } from '../../redux/slices/mockSlice';
import styles from './styles/TakeTest.module.css';

const TakeTest = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeTest, activeAttempt, isSubmitting } = useSelector((s) => s.mock);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);
  const hasSubmitted = useRef(false);

  // Redirect if no active test in store
  useEffect(() => {
    if (!activeTest || !activeAttempt) {
      navigate('/mock-tests');
    } else {
      // Restore time left: duration - elapsed
      const elapsed = Math.floor((Date.now() - new Date(activeAttempt.startedAt).getTime()) / 1000);
      const total = activeTest.duration * 60;
      const remaining = Math.max(0, total - elapsed);
      setTimeLeft(remaining);
    }
  }, [activeTest, activeAttempt, navigate]);

  const buildAnswersArray = useCallback(() => {
  return Object.entries(answers).map(([questionId, selectedOption]) => ({
    questionId,
    selectedOption,
  }));
}, [answers]);

  const handleAutoSubmit = useCallback(() => {
  const answersArr = buildAnswersArray();

  dispatch(
    submitTestAttempt({
      attemptId: activeAttempt._id,
      answers: answersArr,
    })
  ).then(() => {
    navigate(`/mock-tests/result/${activeAttempt._id}`);
  });
}, [buildAnswersArray, activeAttempt, dispatch, navigate]);

// Countdown timer
  useEffect(() => {
  if (timeLeft === null) return;

  timerRef.current = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timerRef.current);
        if (!hasSubmitted.current) {
          hasSubmitted.current = true;
          handleAutoSubmit();
        }
        return 0;
      }
      if (prev === 301) setShowWarning(true);
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timerRef.current);
}, [timeLeft, handleAutoSubmit]);

  const handleAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    clearInterval(timerRef.current);
    setShowConfirm(false);

    const answersArr = buildAnswersArray();
    const result = await dispatch(
      submitTestAttempt({ attemptId: activeAttempt._id, answers: answersArr })
    );
    if (submitTestAttempt.fulfilled.match(result)) {
      navigate(`/mock-tests/result/${activeAttempt._id}`);
    }
  };

  if (!activeTest || !activeAttempt) return null;

  const questions = activeTest.questions || [];
  const currentQ = questions[currentIdx];
  const totalQ = questions.length;

  const answered = Object.keys(answers).length;
  const skipped = totalQ - answered;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isUrgent = timeLeft !== null && timeLeft <= 300;

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={`${styles.topBar} ${isUrgent ? styles.topBarUrgent : ''}`}>
        <div className={styles.testInfo}>
          <h2 className={styles.testName}>{activeTest.title}</h2>
          <span className={styles.progress}>{answered}/{totalQ} answered</span>
        </div>

        <div className={`${styles.timer} ${isUrgent ? styles.timerUrgent : ''}`}>
          <FiClock />
          <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
        </div>

        <button onClick={() => setShowConfirm(true)} className={styles.submitTopBtn}>
          <FiSend /> Submit Test
        </button>
      </div>

      {/* 5-min Warning */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.warningBanner}
          >
            <FiAlertTriangle />
            <span>⚠️ Only 5 minutes remaining! Wrap up and submit.</span>
            <button onClick={() => setShowWarning(false)} className={styles.dismissBtn}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.layout}>
        {/* Question Panel */}
        <div className={styles.questionPanel}>
          <div className={styles.qCounter}>
            Question {currentIdx + 1} of {totalQ}
          </div>

          {currentQ.image?.url && (
            <img src={currentQ.image.url} alt="Question" className={styles.qImage} />
          )}

          <p className={styles.qText}>{currentQ.question}</p>

          <div className={styles.options}>
            {currentQ.options.map((opt, oi) => {
              const selected = answers[currentQ._id] === opt;
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(currentQ._id, opt)}
                  className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                >
                  <span className={styles.optionLetter}>{String.fromCharCode(65 + oi)}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Clear Answer */}
          {answers[currentQ._id] && (
            <button
              onClick={() => {
                const updated = { ...answers };
                delete updated[currentQ._id];
                setAnswers(updated);
              }}
              className={styles.clearBtn}
            >
              Clear Answer
            </button>
          )}

          {/* Navigation */}
          <div className={styles.navRow}>
            <button
              onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
              disabled={currentIdx === 0}
              className={styles.navBtn}
            >
              <FiChevronLeft /> Previous
            </button>
            <button
              onClick={() => setCurrentIdx((p) => Math.min(totalQ - 1, p + 1))}
              disabled={currentIdx === totalQ - 1}
              className={styles.navBtn}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>

        {/* Question Palette */}
        <div className={styles.palette}>
          <h3 className={styles.paletteTitle}>Questions</h3>
          <div className={styles.paletteGrid}>
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => setCurrentIdx(idx)}
                className={`${styles.palBtn} ${
                  answers[q._id] ? styles.palBtnAnswered : ''
                } ${idx === currentIdx ? styles.palBtnActive : ''}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className={styles.legend}>
            <span className={styles.legendAnswered}>■</span> Answered ({answered})
            <span className={styles.legendSkipped}>■</span> Not visited ({skipped})
            <span className={styles.legendActive}>■</span> Current
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className={styles.submitPaletteBtn}
            disabled={isSubmitting}
          >
            <FiSend /> Submit Test
          </button>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={styles.confirmModal}
            >
              <h3>Submit Test?</h3>
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span>Answered</span>
                  <strong className={styles.green}>{answered}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>Skipped</span>
                  <strong className={styles.red}>{skipped}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>Total</span>
                  <strong>{totalQ}</strong>
                </div>
              </div>
              {skipped > 0 && (
                <p className={styles.confirmWarning}>
                  You have {skipped} unanswered question{skipped > 1 ? 's' : ''}.
                </p>
              )}
              <div className={styles.confirmActions}>
                <button onClick={() => setShowConfirm(false)} className={styles.cancelBtn}>
                  Continue Test
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={styles.confirmSubmitBtn}
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TakeTest;