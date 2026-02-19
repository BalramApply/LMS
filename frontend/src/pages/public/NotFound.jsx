import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import Styles from './styles/NotFound.module.css';

const NotFound = () => {
  return (
    <div className={Styles.page}>
      {/* Cyberpunk ambient layers */}
      <div className={Styles.scanlines} aria-hidden="true" />
      <div className={Styles.gridBg} aria-hidden="true" />
      <div className={Styles.glitchBar} aria-hidden="true" />

      <div className={Styles.container}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={Styles.inner}
        >
          {/* 404 */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className={Styles.numberWrap}
          >
            <span className={Styles.number404}>404</span>
            {/* glitch clone layers */}
            <span className={Styles.glitch1} aria-hidden="true">404</span>
            <span className={Styles.glitch2} aria-hidden="true">404</span>
          </motion.div>

          {/* Decorative divider */}
          <div className={Styles.divider} aria-hidden="true">
            <span className={Styles.dividerLine} />
            <span className={Styles.dividerDot} />
            <span className={Styles.dividerLine} />
          </div>

          {/* Error Message */}
          <h2 className={Styles.title}>PAGE NOT FOUND</h2>
          <p className={Styles.subtitle}>
            The node you're requesting does not exist in this sector.
            It may have been relocated or purged from the grid.
          </p>

          {/* Action Buttons */}
          <div className={Styles.actions}>
            <Link to="/" className={Styles.btnPrimary}>
              <FiHome className={Styles.btnIcon} />
              GO HOME
            </Link>
            <button
              onClick={() => window.history.back()}
              className={Styles.btnOutline}
            >
              <FiArrowLeft className={Styles.btnIcon} />
              GO BACK
            </button>
          </div>

          {/* Decorative orb */}
          <div className={Styles.orbWrap} aria-hidden="true">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className={Styles.orbRing}
            />
            <div className={Styles.orbCore} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;