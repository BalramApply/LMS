import React from 'react';
import { motion } from 'framer-motion';
import styles from './styles/Loader.module.css';

const Loader = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: styles.spinnerSm,
    md: styles.spinnerMd,
    lg: styles.spinnerLg,
  };

  const LoaderSpinner = () => (
    <div className={styles.spinnerWrapper}>
      <motion.div
        className={`${styles.spinner} ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {text && (
        <motion.p
          className={styles.loadingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreenContainer}>
        <div className={styles.textCenter}>
          <LoaderSpinner />
          <motion.div
            className={styles.fullScreenContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.dotsContainer}>
              <motion.div
                className={`${styles.dot} ${styles.dot1}`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className={`${styles.dot} ${styles.dot2}`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className={`${styles.dot} ${styles.dot3}`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <p className={styles.experienceText}>Loading your experience...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <LoaderSpinner />
    </div>
  );
};

// Skeleton loader for cards
export const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonTitle} />
    <div className={styles.skeletonSubtitle} />
    <div className={styles.skeletonLines}>
      <div className={styles.skeletonLine} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </div>
  </div>
);

// Skeleton loader for list items
export const SkeletonList = ({ count = 3 }) => (
  <div className={styles.skeletonList}>
    {[...Array(count)].map((_, index) => (
      <div key={index} className={styles.skeletonListItem}>
        <div className={styles.skeletonListContent}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonInfoTitle} />
            <div className={styles.skeletonInfoSubtitle} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Loader;