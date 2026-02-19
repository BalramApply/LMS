import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import {
  checkPasswordStrength,
  getStrengthColor,
  getStrengthTextColor,
} from '../../../utils/passwordStrength';
import Styles from './styles/PasswordStrengthIndicator.module.css';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const { strength, score, feedback } = checkPasswordStrength(password);

  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      text: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      text: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      text: 'One number',
      met: /\d/.test(password),
    },
    {
      text: 'One special character (@$!%*?&#)',
      met: /[@$!%*?&#]/.test(password),
    },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-600">
            Password Strength
          </span>
          <span
            className={`text-xs font-semibold capitalize ${getStrengthTextColor(
              strength
            )}`}
          >
            {strength}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getStrengthColor(strength)} rounded-full`}
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
          className="space-y-2"
        >
          <p className="text-xs font-medium text-gray-600">Requirements:</p>
          <div className="space-y-1">
            {requirements.map((req, index) => (
              <motion.div
                key={req.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-2"
              >
                <div
                  className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors ${
                    req.met
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {req.met ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <FiCheck className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <FiX className="w-3 h-3" />
                  )}
                </div>
                <span
                  className={`text-xs ${
                    req.met ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {req.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Success Animation */}
      {strength === 'strong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FiCheck className="w-5 h-5 text-white" />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">
              Great password!
            </p>
            <p className="text-xs text-green-600">
              Your account will be secure
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;