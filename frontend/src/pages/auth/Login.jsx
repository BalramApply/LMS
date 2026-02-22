import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../redux/slices/authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from './styles/Login.module.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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

    await dispatch(login(formData));
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <span className={styles.logoText}>L</span>
          </div>
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Form */}
        <div className={styles.card}>
          {error && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Field */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
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
                  className={`${styles.input} ${
                    errors.email ? styles.inputError : ''
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className={styles.errorFieldMessage}>{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
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
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.inputWithRightIcon} ${
                    errors.password ? styles.inputError : ''
                  }`}
                  placeholder="Enter your password"
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
                <p className={styles.errorFieldMessage}>{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={styles.rememberForgotRow}>
              <div className={styles.rememberMe}>
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={styles.checkbox}
                />
                <label htmlFor="remember-me" className={styles.checkboxLabel}>
                  Remember me
                </label>
              </div>

              <div>
                <Link to="/forgot-password" className={styles.forgotPassword}>
                  Forgot password?
                </Link>
              </div>
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
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <div className={styles.dividerBorder} />
            </div>
            <div className={styles.dividerText}>
              <span className={styles.dividerTextInner}>
                New to LMS Platform?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className={styles.signupSection}>
            <Link to="/register" className={styles.signupButton}>
              Create an account
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        {/* <div className={styles.demoCard}>
          <p className={styles.demoTitle}>Demo Credentials:</p>
          <div className={styles.demoCredentials}>
            <p>
              <strong>Admin:</strong> admin@lms.com / Admin@123456
            </p>
            <p>
              <strong>Student:</strong> student@test.com / Test@123456
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Login;