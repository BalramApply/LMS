import React from 'react';
import { FiFileText } from 'react-icons/fi';
import styles from './styles/ReadingMaterial.module.css';

const ReadingMaterial = ({ title, content }) => {
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
      </div>
      
      <div 
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default ReadingMaterial;