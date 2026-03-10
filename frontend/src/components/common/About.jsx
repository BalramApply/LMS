import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiTarget,
  FiUsers,
  FiAward,
  FiBookOpen,
  FiStar,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import styles from './styles/About.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const stats = [
  { value: '1000+', label: 'Active Learners', icon: FiUsers },
  { value: '100+', label: 'Expert-led Courses', icon: FiBookOpen },
  { value: '95%', label: 'Completion Rate', icon: FiCheckCircle },
  { value: '500+', label: 'Certificates Issued', icon: FiAward },
];

const team = [
  {
    name: 'Balram Patel',
    role: 'Founder & Lead Educator',
    initials: 'BP',
    color: '#4f46e5',
    bio: 'A passionate educator with 10+ years of experience in e-learning and curriculum design.',
  },
  {
    name: 'Priya Mehta',
    role: 'Head of Curriculum',
    initials: 'PM',
    color: '#0891b2',
    bio: 'Expert in instructional design, ensuring every course delivers real-world value.',
  },
  {
    name: 'Rahul Verma',
    role: 'Tech Lead',
    initials: 'RV',
    color: '#059669',
    bio: 'Full-stack developer who built and continues to evolve the Successful Learning platform.',
  },
];

const values = [
  {
    icon: FiTarget,
    title: 'Outcome-Focused',
    desc: 'Every course is designed with your career goals in mind — practical, applicable, and results-driven.',
  },
  {
    icon: FiStar,
    title: 'Quality First',
    desc: 'We meticulously vet every instructor and piece of content to ensure you get the very best.',
  },
  {
    icon: FiUsers,
    title: 'Community-Driven',
    desc: 'Learning is better together. Our community of students and mentors supports every step of your journey.',
  },
  {
    icon: FiAward,
    title: 'Recognized Excellence',
    desc: 'Our certificates are valued by employers and institutions — proof of your hard-earned skills.',
  },
];

const About = () => {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <span className={styles.badge}>Our Story</span>
            <h1 className={styles.heroTitle}>
              Education That <br />
              <em className={styles.accent}>Actually Works</em>
            </h1>
            <p className={styles.heroSubtitle}>
              Successful Learning was built on a single belief — that quality education should be
              accessible, practical, and empowering for every learner, regardless of background.
            </p>
            <Link to="/courses" className={styles.heroBtn}>
              Explore Our Courses <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={styles.statCard}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <stat.icon className={styles.statIcon} />
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.missionSection}>
        <div className={styles.container}>
          <div className={styles.missionGrid}>
            <motion.div
              className={styles.missionText}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <span className={styles.sectionBadge}>Our Mission</span>
              <h2 className={styles.sectionTitle}>
                Transforming Lives Through Learning
              </h2>
              <p className={styles.sectionBody}>
                We started Successful Learning because we saw a gap — learners hungry to grow but
                overwhelmed by low-quality content and inaccessible resources. Our platform bridges
                that gap with structured, mentor-backed courses that take you from where you are to
                where you want to be.
              </p>
              <p className={styles.sectionBody}>
                From competitive exam preparation to professional skill-building, every program on
                our platform is crafted to deliver real, measurable outcomes.
              </p>
            </motion.div>
            <motion.div
              className={styles.missionVisual}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.visualCard}>
                <div className={styles.visualOrb} />
                <p className={styles.visualQuote}>
                  "The goal is not just to pass an exam — it's to become someone who truly
                  understands."
                </p>
                <p className={styles.visualAuthor}>— Balram Patel, Founder</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className={styles.sectionBadge}>What We Stand For</span>
            <h2 className={styles.sectionTitle}>Our Core Values</h2>
          </motion.div>
          <div className={styles.valuesGrid}>
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                className={styles.valueCard}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={styles.valueIconWrap}>
                  <v.icon className={styles.valueIcon} />
                </div>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={styles.teamSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className={styles.sectionBadge}>The People Behind It</span>
            <h2 className={styles.sectionTitle}>Meet Our Team</h2>
          </motion.div>
          <div className={styles.teamGrid}>
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                className={styles.teamCard}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div
                  className={styles.teamAvatar}
                  style={{ background: member.color }}
                >
                  {member.initials}
                </div>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p className={styles.teamBio}>{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.ctaBox}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className={styles.ctaTitle}>Ready to Start Learning?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of learners already transforming their futures on Successful Learning.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/register" className={styles.ctaPrimary}>
                Get Started Free
              </Link>
              <Link to="/courses" className={styles.ctaSecondary}>
                Browse Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;