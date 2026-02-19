import React, { useEffect, useState, useCallback, useRef  } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiAward, FiZap, FiShield, FiCalendar, FiHash, FiMaximize2 } from 'react-icons/fi';
import api from '../../api/client';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

/* ─── Cyberpunk Neon Palette (mirrors certificate design) ─── */
const CP = {
  bg:       '#0a0015',
  bgMid:    '#0d001f',
  bgTeal:   '#000d1a',
  cyan:     '#00ffff',
  magenta:  '#ff00ff',
  lime:     '#ccff00',
  neonTeal: '#00ffcc',
  dimText:  '#7777aa',
  mutedBlue:'#6688aa',
  border1:  'rgba(255,0,255,0.5)',
  border2:  'rgba(0,255,255,0.4)',
};

/* ─── Scanline CSS injected once ─── */
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap');
  .cp-scanlines::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.18) 2px,
      rgba(0,0,0,0.18) 4px
    );
    pointer-events: none;
    z-index: 1;
  }
  .cp-grid-bg {
    background-image:
      linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  @keyframes cp-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes cp-flicker {
    0%, 95%, 100% { opacity: 1; }
    96% { opacity: 0.4; }
    97% { opacity: 1; }
    98% { opacity: 0.3; }
    99% { opacity: 1; }
  }
  @keyframes cp-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .cp-flicker { animation: cp-flicker 6s infinite; }
  .cp-pulse { animation: cp-pulse 2s ease-in-out infinite; }
  .cp-spin  { animation: cp-spin 8s linear infinite; }
  .cp-neon-text-cyan {
    text-shadow: 0 0 8px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff;
  }
  .cp-neon-text-magenta {
    text-shadow: 0 0 8px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;
  }
  .cp-neon-text-lime {
    text-shadow: 0 0 8px #ccff00, 0 0 20px #ccff00;
  }
  .cp-border-magenta {
    box-shadow: 0 0 0 1px rgba(255,0,255,0.6), 0 0 20px rgba(255,0,255,0.15), inset 0 0 20px rgba(255,0,255,0.05);
  }
  .cp-border-cyan {
    box-shadow: 0 0 0 1px rgba(0,255,255,0.6), 0 0 20px rgba(0,255,255,0.15), inset 0 0 20px rgba(0,255,255,0.05);
  }
  .cp-card-hover {
    transition: all 0.3s ease;
  }
  .cp-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 0 1px rgba(0,255,255,0.8), 0 0 40px rgba(0,255,255,0.2), 0 20px 40px rgba(0,0,0,0.5);
  }
  .cp-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .cp-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.4s ease;
  }
  .cp-btn:hover::before { transform: translateX(100%); }
  .cp-btn:hover { transform: scale(1.03); }
`;

/* ─── Tiny helpers ─── */
const NeonDivider = ({ color = CP.magenta }) => (
  <div style={{ position: 'relative', height: 2, margin: '0 0' }}>
    <div style={{ height: 1, background: color, opacity: 0.7 }} />
    <div style={{ position: 'absolute', top: 1, height: 1, width: '100%', background: color === CP.magenta ? CP.cyan : CP.magenta, opacity: 0.3 }} />
    <div style={{
      position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
      width: 8, height: 8, background: color,
      boxShadow: `0 0 8px ${color}`,
    }} />
  </div>
);

const StatChip = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}33`,
    borderRadius: 4, padding: '4px 10px',
  }}>
    <Icon size={12} style={{ color }} />
    <span style={{ fontSize: 11, color: CP.dimText, fontFamily: 'Rajdhani' }}>{label}</span>
    <span style={{ fontSize: 11, color, fontFamily: 'Orbitron', fontWeight: 700 }}>{value}</span>
  </div>
);

/* ─── Auto-generate logic per enrolled course ─── */
const useAutoGenerate = (enrolledCourses) => {
  const [generating, setGenerating] = useState({});

  const tryGenerate = useCallback(async (courseId) => {
    try {
      const { data: eligData } = await api.get(`/certificates/check-eligibility/${courseId}`);
      if (eligData.data.isEligible && !eligData.data.certificateIssued) {
        setGenerating(prev => ({ ...prev, [courseId]: true }));
        await api.post(`/certificates/generate/${courseId}`);
        toast.success('🎉 New certificate generated!', {
          style: { background: '#0d001f', color: '#00ffff', border: '1px solid #ff00ff' }
        });
      }
    } catch {
      /* silent — already issued or not eligible */
    } finally {
      setGenerating(prev => ({ ...prev, [courseId]: false }));
    }
  }, []);

  return { generating, tryGenerate };
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState(null);

  const { generating, tryGenerate } = useAutoGenerate(enrolledCourses);


  // ✅ After — add ref guard at top of MyCertificates
const initCalled = useRef(false);

useEffect(() => {
  if (initCalled.current) return;  // block second Strict Mode call
  initCalled.current = true;

  const init = async () => {
    try {
      const profileRes = await api.get('/auth/me');
      const courses = profileRes.data.data?.enrolledCourses || [];
      setEnrolledCourses(courses);

      await Promise.allSettled(
        courses.map(ec => tryGenerate(ec.course?._id || ec.course))
      );

      const certRes = await api.get('/certificates/my-certificates');
      setCertificates(certRes.data.data || []);
    } catch {
      toast.error('Failed to load certificates', {
        style: { background: '#0d001f', color: '#ff00ff', border: '1px solid #ff00ff' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  init();
}, []);

  /* Re-fetch after any generation completes */
  useEffect(() => {
    const anyGenerating = Object.values(generating).some(Boolean);
    if (!anyGenerating && !isLoading) {
      api.get('/certificates/my-certificates')
        .then(r => setCertificates(r.data.data || []))
        .catch(() => {});
    }
  }, [generating]);

  const handleDownload = (cert) => {
    const url = cert.certificatePDF?.url;
    if (!url) { toast.error('Certificate image not ready yet'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.courseName}-certificate.jpg`;
    a.target = '_blank';
    a.click();
    toast.success('Downloading certificate…', {
      style: { background: '#0d001f', color: '#00ffff', border: '1px solid #00ffff' }
    });
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '—';

  if (isLoading) return <Loader fullScreen />;

  /* ── JSX ── */
  return (
    <>
      <style>{GLOBAL_STYLE}</style>

      <div
        className="cp-grid-bg"
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${CP.bg} 0%, ${CP.bgMid} 50%, ${CP.bgTeal} 100%)`,
          padding: '40px 24px',
          fontFamily: 'Rajdhani, sans-serif',
          position: 'relative',
        }}
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 1200, margin: '0 auto 48px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div className="cp-spin" style={{
              width: 48, height: 48,
              border: `2px solid ${CP.magenta}`,
              borderTop: `2px solid ${CP.cyan}`,
              borderRadius: '50%',
              flexShrink: 0,
            }} />
            <div>
              <h1 className="cp-neon-text-cyan cp-flicker" style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: 'clamp(22px, 4vw, 38px)',
                fontWeight: 900,
                color: CP.cyan,
                margin: 0,
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}>
                MY CERTIFICATES
              </h1>
              <p style={{ color: CP.dimText, margin: 0, fontSize: 15, letterSpacing: 1 }}>
                ACHIEVEMENT ARCHIVE  //  {certificates.filter(c => c.certificatePDF?.url).length} CREDENTIAL
                {certificates.filter(c => c.certificatePDF?.url).length !== 1 ? 'S' : ''} ISSUED
              </p>
            </div>
          </div>
          <NeonDivider color={CP.cyan} />
        </motion.div>

        {/* ── Cards Grid ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {certificates.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 28,
            }}>
              {certificates.map((cert, i) => (
                <CertCard
                  key={cert._id}
                  cert={cert}
                  index={i}
                  fmtDate={fmtDate}
                  onDownload={handleDownload}
                  onPreview={setPreviewCert}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Preview Modal ── */}
        <AnimatePresence>
          {previewCert && (
            <PreviewModal
              cert={previewCert}
              fmtDate={fmtDate}
              onClose={() => setPreviewCert(null)}
              onDownload={handleDownload}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/* ─── Certificate Card ─── */
const CertCard = ({ cert, index, fmtDate, onDownload, onPreview }) => {
  const hasImage = !!cert.certificatePDF?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="cp-card-hover"
      style={{
        background: `linear-gradient(160deg, rgba(13,0,31,0.95) 0%, rgba(0,13,26,0.95) 100%)`,
        border: `1px solid rgba(255,0,255,0.35)`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${CP.magenta}, ${CP.cyan}, ${CP.lime})`,
      }} />

      {/* Certificate image preview */}
      <div
        style={{
          position: 'relative',
          height: 180,
          background: `linear-gradient(135deg, #0d001f, #000d1a)`,
          overflow: 'hidden',
          cursor: hasImage ? 'pointer' : 'default',
        }}
        onClick={() => hasImage && onPreview(cert)}
      >
        {hasImage ? (
          <>
            <img
              src={cert.certificatePDF.url}
              alt="certificate"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(10,0,21,0.9) 100%)',
            }} />
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(10,0,21,0.7)',
              border: `1px solid ${CP.cyan}`,
              borderRadius: 6, padding: '4px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <FiMaximize2 size={11} style={{ color: CP.cyan }} />
              <span style={{ fontSize: 10, color: CP.cyan, fontFamily: 'Orbitron' }}>VIEW</span>
            </div>
          </>
        ) : (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div className="cp-spin" style={{
              width: 36, height: 36,
              border: `2px solid rgba(255,0,255,0.3)`,
              borderTop: `2px solid ${CP.magenta}`,
              borderRadius: '50%',
            }} />
            <span style={{ fontSize: 11, color: CP.dimText, fontFamily: 'Orbitron' }}>
              GENERATING…
            </span>
          </div>
        )}

        {/* Status badge */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: cert.status === 'Valid' ? 'rgba(0,255,204,0.15)' : 'rgba(255,0,0,0.15)',
          border: `1px solid ${cert.status === 'Valid' ? CP.neonTeal : '#ff4444'}`,
          borderRadius: 4, padding: '2px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <FiShield size={10} style={{ color: cert.status === 'Valid' ? CP.neonTeal : '#ff4444' }} />
          <span style={{
            fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700,
            color: cert.status === 'Valid' ? CP.neonTeal : '#ff4444',
          }}>
            {cert.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 20px 20px' }}>
        {/* Course name */}
        <h3 className="cp-neon-text-magenta" style={{
          fontFamily: 'Orbitron', fontSize: 14, fontWeight: 700,
          color: CP.magenta, margin: '0 0 4px',
          textTransform: 'uppercase', letterSpacing: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {cert.courseName}
        </h3>

        <p style={{ fontSize: 13, color: CP.dimText, margin: '0 0 14px' }}>
          {cert.studentName}
        </p>

        <NeonDivider color={CP.magenta} />

        {/* Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '14px 0' }}>
          <StatChip icon={FiCalendar} label="ISSUED" value={fmtDate(cert.issueDate)} color={CP.cyan} />
          <StatChip icon={FiHash} label="ID" value={cert.certificateId} color={CP.magenta} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="cp-btn"
            onClick={() => onDownload(cert)}
            disabled={!hasImage}
            style={{
              flex: 1,
              background: hasImage
                ? `linear-gradient(90deg, rgba(0,255,255,0.15), rgba(0,255,255,0.05))`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${hasImage ? CP.cyan : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, padding: '10px 0',
              color: hasImage ? CP.cyan : CP.dimText,
              fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700,
              cursor: hasImage ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              letterSpacing: 1,
              boxShadow: hasImage ? `0 0 12px rgba(0,255,255,0.15)` : 'none',
            }}
          >
            <FiDownload size={13} />
            DOWNLOAD
          </button>

          <button
            className="cp-btn"
            onClick={() => onPreview(cert)}
            disabled={!hasImage}
            style={{
              background: `linear-gradient(90deg, rgba(255,0,255,0.15), rgba(255,0,255,0.05))`,
              border: `1px solid ${hasImage ? CP.magenta : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, padding: '10px 14px',
              color: hasImage ? CP.magenta : CP.dimText,
              cursor: hasImage ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center',
              boxShadow: hasImage ? `0 0 12px rgba(255,0,255,0.15)` : 'none',
            }}
          >
            <FiMaximize2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Full-screen Preview Modal ─── */
const PreviewModal = ({ cert, fmtDate, onClose, onDownload }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      onClick={e => e.stopPropagation()}
      style={{
        background: `linear-gradient(160deg, #0d001f, #000d1a)`,
        border: `1px solid rgba(0,255,255,0.5)`,
        borderRadius: 16, overflow: 'hidden',
        maxWidth: 860, width: '100%',
        boxShadow: `0 0 60px rgba(0,255,255,0.15), 0 0 0 1px rgba(255,0,255,0.3)`,
      }}
    >
      {/* Modal top bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${CP.magenta}, ${CP.cyan}, ${CP.lime})`,
      }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: `1px solid rgba(255,0,255,0.2)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiAward style={{ color: CP.magenta }} size={18} />
          <span style={{ fontFamily: 'Orbitron', fontSize: 13, color: CP.cyan, letterSpacing: 2 }}>
            CERTIFICATE VIEWER
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,0,255,0.1)',
          border: `1px solid rgba(255,0,255,0.4)`,
          borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: CP.magenta,
        }}>
          <FiX size={16} />
        </button>
      </div>

      {/* Certificate image */}
      <div style={{ padding: '20px 20px 10px' }}>
        {cert.certificatePDF?.url ? (
          <img
            src={cert.certificatePDF.url}
            alt="certificate"
            style={{
              width: '100%', borderRadius: 8,
              border: `1px solid rgba(0,255,255,0.3)`,
              boxShadow: `0 0 30px rgba(0,255,255,0.1)`,
            }}
          />
        ) : (
          <div style={{
            height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: CP.dimText, fontFamily: 'Orbitron', fontSize: 13,
          }}>
            CERTIFICATE NOT READY
          </div>
        )}
      </div>

      {/* Meta + actions */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        padding: '12px 20px 20px',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatChip icon={FiAward} label="COURSE" value={cert.courseName?.toUpperCase()} color={CP.lime} />
          <StatChip icon={FiCalendar} label="ISSUED" value={fmtDate(cert.issueDate)} color={CP.cyan} />
          <StatChip icon={FiHash} label="ID" value={cert.certificateId} color={CP.magenta} />
        </div>
        <button
          className="cp-btn"
          onClick={() => onDownload(cert)}
          style={{
            background: `linear-gradient(90deg, rgba(0,255,255,0.2), rgba(0,255,255,0.08))`,
            border: `1px solid ${CP.cyan}`,
            borderRadius: 8, padding: '10px 24px',
            color: CP.cyan, fontFamily: 'Orbitron', fontSize: 12,
            fontWeight: 700, cursor: 'pointer', letterSpacing: 2,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 0 20px rgba(0,255,255,0.2)`,
          }}
        >
          <FiDownload size={14} />
          DOWNLOAD
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ─── Empty State ─── */
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{
      textAlign: 'center', padding: '80px 40px',
      background: 'rgba(13,0,31,0.6)',
      border: `1px solid rgba(255,0,255,0.2)`,
      borderRadius: 16, maxWidth: 500, margin: '0 auto',
    }}
  >
    <div className="cp-pulse" style={{
      width: 80, height: 80, borderRadius: '50%',
      border: `2px solid rgba(255,0,255,0.4)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 24px',
    }}>
      <FiZap size={32} style={{ color: '#ff00ff' }} />
    </div>
    <h2 style={{
      fontFamily: 'Orbitron', fontSize: 20, color: '#00ffff',
      margin: '0 0 12px', letterSpacing: 2,
    }}>
      NO CREDENTIALS YET
    </h2>
    <p style={{ color: '#7777aa', fontFamily: 'Rajdhani', fontSize: 16, lineHeight: 1.6 }}>
      Complete all course requirements — videos, quizzes, and tasks — to unlock your certificate. It will appear here automatically.
    </p>
  </motion.div>
);

export default MyCertificates;