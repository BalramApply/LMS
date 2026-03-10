import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiChevronRight } from 'react-icons/fi';
import styles from './styles/PolicyPage.module.css';

const lastUpdated = 'March 1, 2025';

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: `By accessing or using the Successful Learning platform ("Platform", "we", "us", "our"), you ("User", "you") agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Platform.

These Terms apply to all visitors, registered users, and purchasers of courses on successfullearning.in. We reserve the right to update these Terms at any time, and continued use of the Platform after any changes constitutes acceptance of the revised Terms.`,
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    content: `To access most features of the Platform, you must create an account. By creating an account, you agree to:

• Provide accurate, current, and complete information during registration
• Maintain the security and confidentiality of your account credentials
• Notify us immediately of any unauthorized use of your account
• Accept responsibility for all activities that occur under your account

You must be at least 13 years old to create an account. If you are under 18, a parent or guardian must review and agree to these Terms on your behalf. We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    id: 'courses-enrollment',
    title: 'Courses & Enrollment',
    content: `**Free Courses:** Some courses are available free of charge and can be accessed by any registered user.

**Paid Courses:** Paid courses require purchase before access is granted. All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Prices are subject to change at any time.

**Lifetime Access:** Upon purchase, you receive lifetime access to the enrolled course content, subject to the continued availability of the Platform. We do not guarantee that specific courses will remain available indefinitely.

**Course Content Updates:** We strive to keep course content current. However, we do not guarantee that all course material will be updated in real time as laws, technologies, or best practices evolve.

**Prohibited Use:** You may not reproduce, redistribute, sell, or share course content with individuals who have not enrolled. Doing so is a violation of our intellectual property rights and may result in immediate account termination.`,
  },
  {
    id: 'certificates',
    title: 'Certificates',
    content: `Upon successful completion of a course (including all assessments, if applicable), you will receive a digital Certificate of Completion.

Certificates are issued based on the information provided in your account profile. It is your responsibility to ensure your name and details are accurate before completion.

Successful Learning certificates are not equivalent to formal academic qualifications or professional licences unless explicitly stated. We do not guarantee employment outcomes resulting from the completion of any course.

Certificate verification is available at successfullearning.in/verify-certificate using the unique certificate ID.`,
  },
  {
    id: 'mock-tests',
    title: 'Mock Tests',
    content: `Mock tests are provided for educational and practice purposes only. Results from mock tests on the Platform do not predict, guarantee, or represent actual exam performance.

Attempting to manipulate, share, or exploit test questions outside the Platform is strictly prohibited and may result in account termination. Mock test content is proprietary and protected by intellectual property laws.`,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    content: `All content on the Successful Learning Platform, including course videos, notes, assessments, graphics, logos, and software, is owned by Successful Learning or its content partners and is protected by applicable copyright, trademark, and intellectual property laws.

You are granted a limited, non-exclusive, non-transferable licence to access and view course content solely for your personal, non-commercial, educational use. You may not:

• Download, copy, or distribute course content without written permission
• Create derivative works from our content
• Use our trademarks or branding without prior written consent
• Reverse engineer or attempt to extract source code from our software`,
  },
  {
    id: 'user-conduct',
    title: 'User Conduct',
    content: `You agree not to use the Platform to:

• Violate any applicable laws or regulations
• Post or transmit any content that is abusive, harassing, defamatory, or obscene
• Impersonate any person or entity
• Upload or transmit malicious code, viruses, or any software designed to harm the Platform
• Attempt to gain unauthorized access to any part of the Platform or other users' accounts
• Engage in commercial solicitation or spam
• Interfere with or disrupt the integrity or performance of the Platform

We reserve the right to investigate and take appropriate legal action against any person who, in our sole discretion, violates these provisions.`,
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers & Limitation of Liability',
    content: `The Platform and its content are provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses.

To the maximum extent permitted by law, Successful Learning shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform, including but not limited to loss of data, loss of profits, or loss of goodwill.

Our total liability to you for any claim arising from your use of the Platform shall not exceed the amount you paid to us in the 12 months preceding the claim.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law & Disputes',
    content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in [Your City], India.

Before initiating any legal action, you agree to contact us at legal@successfullearning.in to attempt to resolve the dispute amicably within 30 days.`,
  },
  {
    id: 'termination',
    title: 'Termination',
    content: `We may suspend or terminate your account at our discretion if you breach these Terms, engage in fraudulent activity, or for any other reason we deem appropriate with or without prior notice.

Upon termination, your right to access the Platform and its content will immediately cease. Provisions that by their nature should survive termination (including intellectual property rights, disclaimers, and limitation of liability) shall survive.

You may also delete your account at any time through your profile settings or by contacting support@successfullearning.in.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `For questions regarding these Terms, please contact us:

Email: legal@successfullearning.in
Website: successfullearning.in/contact

Successful Learning
[Your Address], India`,
  },
];

const TermsConditions = () => {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
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
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className={styles.para}>
            {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
          </p>
        );
      }
      if (line.startsWith('•')) return <p key={i} className={styles.bullet}>{line}</p>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className={styles.para}>{line}</p>;
    });

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.heroIcon}><FiFileText /></div>
            <h1 className={styles.heroTitle}>Terms & Conditions</h1>
            <p className={styles.heroSubtitle}>
              Please read these Terms carefully before using the Successful Learning platform. They govern your access and use of our services.
            </p>
            <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          </motion.div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.contentGrid}>
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

export default TermsConditions;