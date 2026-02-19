import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { submitTask } from '../../../redux/slices/progressSlice';
import toast from 'react-hot-toast';
import { FiCode, FiLink, FiCheckCircle, FiSend } from 'react-icons/fi';
import api from '../../../api/client';
import { useDispatch } from 'react-redux';
import styles from './styles/TaskSubmission.module.css';

const TaskSubmission = ({ task, courseId, taskId, taskType, existingSubmission, onComplete }) => {
  const [submissionType, setSubmissionType] = useState(
    existingSubmission?.submissionType || 'code'
  );
  const [submissionData, setSubmissionData] = useState(
    existingSubmission?.content || ''
  );
  const [submitting, setSubmitting] = useState(false);

  const isSubmitted = existingSubmission?.completed;

  const handleSubmit = async () => {
  if (!submissionData.trim()) {
    toast.error('Please provide your submission');
    return;
  }

  if (submissionType === 'link') {
    try {
      new URL(submissionData);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
  }

  setSubmitting(true);

  try {
    await dispatch(
      submitTask({
        courseId,
        taskId,
        taskType,
        submissionType,
        content: submissionData,
      })
    ).unwrap();

    // toast.success('Task submitted successfully!');

    if (onComplete) {
      setTimeout(() => onComplete(), 500);
    }
  } catch (error) {
    toast.error(error?.message || 'Failed to submit task');
  } finally {
    setSubmitting(false);
  }
};


const dispatch = useDispatch();

  return (
    <div className={styles.container}>
      {/* Task Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <FiCode className={styles.icon} />
        </div>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <h3 className={styles.headerTitle}>{task.title}</h3>
            {isSubmitted && (
              <span className={styles.completedBadge}>
                <FiCheckCircle className={styles.badgeIcon} />
                Submitted
              </span>
            )}
          </div>
          <p className={styles.headerDescription}>{task.description}</p>
          
          {/* Task Type Badge */}
          <span className={styles.typeBadge}>
            {taskType === 'mini' && 'Mini Task'}
            {taskType === 'major' && 'Major Task'}
            {taskType === 'capstone' && 'Capstone Project'}
          </span>
        </div>
      </div>

      {/* Submission Form */}
      <div className={styles.formCard}>
        <h4 className={styles.formTitle}>Your Submission</h4>

        {/* Submission Type Toggle */}
        <div className={styles.typeToggle}>
          <button
            onClick={() => setSubmissionType('code')}
            disabled={isSubmitted}
            className={`${styles.typeButton} ${submissionType === 'code' ? styles.typeButtonActive : ''} ${isSubmitted ? styles.typeButtonDisabled : ''}`}
          >
            <div className={styles.typeButtonContent}>
              <FiCode className={styles.typeIcon} />
              <span className={styles.typeLabel}>Code</span>
            </div>
            <p className={styles.typeDescription}>Submit your code solution</p>
          </button>

          <button
            onClick={() => setSubmissionType('link')}
            disabled={isSubmitted}
            className={`${styles.typeButton} ${submissionType === 'link' ? styles.typeButtonActive : ''} ${isSubmitted ? styles.typeButtonDisabled : ''}`}
          >
            <div className={styles.typeButtonContent}>
              <FiLink className={styles.typeIcon} />
              <span className={styles.typeLabel}>Link</span>
            </div>
            <p className={styles.typeDescription}>Submit a project link</p>
          </button>
        </div>

        {/* Code Input */}
        {submissionType === 'code' && (
          <div className={styles.inputSection}>
            <label className={styles.inputLabel}>
              Your Code
            </label>
            <textarea
              value={submissionData}
              onChange={(e) => setSubmissionData(e.target.value)}
              disabled={isSubmitted}
              placeholder="Paste your code here..."
              className={styles.codeTextarea}
            />
            <p className={styles.inputHint}>
              Tip: Make sure your code is well-commented and formatted
            </p>
          </div>
        )}

        {/* Link Input */}
        {submissionType === 'link' && (
          <div className={styles.inputSection}>
            <label className={styles.inputLabel}>
              Project Link
            </label>
            <input
              type="url"
              value={submissionData}
              onChange={(e) => setSubmissionData(e.target.value)}
              disabled={isSubmitted}
              placeholder="https://github.com/username/project"
              className={styles.linkInput}
            />
            <p className={styles.inputHint}>
              Provide a link to your GitHub repo, CodePen, live demo, etc.
            </p>
          </div>
        )}

        {/* Submission Info */}
        {isSubmitted && existingSubmission && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.submissionInfo}
          >
            <div className={styles.submissionInfoContent}>
              <FiCheckCircle className={styles.submissionInfoIcon} />
              <div>
                <p className={styles.submissionInfoTitle}>Task Completed!</p>
                <p className={styles.submissionInfoDate}>
                  Submitted on {new Date(existingSubmission.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        {!isSubmitted && (
          <div className={styles.submitContainer}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !submissionData.trim()}
              className={styles.submitButton}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className={styles.submitIcon} />
                  Submit Task
                </>
              )}
            </button>
          </div>
        )}

        {/* Resubmit Info */}
        {isSubmitted && (
          <p className={styles.resubmitInfo}>
            Task already submitted. Contact your instructor if you need to resubmit.
          </p>
        )}
      </div>

      {/* Task Instructions/Tips */}
      {task.instructions && (
        <div className={styles.instructionsCard}>
          <h4 className={styles.instructionsTitle}>
            📝 Instructions
          </h4>
          <p className={styles.instructionsText}>
            {task.instructions}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskSubmission;