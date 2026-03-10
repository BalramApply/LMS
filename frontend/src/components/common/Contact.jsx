import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiMail,
  FiMessageSquare,
  FiYoutube,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import styles from './styles/Contact.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const channels = [
  {
    icon: FiMail,
    label: 'Email Us',
    value: 'support@successfullearning.in',
    href: 'mailto:support@successfullearning.in',
    color: '#4f46e5',
    bg: '#ede9fe',
  },
  {
    icon: FaWhatsapp,
    label: 'WhatsApp',
    value: 'Chat with us directly',
    href: 'https://chat.whatsapp.com/Ho6FX1ERGLi2DKc0tqOSAX',
    color: '#059669',
    bg: '#d1fae5',
  },
  {
    icon: FaTelegramPlane,
    label: 'Telegram',
    value: 'Join our channel',
    href: 'https://t.me/yourusername',
    color: '#0ea5e9',
    bg: '#e0f2fe',
  },
  {
    icon: FiYoutube,
    label: 'YouTube',
    value: 'Watch free lessons',
    href: 'https://www.youtube.com/@SuccessFullearningOfficial',
    color: '#dc2626',
    bg: '#fee2e2',
  },
];

const faqs = [
  {
    q: 'How do I enroll in a course?',
    a: 'Simply create a free account, browse our course catalog, and click "Enroll". Paid courses can be purchased securely via our checkout.',
  },
  {
    q: 'Are the certificates recognized?',
    a: 'Yes. Successful Learning certificates include a unique verification ID and can be verified by anyone at successfullearning.in/verify-certificate.',
  },
  {
    q: 'Can I get a refund if I\'m not satisfied?',
    a: 'We offer a 7-day refund policy for paid courses. Please refer to our Refund Policy page for detailed terms.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Click "Forgot Password" on the login page and follow the instructions sent to your registered email.',
  },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setStatus(null);

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: process.env.REACT_APP_WEB3FORMS_KEY,
        ...form,
      }),
    });
    const data = await response.json();
    setStatus(data.success ? 'success' : 'error');
    if (data.success) setForm({ name: '', email: '', subject: '', message: '' });
  } catch {
    setStatus('error');
  } finally {
    setLoading(false);
  }
};

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
            <span className={styles.badge}>Get In Touch</span>
            <h1 className={styles.heroTitle}>We're Here to Help</h1>
            <p className={styles.heroSubtitle}>
              Have a question, feedback, or need support? Reach out through any channel — our team typically responds within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Channels */}
      <section className={styles.channelsSection}>
        <div className={styles.container}>
          <div className={styles.channelsGrid}>
            {channels.map((ch, i) => (
              <motion.a
                key={ch.label}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelCard}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div
                  className={styles.channelIcon}
                  style={{ background: ch.bg, color: ch.color }}
                >
                  <ch.icon />
                </div>
                <div>
                  <p className={styles.channelLabel}>{ch.label}</p>
                  <p className={styles.channelValue}>{ch.value}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className={styles.mainSection}>
        <div className={styles.container}>
          <div className={styles.mainGrid}>
            {/* Form */}
            <motion.div
              className={styles.formBox}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className={styles.formTitle}>Send a Message</h2>
              <p className={styles.formSubtitle}>Fill out the form and we'll get back to you shortly.</p>

              {status === 'success' && (
                <div className={styles.successBanner}>
                  <FiCheckCircle />
                  <span>Message sent! We'll reply within 24 hours.</span>
                </div>
              )}
              {status === 'error' && (
                <div className={styles.errorBanner}>
                  <FiAlertCircle />
                  <span>Something went wrong. Please try again.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* web3Forms config */}
                <input type="hidden" name="access_key" value="8a91f185-efd4-442b-85da-ba7fc1198364" />
                <input type="hidden" name="subject" value="New Contact Form Submission — Successful Learning" />
                <input type="hidden" name="from_name" value="Successful Learning Website" />
                {/* Honeypot spam protection */}
                <input type="checkbox" name="botcheck" style={{ display: 'none' }} />
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us more..."
                    required
                    rows={5}
                    className={styles.textarea}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <>
                      <FiSend />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* FAQ */}
            <motion.div
              className={styles.faqBox}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              variants={fadeUp}
            >
              <h2 className={styles.faqTitle}>
                <FiMessageSquare />
                Common Questions
              </h2>
              <div className={styles.faqList}>
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}
                  >
                    <button
                      className={styles.faqQuestion}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{faq.q}</span>
                      <span className={styles.faqChevron}>
                        {openFaq === i ? '−' : '+'}
                      </span>
                    </button>
                    {openFaq === i && (
                      <motion.p
                        className={styles.faqAnswer}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {faq.a}
                      </motion.p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;