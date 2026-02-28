import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiFileText, FiCheckCircle } from 'react-icons/fi';
import styles from './styles/ReadingMaterial.module.css';

const ReadingMaterial = ({ title, content, onRead, isRead = false }) => {
  const contentRef = useRef(null);
  const firedRef = useRef(false);
  const [readProgress, setReadProgress] = useState(0);
  const [markedRead, setMarkedRead] = useState(isRead);

  const markRead = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setMarkedRead(true);
    onRead?.();
  }, [onRead]);

  // Scroll progress tracker — fires onRead when user reaches 90% of content
  useEffect(() => {
    if (!content || isRead) return;
    firedRef.current = isRead;

    const el = contentRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);
      setReadProgress(Math.min(pct, 100));
      if (pct >= 90) markRead();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    // If content is short enough to not need scrolling, mark as read after 5s
    const noScrollNeeded = el.scrollHeight <= el.clientHeight + 10;
    let timer;
    if (noScrollNeeded) {
      timer = setTimeout(markRead, 5000);
    }

    // Initial check in case content is already fully visible
    handleScroll();

    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [content, isRead, markRead]);

  // Sync external isRead changes (e.g. switching topics)
  useEffect(() => {
    setMarkedRead(isRead);
    firedRef.current = isRead;
    setReadProgress(isRead ? 100 : 0);
  }, [isRead]);

  if (!content) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FiFileText className={styles.emptyIcon} />
          <p>No reading material available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FiFileText className={styles.headerIcon} />
        <h3 className={styles.title}>{title || 'Reading Material'}</h3>
        {markedRead ? (
          <span className={styles.readBadge}>
            <FiCheckCircle className={styles.readIcon} /> Read
          </span>
        ) : (
          <span className={styles.progressBadge}>{readProgress}%</span>
        )}
      </div>

      {/* Scroll progress bar */}
      {!markedRead && (
        <div className={styles.scrollProgressBar}>
          <div
            className={styles.scrollProgressFill}
            style={{ width: `${readProgress}%` }}
          />
        </div>
      )}

      <div
        ref={contentRef}
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default ReadingMaterial;