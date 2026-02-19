import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiBook, 
  FiUser, 
  FiLogOut, 
  FiGrid, 
  FiAward,
  FiSettings,
  FiUsers,
  FiBarChart,
  FiShield
} from 'react-icons/fi';
import { getInitials, getAvatarColor } from '../../utils/formatters';
import styles from './styles/Navbar.module.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = isAuthenticated
    ? user?.role === 'admin'
      ? [
          { name: 'Dashboard', path: '/admin', icon: FiGrid },
          { name: 'Courses', path: '/admin/courses', icon: FiBook },
          { name: 'Students', path: '/admin/students', icon: FiUsers },
          { name: 'Analytics', path: '/admin/analytics', icon: FiBarChart },
        ]
      : [
          { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
          { name: 'Explore Courses', path: '/courses', icon: FiBook },
          { name: 'My Certificates', path: '/my-certificates', icon: FiAward },
          { name: 'Verify Certificate', path: '/verify-certificate', icon: FiShield },
        ]
    : [
        { name: 'Home', path: '/', icon: FiHome },
        { name: 'Courses', path: '/courses', icon: FiBook },
        { name: 'Verify Certificate', path: '/verify-certificate', icon: FiShield },
      ];

  const getAvatarClass = (name) => {
    const colorClass = getAvatarColor(name);
    const colorMap = {
      'bg-primary-500': styles.bgPrimary,
      'bg-secondary-500': styles.bgSecondary,
      'bg-green-500': styles.bgSuccess,
      'bg-yellow-500': styles.bgWarning,
      'bg-red-500': styles.bgDanger,
      'bg-blue-500': styles.bgInfo,
      'bg-purple-500': styles.bgPurple,
      'bg-pink-500': styles.bgPink,
    };
    return colorMap[colorClass] || styles.bgPrimary;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          {/* Logo */}
          <Link to="/" className={styles.logoLink}>
            <div className={styles.logoIcon}>
              <span className={styles.logoText}>SL</span>
            </div>
            <span className={`${styles.logoTitle} ${styles.logoTitleHidden}`}>
              Successfull Learning
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={styles.navLink}
              >
                <link.icon className={styles.navIcon} />
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className={styles.userSection}>
            {isAuthenticated ? (
              <div className={styles.relative}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={styles.userMenuButton}
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={`${styles.avatarPlaceholder} ${getAvatarClass(user?.name)}`}>
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>
                      {user?.name}
                    </p>
                    <p className={styles.userRole}>
                      {user?.role}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={styles.dropdownMenu}
                    >
                      {user?.role === 'student' && (
                        <Link
                          to="/profile"
                          className={styles.dropdownLink}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FiUser className={styles.dropdownIcon} />
                          <span>My Profile</span>
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className={styles.dropdownLink}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FiSettings className={styles.dropdownIcon} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <hr className={styles.dropdownDivider} />
                      <button
                        onClick={handleLogout}
                        className={styles.logoutButton}
                      >
                        <FiLogOut className={styles.dropdownIcon} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link
                  to="/login"
                  className={styles.loginLink}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={styles.registerButton}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className={styles.mobileMenuButton}
          >
            {isOpen ? (
              <FiX className={styles.mobileMenuIcon} />
            ) : (
              <FiMenu className={styles.mobileMenuIcon} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={styles.mobileMenu}
          >
            <div className={styles.mobileMenuContent}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={toggleMenu}
                  className={styles.mobileNavLink}
                >
                  <link.icon className={styles.navIcon} />
                  <span>{link.name}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <hr className={styles.mobileDivider} />
                  <div className={styles.mobileUserInfo}>
                    {user?.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={user.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={`${styles.avatarPlaceholder} ${getAvatarClass(user?.name)}`}>
                        {getInitials(user?.name)}
                      </div>
                    )}
                    <div className={styles.mobileUserDetails}>
                      <p className={styles.mobileUserName}>
                        {user?.name}
                      </p>
                      <p className={styles.mobileUserRole}>
                        {user?.role}
                      </p>
                    </div>
                  </div>
                  {user?.role === 'student' && (
                    <Link
                      to="/profile"
                      onClick={toggleMenu}
                      className={styles.mobileNavLink}
                    >
                      <FiUser className={styles.navIcon} />
                      <span>My Profile</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className={styles.mobileLogoutButton}
                  >
                    <FiLogOut className={styles.navIcon} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <hr className={styles.mobileDivider} />
                  <Link
                    to="/login"
                    onClick={toggleMenu}
                    className={styles.mobileLoginLink}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={toggleMenu}
                    className={styles.mobileRegisterButton}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;