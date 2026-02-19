import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiCheckCircle, FiXCircle, FiAward, FiUser, FiBook, FiCalendar } from 'react-icons/fi';
import api from '../../api/client';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import styles from './styles/VerifyCertificate.module.css';

const VerifyCertificate = () => {
  const { certificateId: paramId } = useParams();
  const [certificateId, setCertificateId] = useState(paramId || '');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setCertificate(null);
    setVerified(false);

    try {
      const response = await api.get(`/certificates/verify/${certificateId.trim()}`);
      setCertificate(response.data.data);
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Scanline overlay */}
      <div className={styles.scanlines} aria-hidden="true" />
      {/* Grid bg */}
      <div className={styles.gridBg} aria-hidden="true" />

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div className={styles.iconWrap}>
            <FiAward className={styles.headerIcon} />
            <div className={styles.iconGlow} aria-hidden="true" />
          </div>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>{'//'}</span> VERIFY CERTIFICATE
          </h1>
          <p className={styles.subtitle}>
            Enter a certificate ID to authenticate its origin
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.formCard}
        >
          <form onSubmit={handleVerify} className={styles.form}>
            <div className={styles.inputWrap}>
              <FiSearch className={styles.inputIcon} />
              <input
                type="text"
                value={certificateId}
                onChange={(e) => {
                  setCertificateId(e.target.value);
                  setError('');
                }}
                placeholder="LMS-2026-XXXXXX"
                className={styles.input}
              />
              <div className={styles.inputCornerTL} aria-hidden="true" />
              <div className={styles.inputCornerBR} aria-hidden="true" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={styles.verifyBtn}
            >
              <FiSearch className={styles.btnIcon} />
              {loading ? 'VERIFYING...' : 'VERIFY'}
            </button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.errorBox}
            >
              <FiXCircle className={styles.errorIcon} />
              <div>
                <p className={styles.errorTitle}>VERIFICATION FAILED</p>
                <p className={styles.errorMsg}>{error}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className={styles.loaderWrap}>
            <Loader />
          </div>
        )}

        {/* Certificate Details */}
        {verified && certificate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Success Banner */}
            <div className={styles.successBanner}>
              <div className={styles.successIconWrap}>
                <FiCheckCircle className={styles.successIcon} />
              </div>
              <div>
                <h2 className={styles.successTitle}>CERTIFICATE VERIFIED</h2>
                <p className={styles.successSubtitle}>
                  Valid certificate issued by{' '}
                  <span className={styles.successHighlight}>
                    {certificate.platformName || 'LMS Platform'}
                  </span>
                </p>
              </div>
              <div className={styles.successGlow} aria-hidden="true" />
            </div>

            {/* Certificate Info Card */}
            <div className={styles.certCard}>
              <div className={styles.certCardHeader}>
                <span className={styles.certCardLabel}>CERTIFICATE DATA</span>
                <div className={styles.certCardLine} aria-hidden="true" />
              </div>

              <div className={styles.certGrid}>
                {/* Student Name */}
                <div className={styles.certField}>
                  <div className={styles.certFieldLabel}>
                    <FiUser className={styles.fieldIcon} />
                    Student Name
                  </div>
                  <p className={styles.certFieldValue}>{certificate.studentName}</p>
                </div>

                {/* Course Name */}
                <div className={styles.certField}>
                  <div className={styles.certFieldLabel}>
                    <FiBook className={styles.fieldIcon} />
                    Course Name
                  </div>
                  <p className={styles.certFieldValue}>{certificate.courseName}</p>
                </div>

                {/* Issue Date */}
                <div className={styles.certField}>
                  <div className={styles.certFieldLabel}>
                    <FiCalendar className={styles.fieldIcon} />
                    Issue Date
                  </div>
                  <p className={styles.certFieldValueMd}>
                    {formatDate(certificate.issueDate || certificate.issuedAt, 'PPP')}
                  </p>
                </div>

                {/* Completion Date */}
                {certificate.completionDate && (
                  <div className={styles.certField}>
                    <div className={styles.certFieldLabel}>
                      <FiCalendar className={styles.fieldIcon} />
                      Completion Date
                    </div>
                    <p className={styles.certFieldValueMd}>
                      {formatDate(certificate.completionDate, 'PPP')}
                    </p>
                  </div>
                )}

                {/* Certificate ID */}
                <div className={styles.certField}>
                  <div className={styles.certFieldLabel}>
                    <FiAward className={styles.fieldIcon} />
                    Certificate ID
                  </div>
                  <p className={styles.certId}>{certificate.certificateId}</p>
                </div>

                {/* Status */}
                <div className={styles.certField}>
                  <div className={styles.certFieldLabel}>Status</div>
                  <span className={styles.statusBadge}>
                    <FiCheckCircle className={styles.badgeIcon} />
                    {certificate.status}
                  </span>
                </div>
              </div>

              {/* Download */}
              {certificate.pdfUrl && (
                <div className={styles.downloadWrap}>
                  <a
                    href={certificate.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadBtn}
                  >
                    <FiAward className={styles.btnIcon} />
                    VIEW CERTIFICATE
                  </a>
                </div>
              )}
            </div>

            {/* Note */}
            <div className={styles.noteBox}>
              <p className={styles.noteText}>
                <span className={styles.noteLabel}>{'>> NOTE:'}</span> Certificate
                verified against live database. Data is accurate as of{' '}
                {formatDate(new Date(), 'PPpp')}.
              </p>
            </div>
          </motion.div>
        )}

        {/* How-to Info */}
        {!loading && !certificate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={styles.howToCard}
          >
            <h3 className={styles.howToTitle}>
              <span className={styles.titleAccent}>{'>'}</span> HOW TO VERIFY
            </h3>
            <ol className={styles.howToList}>
              {[
                'Locate the Certificate ID on the certificate document (e.g., LMS-2026-XXXXXX)',
                'Enter the complete Certificate ID in the search field above',
                'Click VERIFY to authenticate the certificate',
                'Review the returned data to confirm it matches the physical certificate',
              ].map((step, i) => (
                <li key={i} className={styles.howToItem}>
                  <span className={styles.howToNum}>0{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;