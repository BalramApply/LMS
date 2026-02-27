import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiUsers, FiBookOpen, FiAward } from 'react-icons/fi';
import {
  formatCurrency,
  calculateDiscount,
  isDiscountValid,
} from '../../../utils/razorpayHelper';
import {
  getLevelBadgeColor,
  getTypeBadgeColor,
  getPlaceholderImage,
} from '../../../utils/formatters';
import styles from './styles/CourseCard.module.css';

const CourseCard = ({ course, index = 0 }) => {
  const hasDiscount = course.discountPrice && isDiscountValid(course.discountValidTill);
  const discount = hasDiscount
    ? calculateDiscount(course.price, course.discountPrice)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={styles.cardWrapper}
    >
      <Link to={`/courses/${course._id}`} className={styles.cardLink}>
        <div className={styles.card}>
          {/* Thumbnail */}
          <div className={styles.thumbnailWrapper}>
            <img
              src={course.thumbnail?.url || getPlaceholderImage(course.title)}
              alt={course.title}
              className={styles.thumbnail}
              loading="lazy"
            />
            
            {/* Discount Badge */}
            {hasDiscount && (
              <div className={styles.discountBadge}>
                {discount}% OFF
              </div>
            )}

            {/* Course Type Badge */}
            <div className={styles.typeBadgeWrapper}>
              <span className={`${styles.badge} ${styles[getTypeBadgeColor(course.courseType)]}`}>
                {course.courseType}
              </span>
            </div>

            {/* Overlay on Hover */}
            <div className={styles.hoverOverlay}>
              <p className={styles.overlayText}>
                {course.shortDescription}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {/* Category and Level */}
            <div className={styles.badgesRow}>
              <span className={`${styles.badge} ${styles[getLevelBadgeColor(course.level)]}`}>
                {course.level}
              </span>
              <span className={styles.category}>{course.category}</span>
            </div>

            {/* Title */}
            <h3 className={styles.title}>
              {course.title}
            </h3>

            {/* Instructor */}
            <p className={styles.instructor}>
              <FiUsers className={styles.icon} />
              {course.instructorName}
            </p>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <FiBookOpen className={styles.icon} />
                <span>{course.levels?.length || 0} Levels</span>
              </div>
              <div className={styles.stat}>
                <FiUsers className={styles.icon} />
                <span>{course.enrolledStudents || 0}</span>
              </div>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              {course.courseType === 'Free' ? (
                <span className={styles.freePrice}>Free</span>
              ) : (
                <div className={styles.priceWrapper}>
                  {hasDiscount ? (
                    <>
                      <span className={styles.currentPrice}>
                        {formatCurrency(course.discountPrice)}
                      </span>
                      <span className={styles.originalPrice}>
                        {formatCurrency(course.price)}
                      </span>
                    </>
                  ) : (
                    <span className={styles.currentPrice}>
                      {formatCurrency(course.price)}
                    </span>
                  )}
                </div>
              )}

              {/* Batch Type */}
              {course.batchType && (
                <div className={styles.batchType}>
                  <FiClock className={styles.smallIcon} />
                  <span>{course.batchType}</span>
                </div>
              )}
            </div>

            {/* Access Type */}
            {course.accessType && (
              <div className={styles.accessType}>
                <FiAward className={styles.smallIcon} />
                <span>
                  {course.accessType === 'Lifetime'
                    ? 'Lifetime Access'
                    : `${course.accessDuration} months access`}
                </span>
              </div>
            )}
          </div>

          {/* Hover Effect - View Course Button */}
          <div className={styles.buttonWrapper}>
            <div className={styles.viewButton}>
              View Course Details
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CourseCard;