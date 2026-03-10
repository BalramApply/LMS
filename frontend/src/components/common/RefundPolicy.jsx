import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { Link } from 'react-router-dom';
import { FiRotateCcw, FiChevronRight, FiCheckCircle, FiXCircle, FiMail } from 'react-icons/fi';
import styles from './styles/PolicyPage.module.css';
import refundStyles from './styles/RefundPolicy.module.css';

const lastUpdated = 'March 1, 2025';

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    content: `At Successful Learning, we want you to be fully satisfied with your purchase. If a course does not meet your expectations, we offer a 7-day refund window under the conditions described in this policy.

Please read this policy carefully before making a purchase. By purchasing a course on our Platform, you agree to the terms outlined here.`,
  },
  {
    id: 'eligibility',
    title: 'Refund Eligibility',
    content: `You are eligible for a full refund if all of the following conditions are met:

• You submit your refund request within 7 days of the original purchase date
• You have completed no more than 20% of the course content
• The course was purchased directly on successfullearning.in (not via a third-party platform or reseller)
• You have not previously requested a refund for the same course

We reserve the right to deny refund requests that do not meet all of the above criteria.`,
  },
  {
    id: 'non-refundable',
    title: 'Non-Refundable Items',
    content: `The following purchases are not eligible for refunds under any circumstances:

• Courses where more than 20% of the content has been accessed or completed
• Refund requests submitted more than 7 days after the purchase date
• Mock test packs or standalone assessment purchases
• Courses purchased using promotional credits, vouchers, or as part of a bundle (unless the entire bundle is within the refund window and no content has been accessed)
• Courses gifted to another user

In exceptional circumstances (e.g., accidental duplicate purchase), we may make exceptions at our sole discretion.`,
  },
  {
    id: 'how-to-request',
    title: 'How to Request a Refund',
    content: `To initiate a refund, please follow these steps:

**Step 1:** Email us at refunds@successfullearning.in with the subject line "Refund Request — [Your Name] — [Course Name]".

**Step 2:** Include the following details in your email:
• Your registered email address
• The course name and order/invoice ID (found in your purchase confirmation email)
• The reason for your refund request

**Step 3:** Our support team will review your request and respond within 2–3 business days. We may ask for additional information if needed.

**Step 4:** If approved, the refund will be processed within 5–7 business days. Depending on your bank or payment provider, it may take an additional 3–5 business days for the amount to reflect in your account.`,
  },
  {
    id: 'refund-process',
    title: 'Refund Processing',
    content: `Approved refunds are returned to the original payment method used for the purchase:

• **Credit/Debit Card:** Refunded to the original card within 5–7 business days
• **UPI / Net Banking:** Refunded to the source account within 5–7 business days
• **Wallet Payments:** Refunded to the originating wallet within 3–5 business days

We do not issue refunds in cash or via bank transfer to a different account than was used for the original payment. Platform credits (non-withdrawable) may be offered as an alternative in certain cases.

Note: Transaction fees or charges levied by payment gateways are non-refundable.`,
  },
  {
    id: 'cancellations',
    title: 'Cancellations',
    content: `**Before Purchase:** There is no cancellation required before a purchase. You are only charged when you confirm a transaction.

**After Purchase:** You may cancel your access to a course by submitting a refund request within the 7-day eligibility window (see Refund Eligibility). After the window closes, cancellations are not applicable as you retain lifetime access to the enrolled course.

**Account Deletion:** If you delete your account, your course enrollment data will be removed and you will lose access to all enrolled courses. Account deletions do not automatically trigger a refund. Ensure you submit any eligible refund requests before deleting your account.`,
  },
  {
    id: 'disputed-charges',
    title: 'Disputed Charges',
    content: `If you believe you were charged incorrectly (e.g., double charge, charge for a course you did not purchase), please contact us at refunds@successfullearning.in within 14 days of the transaction.

We strongly encourage you to contact us directly before initiating a chargeback with your bank. Unauthorized chargebacks may result in the suspension of your account. We cooperate fully with payment disputes and will work to resolve issues promptly.`,
  },
  {
    id: 'policy-changes',
    title: 'Changes to This Policy',
    content: `We may update this Refund & Cancellation Policy from time to time. Changes will be effective upon posting to this page with a revised "Last Updated" date. For purchases made before any policy changes, the policy in effect at the time of purchase will apply.`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `For refund requests or questions about this policy:

Email: refunds@successfullearning.in
Support: successfullearning.in/contact

Our support team is available Monday – Saturday, 9 AM – 6 PM IST.`,
  },
];

const RefundPolicy = () => {
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
            <div className={styles.heroIcon}><FiRotateCcw /></div>
            <h1 className={styles.heroTitle}>Refund & Cancellation Policy</h1>
            <p className={styles.heroSubtitle}>
              We stand behind our courses. If you're not satisfied, here's everything you need to know about getting a refund.
            </p>
            <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          </motion.div>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <section className={refundStyles.summarySection}>
        <div className={styles.container}>
          <div className={refundStyles.summaryGrid}>
            <motion.div
              className={`${refundStyles.summaryCard} ${refundStyles.green}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className={refundStyles.scanLine} />
              <div className={refundStyles.summaryIcon}><FiCheckCircle /></div>
              <h3 className={refundStyles.summaryTitle}>You're Eligible If</h3>
              <ul className={refundStyles.summaryList}>
                <li>Request within <strong>7 days</strong> of purchase</li>
                <li>Less than <strong>20% course</strong> completed</li>
                <li>Purchased directly on our site</li>
                <li>First refund request for this course</li>
              </ul>
            </motion.div>
            <motion.div
              className={`${refundStyles.summaryCard} ${refundStyles.red}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className={refundStyles.scanLine} />
              <div className={refundStyles.summaryIcon}><FiXCircle /></div>
              <h3 className={refundStyles.summaryTitle}>Not Eligible For</h3>
              <ul className={refundStyles.summaryList}>
                <li>Requests after 7-day window</li>
                <li>More than 20% course accessed</li>
                <li>Mock test or bundle purchases</li>
                <li>Promotional / voucher purchases</li>
              </ul>
            </motion.div>
            <motion.div
              className={`${refundStyles.summaryCard} ${refundStyles.blue}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className={refundStyles.scanLine} />
              <div className={refundStyles.summaryIcon}><FiMail /></div>
              <h3 className={refundStyles.summaryTitle}>How to Request</h3>
              <ul className={refundStyles.summaryList}>
                <li>Email <strong>refunds@successfullearning.in</strong></li>
                <li>Include order ID & reason</li>
                <li>Response within <strong>2–3 business days</strong></li>
                <li>Refund in <strong>5–7 business days</strong></li>
              </ul>
            </motion.div>
          </div>
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

export default RefundPolicy;