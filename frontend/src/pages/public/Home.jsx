import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiBook,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';
import styles from './styles/Home.module.css';

const Home = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const features = [
    {
      icon: FiBook,
      title: 'Comprehensive Courses',
      description:
        'Access a wide range of courses with structured content, videos, quizzes, and hands-on projects.',
    },
    {
      icon: FiAward,
      title: 'Earn Certificates',
      description:
        'Get verified certificates upon course completion with unique QR codes for easy verification.',
    },
    {
      icon: FiUsers,
      title: 'Learn at Your Pace',
      description:
        'Flexible learning with progress tracking, resume from where you left, and lifetime access.',
    },
    {
      icon: FiTrendingUp,
      title: 'Track Your Progress',
      description:
        'Monitor your learning journey with detailed analytics and completion percentages.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '100+', label: 'Courses' },
    { value: '5,000+', label: 'Certificates Issued' },
    { value: '95%', label: 'Satisfaction Rate' },
  ];

  const benefits = [
    'Structured multi-level courses',
    'Interactive quizzes and assessments',
    'Hands-on projects and tasks',
    'Video lessons with progress tracking',
    'Community discussion forums',
    'Lifetime course access',
    'Mobile-friendly learning',
    'Expert instructor support',
  ];

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroGrid}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className={styles.heroContent}
            >
              <h1 className={styles.heroTitle}>
                Learn. Grow. Succeed.
              </h1>
              <p className={styles.heroSubtitle}>
                Master new skills with our comprehensive online courses and earn
                verified certificates
              </p>
              <div className={styles.heroButtons}>
                {isAuthenticated ? (
                  <Link
                    to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                    className={styles.heroPrimaryButton}
                  >
                    Go to Dashboard
                    <FiArrowRight className={styles.icon} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className={styles.heroPrimaryButton}
                    >
                      Get Started Free
                      <FiArrowRight className={styles.icon} />
                    </Link>
                    <Link
                      to="/courses"
                      className={styles.heroSecondaryButton}
                    >
                      Explore Courses
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={styles.heroImageWrapper}
            >
              <div className={styles.heroImageGlow}></div>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Students learning"
                className={styles.heroImage}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={styles.statItem}
              >
                <p className={styles.statValue}>
                  {stat.value}
                </p>
                <p className={styles.statLabel}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Why Choose Our Platform?
            </h2>
            <p className={styles.sectionSubtitle}>
              Everything you need for a successful learning journey
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={styles.featureCard}
              >
                <div className={styles.featureIcon}>
                  <feature.icon className={styles.featureIconSvg} />
                </div>
                <h3 className={styles.featureTitle}>
                  {feature.title}
                </h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefitsSection}>
        <div className={styles.benefitsContainer}>
          <div className={styles.benefitsGrid}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={styles.benefitsContent}
            >
              <h2 className={styles.benefitsTitle}>
                Everything You Need to Succeed
              </h2>
              <p className={styles.benefitsText}>
                Our platform offers a comprehensive learning experience with all
                the tools and resources you need to master new skills.
              </p>
              <div className={styles.benefitsList}>
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className={styles.benefitItem}
                  >
                    <FiCheckCircle className={styles.benefitIcon} />
                    <span className={styles.benefitText}>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={styles.benefitsImageWrapper}
            >
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Learning benefits"
                className={styles.benefitsImage}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={styles.ctaContent}
          >
            <h2 className={styles.ctaTitle}>
              Ready to Start Learning?
            </h2>
            <p className={styles.ctaText}>
              Join thousands of students already learning on our platform
            </p>
            {!isAuthenticated && (
              <Link
                to="/register"
                className={styles.ctaButton}
              >
                Create Free Account
                <FiArrowRight className={styles.icon} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;