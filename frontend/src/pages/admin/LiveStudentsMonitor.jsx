import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiWifi, FiWifiOff, FiRefreshCw, FiClock,
  FiUsers, FiActivity, FiBookOpen, FiAlertCircle,
} from 'react-icons/fi';
import api from '../../api/client';
import styles from './styles/LiveStudentsMonitor.module.css';

const POLL_INTERVAL = 30_000;

function formatSecondsAgo(s) {
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#00f0ff', '#ff00aa', '#00ff88', '#ffe600',
  '#ff3355', '#bf00ff', '#ff8800', '#00d4ff',
];
function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Component ────────────────────────────────────────────────
// ALWAYS receives courseId as a prop — never reads from useParams.
// Validation: must be a non-empty string that looks like a Mongo ObjectId.
const VALID_ID = /^[a-f\d]{24}$/i;

const LiveStudentsMonitor = ({ courseId }) => {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling,   setIsPolling]   = useState(true);

  const timerRef = useRef(null);

  // Guard — don't fetch if courseId isn't a real ObjectId
  const isValid = courseId && VALID_ID.test(courseId);

  const fetchData = useCallback(async (silent = false) => {
    if (!isValid) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/level-activity/admin/active-students/${courseId}`);
      setData(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  }, [courseId, isValid]);

  useEffect(() => {
    setData(null);      // clear stale data when course changes
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isPolling || !isValid) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => fetchData(true), POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [isPolling, fetchData, isValid]);

  // Tick every second for "Xs ago"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!isValid) {
    return (
      <div className={styles.container}>
        <div className={styles.gridBg} />
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>AWAITING_COURSE_ID</p>
          <p className={styles.emptySub}>Select a course from the dropdown above.</p>
        </div>
      </div>
    );
  }

  const students  = data?.students  || [];
  const totalLive = data?.totalLive ?? 0;
  const nowMs     = Date.now();

  const byLevel = students.reduce((acc, s) => {
    const key = s.levelId;
    if (!acc[key]) acc[key] = { info: s.levelInfo, levelIndex: s.levelIndex, students: [] };
    acc[key].students.push(s);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.gridBg} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconWrap}>
            <FiActivity className={styles.headerIcon} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>LIVE_MONITOR</h2>
            <p className={styles.headerSub}>
              {data?.courseTitle ? `// ${data.courseTitle.toUpperCase()}` : '// LOADING...'}
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveCountBadge}>
            <span className={styles.liveDot} />
            <span className={styles.liveCountNum}>{totalLive}</span>
            <span className={styles.liveCountLabel}>ONLINE</span>
          </div>
          <button
            className={`${styles.iconBtn} ${isPolling ? styles.iconBtnActive : ''}`}
            onClick={() => setIsPolling((p) => !p)}
            title={isPolling ? 'Pause auto-refresh' : 'Resume auto-refresh'}
          >
            {isPolling ? <FiWifi /> : <FiWifiOff />}
          </button>
          <button
            className={`${styles.iconBtn} ${loading ? styles.spinning : ''}`}
            onClick={() => fetchData()}
            title="Refresh now"
            disabled={loading}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusItem}>
          <FiClock className={styles.statusIcon} />
          {lastUpdated ? `LAST_SYNC: ${lastUpdated.toLocaleTimeString()}` : 'SYNCING...'}
        </span>
        <span className={styles.statusItem}>
          <span className={`${styles.pollDot} ${isPolling ? styles.pollDotActive : ''}`} />
          {isPolling ? `AUTO_REFRESH: ${POLL_INTERVAL / 1000}s` : 'AUTO_REFRESH: OFF'}
        </span>
        <span className={styles.statusItem}>
          <FiUsers className={styles.statusIcon} />
          {totalLive} STUDENT{totalLive !== 1 ? 'S' : ''} ACTIVE
        </span>
      </div>

      {/* Content */}
      {loading && !data ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>SCANNING_NETWORK...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <FiAlertCircle className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={() => fetchData()}>RETRY</button>
        </div>
      ) : students.length === 0 ? (
        <div className={styles.emptyState}>
          <FiWifiOff className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>NO_ACTIVE_STUDENTS</p>
          <p className={styles.emptySub}>No students detected in the last 5 minutes.</p>
        </div>
      ) : (
        <div className={styles.content}>
          {Object.entries(byLevel)
            .sort(([, a], [, b]) => a.levelIndex - b.levelIndex)
            .map(([levelId, group]) => (
              <div key={levelId} className={styles.levelGroup}>
                <div className={styles.levelLabel}>
                  <FiBookOpen className={styles.levelIcon} />
                  <span className={styles.levelNum}>
                    LEVEL_{String(group.info?.levelNumber ?? group.levelIndex + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.levelTitle}>
                    {group.info?.levelTitle?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  <span className={styles.levelCount}>{group.students.length} ACTIVE</span>
                </div>

                <div className={styles.studentGrid}>
                  {group.students.map((s, i) => {
                    const secsAgo = Math.round((nowMs - new Date(s.lastSeen).getTime()) / 1000);
                    const isHot   = secsAgo < 60;
                    const color   = getAvatarColor(s.student?.name);
                    return (
                      <div
                        key={s.student?._id || i}
                        className={`${styles.studentCard} ${isHot ? styles.studentCardHot : ''}`}
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div className={styles.cardAccent} style={{ background: color }} />
                        <div className={styles.avatar} style={{ borderColor: color, boxShadow: `0 0 10px ${color}55` }}>
                          {s.student?.avatar?.url ? (
                            <img src={s.student.avatar.url} alt={s.student.name} className={styles.avatarImg} />
                          ) : (
                            <span className={styles.avatarInitials} style={{ color }}>
                              {getInitials(s.student?.name)}
                            </span>
                          )}
                          <span className={styles.avatarPulse} style={{ borderColor: color }} />
                        </div>
                        <div className={styles.studentInfo}>
                          <p className={styles.studentName}>{s.student?.name || 'UNKNOWN'}</p>
                          <p className={styles.studentEmail}>{s.student?.email || '—'}</p>
                        </div>
                        <div className={styles.timeWrap}>
                          <span className={`${styles.timeDot} ${isHot ? styles.timeDotHot : ''}`} />
                          <span className={`${styles.timeText} ${isHot ? styles.timeTextHot : ''}`}>
                            {formatSecondsAgo(secsAgo)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LiveStudentsMonitor;