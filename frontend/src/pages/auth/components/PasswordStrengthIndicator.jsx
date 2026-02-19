import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import {
  checkPasswordStrength
} from '../../../utils/passwordStrength';
import Styles from './styles/PasswordStrengthIndicator.module.css';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const { strength, score } = checkPasswordStrength(password);

  const requirements = [
    { text: 'At least 8 characters',              met: password.length >= 8 },
    { text: 'One uppercase letter',               met: /[A-Z]/.test(password) },
    { text: 'One lowercase letter',               met: /[a-z]/.test(password) },
    { text: 'One number',                         met: /\d/.test(password) },
    { text: 'One special character (@$!%*?&#)',   met: /[@$!%*?&#]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className={Styles.wrapper}>
      {/* Strength Bar */}
      <div className={Styles.barSection}>
        <div className={Styles.barHeader}>
          <span className={Styles.barLabel}>Password Strength</span>
          <span className={`${Styles.strengthText} ${Styles[`strength__${strength}`]}`}>
            {strength}
          </span>
        </div>
        <div className={Styles.barTrack}>
          <motion.div
            className={`${Styles.barFill} ${Styles[`fill__${strength}`]}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={Styles.requirementsSection}
        >
          <p className={Styles.requirementsTitle}>Requirements:</p>
          <div className={Styles.requirementsList}>
            {requirements.map((req, index) => (
              <motion.div
                key={req.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={Styles.requirementRow}
              >
                <div className={`${Styles.reqIcon} ${req.met ? Styles.reqIcon__met : Styles.reqIcon__unmet}`}>
                  {req.met ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <FiCheck className={Styles.icon} />
                    </motion.div>
                  ) : (
                    <FiX className={Styles.icon} />
                  )}
                </div>
                <span className={`${Styles.reqText} ${req.met ? Styles.reqText__met : Styles.reqText__unmet}`}>
                  {req.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Success Banner */}
      {strength === 'strong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={Styles.successBanner}
        >
          <div className={Styles.successIconWrap}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5 }}>
              <FiCheck className={Styles.successIcon} />
            </motion.div>
          </div>
          <div className={Styles.successText}>
            <p className={Styles.successTitle}>Great password!</p>
            <p className={Styles.successSub}>Your account will be secure</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;