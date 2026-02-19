import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../redux/slices/authSlice';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import Confetti from 'react-confetti';
import PasswordStrengthIndicator from '../../pages/auth/components/PasswordStrengthIndicator';
import { isPasswordValid } from '../../utils/passwordStrength';
import styles from './styles/Register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated && user) {
      // Show confetti on successful registration
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        navigate('/dashboard');
      }, 3000);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Clear errors on unmount
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid(formData.password)) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    await dispatch(register(registerData));
  };

  return (
    <div className={styles.container}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.wrapper}
      >
        {/* Header */}
        <div className={styles.header}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={styles.logoContainer}
          >
            <span className={styles.logoText}>L</span>
          </motion.div>
          <h2 className={styles.title}>Create your account</h2>
          <p className={styles.subtitle}>
            Start your learning journey today
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.card}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.errorMessage}
            >
              <p className={styles.errorText}>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Name Field */}
            <div className={styles.formGroup}>
              <label
                htmlFor="name"
                className={styles.label}
              >
                Full Name
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <FiUser className={styles.inputIconSvg} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorFieldMessage}
                >
                  {errors.name}
                </motion.p>
              )}
            </div>

            {/* Email Field */}
            <div className={styles.formGroup}>
              <label
                htmlFor="email"
                className={styles.label}
              >
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <FiMail className={styles.inputIconSvg} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorFieldMessage}
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <label
                htmlFor="password"
                className={styles.label}
              >
                Password
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <FiLock className={styles.inputIconSvg} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.inputWithRightIcon} ${
                    errors.password ? styles.inputError : ''
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePassword}
                >
                  {showPassword ? (
                    <FiEyeOff className={styles.togglePasswordIcon} />
                  ) : (
                    <FiEye className={styles.togglePasswordIcon} />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorFieldMessage}
                >
                  {errors.password}
                </motion.p>
              )}
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label
                htmlFor="confirmPassword"
                className={styles.label}
              >
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <FiLock className={styles.inputIconSvg} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.inputWithRightIcon} ${
                    errors.confirmPassword ? styles.inputError : ''
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.togglePassword}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className={styles.togglePasswordIcon} />
                  ) : (
                    <FiEye className={styles.togglePasswordIcon} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorFieldMessage}
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.passwordMatch}
                  >
                    <FiCheck className={styles.passwordMatchIcon} />
                    <span className={styles.passwordMatchText}>Passwords match</span>
                  </motion.div>
                )}
            </div>

            {/* Terms and Conditions */}
            <div className={styles.formGroup}>
              <div className={styles.termsContainer}>
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="terms" className={styles.termsLabel}>
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className={styles.termsLink}
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className={styles.termsLink}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorFieldMessage}
                >
                  {errors.terms}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? (
                <div className={styles.loadingContent}>
                  <div className={styles.spinner} />
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className={styles.signInSection}>
            <p className={styles.signInText}>
              Already have an account?{' '}
              <Link
                to="/login"
                className={styles.signInLink}
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;