import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiYoutube } from 'react-icons/fi';
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import styles from './styles/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', path: '/#features' },
      { name: 'Courses', path: '/courses' },
      { name: 'Pricing', path: '/#pricing' },
      { name: 'Roadmap', path: '/#roadmap' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Blog', path: '/blog' },
      { name: 'Contact', path: '/contact' },
    ],
    resources: [
      { name: 'Documentation', path: '/docs' },
      { name: 'Help Center', path: '/help' },
      { name: 'Community', path: '/community' },
      { name: 'API', path: '/api' },
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
      { name: 'Refund Policy', path: '/refunds' },
    ],
  };

  const socialLinks = [
    { name: 'YouTube', icon: FiYoutube, url: 'https://www.youtube.com/@yourchannelname' },
    { name: 'Telegram', icon: FaTelegramPlane, url: 'https://t.me/yourusername' },
    { name: 'WhatsApp', icon: FaWhatsapp, url: 'https://whatsapp.com/channel/yourchannelid' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Main Footer Content */}
        <div className={styles.mainContent}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <Link to="/" className={styles.brandLink}>
              <div className={styles.logoIcon}>
                <span className={styles.logoText}>SL</span>
              </div>
              <span className={styles.brandTitle}>
                Successful Learning
              </span>
            </Link>
            <p className={styles.brandDescription}>
              Empowering learners worldwide with quality education and comprehensive courses.
            </p>
            {/* Social Links */}
            <div className={styles.socialLinks}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={social.name}
                >
                  <social.icon className={styles.socialIcon} />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Product</h3>
            <ul className={styles.linksList}>
              {footerLinks.product.map((link) => (
                <li key={link.name} className={styles.linkItem}>
                  <Link
                    to={link.path}
                    className={styles.link}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Company</h3>
            <ul className={styles.linksList}>
              {footerLinks.company.map((link) => (
                <li key={link.name} className={styles.linkItem}>
                  <Link
                    to={link.path}
                    className={styles.link}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Resources</h3>
            <ul className={styles.linksList}>
              {footerLinks.resources.map((link) => (
                <li key={link.name} className={styles.linkItem}>
                  <Link
                    to={link.path}
                    className={styles.link}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Legal</h3>
            <ul className={styles.linksList}>
              {footerLinks.legal.map((link) => (
                <li key={link.name} className={styles.linkItem}>
                  <Link
                    to={link.path}
                    className={styles.link}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className={styles.newsletter}>
          <div className={styles.newsletterContent}>
            <h3 className={styles.newsletterTitle}>
              Subscribe to our newsletter
            </h3>
            <p className={styles.newsletterDescription}>
              Get the latest updates on new courses and features.
            </p>
            <form className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.newsletterInput}
              />
              <button
                type="submit"
                className={styles.newsletterButton}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {currentYear} Successful Learning Platform. All rights reserved.
            </p>
            <p className={styles.madeWith}>
              Made with <FiHeart className={styles.heartIcon} /> for education
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;