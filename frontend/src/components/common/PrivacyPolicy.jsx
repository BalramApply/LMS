import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiChevronRight } from 'react-icons/fi';
import styles from './styles/PolicyPage.module.css';

const lastUpdated = 'March 1, 2025';

const sections = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: `We collect information you provide directly to us and information generated as you use our platform.

**Information you provide:** When you create an account, we collect your name, email address, and password. If you purchase a course, we collect payment information (processed securely via our payment provider — we do not store card details). Profile information such as a profile photo and bio is optional.

**Information collected automatically:** When you use Successful Learning, we automatically collect log data (IP address, browser type, pages visited, time spent), device information, and cookies or similar tracking technologies to understand how you use the platform and improve your experience.

**Information from third parties:** If you sign in with Google or another third-party provider, we receive basic profile information (name, email, profile photo) from that service.`,
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve the Successful Learning platform
• Process enrollments and payments
• Send you course updates, newsletters, and promotional communications (you may opt out at any time)
• Personalise your learning experience and recommend relevant courses
• Issue and verify certificates of completion
• Respond to your comments, questions, and support requests
• Monitor and analyse usage trends to improve platform performance
• Comply with legal obligations and enforce our Terms of Service`,
  },
  {
    id: 'information-sharing',
    title: 'Sharing of Information',
    content: `We do not sell, rent, or trade your personal information to third parties. We may share your information in the following circumstances:

**Service providers:** We share information with trusted vendors who assist us in operating the platform (e.g., payment processors, email delivery services, cloud hosting). These providers are contractually obligated to protect your data.

**Legal requirements:** We may disclose your information if required to do so by law, or in response to a valid legal process (e.g., court order or government request).

**Business transfers:** In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your information is transferred and becomes subject to a different privacy policy.

**With your consent:** We may share information with third parties when you give us explicit permission to do so.`,
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. If you request deletion of your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or compliance purposes (e.g., financial records for tax purposes, which we retain for 7 years as required by Indian law).

Course completion records and certificates are retained indefinitely to support certificate verification, even after account deletion.`,
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking',
    content: `We use cookies and similar technologies (local storage, session storage) to:

• Keep you logged in across sessions
• Remember your preferences
• Analyse platform usage via analytics tools
• Deliver relevant content

You can control cookies through your browser settings. However, disabling cookies may affect some functionality of the platform. We do not use cookies for third-party advertising.`,
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: `You have the following rights regarding your personal data:

**Access:** You may request a copy of the personal data we hold about you.

**Correction:** You may update or correct inaccurate information through your profile settings or by contacting us.

**Deletion:** You may request deletion of your account and personal data, subject to retention obligations outlined above.

**Portability:** You may request your data in a structured, machine-readable format.

**Objection:** You may opt out of marketing communications at any time by clicking "Unsubscribe" in any email or by contacting us.

To exercise any of these rights, please email us at privacy@successfullearning.in.`,
  },
  {
    id: 'security',
    title: 'Security',
    content: `We implement industry-standard security measures including HTTPS encryption, hashed passwords, and access controls to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. We encourage you to use a strong, unique password and to contact us immediately if you suspect unauthorized access to your account.`,
  },
  {
    id: 'children',
    title: "Children's Privacy",
    content: `Successful Learning is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected such information, we will promptly delete it. Parents or guardians who believe their child has provided personal information should contact us at privacy@successfullearning.in.`,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of the page and, for significant changes, notify you by email or a prominent notice on the platform. We encourage you to review this policy periodically.`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

Email: privacy@successfullearning.in
Platform: successfullearning.in/contact

Successful Learning
Gurugram Haryana, India`,
  },
];

const PrivacyPolicy = () => {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const renderContent = (text) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} className={styles.bold}>{line.slice(2, -2)}</strong>;
      }
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className={styles.para}>
            {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
          </p>
        );
      }
      if (line.startsWith('•')) {
        return <p key={i} className={styles.bullet}>{line}</p>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className={styles.para}>{line}</p>;
    });

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.heroIcon}><FiShield /></div>
            <h1 className={styles.heroTitle}>Privacy Policy</h1>
            <p className={styles.heroSubtitle}>
              Your privacy matters to us. This policy explains how Successful Learning collects,
              uses, and protects your personal information.
            </p>
            <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.contentGrid}>
            {/* Sidebar TOC */}
            <aside className={styles.sidebar}>
              <p className={styles.tocTitle}>Contents</p>
              <nav className={styles.toc}>
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`${styles.tocLink} ${active === s.id ? styles.tocActive : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <FiChevronRight className={styles.tocChevron} />
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
              {sections.map((s, i) => (
                <motion.div
                  key={s.id}
                  id={s.id}
                  className={styles.section}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                >
                  <h2 className={styles.sectionTitle}>{s.title}</h2>
                  <div className={styles.sectionBody}>{renderContent(s.content)}</div>
                </motion.div>
              ))}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;