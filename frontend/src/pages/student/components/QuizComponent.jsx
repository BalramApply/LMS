import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiAward, FiRotateCw } from 'react-icons/fi';
import Confetti from 'react-confetti';
import { submitQuiz } from '../../../redux/slices/progressSlice';
import toast from 'react-hot-toast';
import styles from './styles/QuizComponent.module.css';

const QuizComponent = ({ quiz, courseId, topicId, onComplete }) => {
  const dispatch = useDispatch();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAnswerChange = (questionIndex, answer) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionIndex]: answer });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.length) {
      toast.error('Please answer all questions');
      return;
    }

    let correctCount = 0;
    const userAnswers = [];

    quiz.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      userAnswers.push({ questionIndex: index, selectedAnswer: userAnswer, isCorrect });
    });

    const percentage = (correctCount / quiz.length) * 100;

    try {
      await dispatch(submitQuiz({ courseId, topicId, answers: userAnswers, score: percentage })).unwrap();

      setResult({ score: percentage, correctCount, totalQuestions: quiz.length, details: userAnswers });
      setSubmitted(true);

      if (percentage === 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success('🎉 Perfect score! Amazing work!');
      } else if (percentage >= 80) {
        toast.success('Great job! You passed!');
      } else {
        toast.success('Quiz submitted!');
      }

      if (onComplete) onComplete();
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const getOptionClass = (question, option, questionIndex) => {
    const isSelected = answers[questionIndex] === option;
    const isCorrect = option === question.correctAnswer;
    const userHasAnswered = answers[questionIndex] !== undefined;

    if (submitted) {
      if (isCorrect) return styles.optionCorrect;
      if (isSelected && !isCorrect) return styles.optionIncorrect;
      return styles.optionDisabled;
    }

    if (userHasAnswered) {
      if (isCorrect) return styles.optionCorrect;
      if (isSelected && !isCorrect) return styles.optionIncorrect;
      return styles.optionDisabled;
    }

    if (isSelected) return styles.optionSelected;
    return '';
  };

  const getResultClass = (score) => {
    if (score >= 80) return styles.resultGreen;
    if (score >= 60) return styles.resultYellow;
    return styles.resultRed;
  };

  const getScoreClass = (score) => {
    if (score >= 80) return styles.scoreGreen;
    if (score >= 60) return styles.scoreYellow;
    return styles.scoreRed;
  };

  return (
    <div className={styles.container}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Scanline overlay */}
      <div className={styles.scanlines} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <FiAward className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <h3 className={styles.headerTitle}>QUIZ.EXE</h3>
          <p className={styles.headerSubtitle}>
            {quiz.length} {quiz.length === 1 ? 'QUESTION' : 'QUESTIONS'}&nbsp;/&nbsp;TEST YOUR KNOWLEDGE
          </p>
        </div>
        <div className={styles.headerDecor} aria-hidden="true">
          <span className={styles.glitchBar} />
          <span className={styles.glitchBar} />
          <span className={styles.glitchBar} />
        </div>
      </div>

      {/* Questions */}
      <div className={styles.questions}>
        {quiz.map((question, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 120 }}
            className={styles.questionCard}
          >
            <div className={styles.questionHeader}>
              <div className={styles.questionNumber}>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className={styles.questionInfo}>
                <p className={styles.questionText}>{question.question}</p>
                <span className={styles.questionType}>
                  {question.type === 'MCQ' && '// MULTIPLE_CHOICE'}
                  {question.type === 'TrueFalse' && '// TRUE_OR_FALSE'}
                  {question.type === 'CodeOutput' && '// CODE_OUTPUT'}
                </span>
              </div>
            </div>

            {/* Code block */}
            {question.type === 'CodeOutput' && question.codeSnippet && (
              <div className={styles.codeBlock}>
                <div className={styles.codeBlockHeader}>
                  <span className={`${styles.codeBlockDot} ${styles.dotRed}`} />
                  <span className={`${styles.codeBlockDot} ${styles.dotYellow}`} />
                  <span className={`${styles.codeBlockDot} ${styles.dotGreen}`} />
                  <span className={styles.codeBlockLabel}>snippet.js</span>
                </div>
                <pre className={styles.codePre}>
                  <code className={styles.codeText}>{question.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Options */}
            <div className={styles.options}>
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[index] === option;
                const isCorrect = option === question.correctAnswer;
                const userHasAnswered = answers[index] !== undefined;
                const showIcons = userHasAnswered || submitted;

                return (
                  <label
                    key={optionIndex}
                    className={`${styles.option} ${getOptionClass(question, option, index)}`}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={isSelected}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      disabled={submitted}
                      className={styles.radio}
                    />
                    <span className={styles.optionText}>{option}</span>
                    {showIcons && isCorrect && (
                      <FiCheckCircle className={styles.iconCorrect} />
                    )}
                    {showIcons && !isCorrect && isSelected && (
                      <FiXCircle className={styles.iconIncorrect} />
                    )}
                  </label>
                );
              })}
            </div>

            {/* Explanation */}
            {submitted && question.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={styles.explanation}
              >
                <p className={styles.explanationTitle}>&gt;_ EXPLANATION</p>
                <p className={styles.explanationText}>{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Result */}
      <AnimatePresence>
        {submitted && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={`${styles.resultCard} ${getResultClass(result.score)}`}
          >
            <div className={styles.resultInner}>
              <div className={`${styles.resultScore} ${getScoreClass(result.score)}`}>
                {Math.round(result.score)}%
              </div>
              <p className={styles.resultTitle}>
                {result.score === 100
                  ? '[ PERFECT_EXECUTION ]'
                  : result.score >= 80
                  ? '[ OBJECTIVE_CLEARED ]'
                  : result.score >= 60
                  ? '[ PARTIAL_SUCCESS ]'
                  : '[ SYSTEM_RETRY ]'}
              </p>
              <p className={styles.resultSubtitle}>
                {result.correctCount}&nbsp;/&nbsp;{result.totalQuestions}&nbsp;CORRECT
              </p>
              <button onClick={handleRetry} className={styles.retryButton}>
                <FiRotateCw className={styles.retryIcon} />
                RETRY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      {!submitted && (
        <div className={styles.submitContainer}>
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < quiz.length}
            className={styles.submitButton}
          >
            <span className={styles.submitText}>SUBMIT QUIZ</span>
            <span className={styles.submitGlitch} aria-hidden="true">SUBMIT QUIZ</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;