import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/client';

const INTERVAL_MS = 30_000; // 30 s

export function useHeartbeat(courseId, levelId, levelIndex, onCounts) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const timerRef    = useRef(null);
  const abortRef    = useRef(null);
  const activeRef   = useRef({ courseId, levelId, levelIndex });
  // Keep a ref to courseId so the cleanup closure always has the latest value
  const courseIdRef = useRef(courseId);

  useEffect(() => {
    activeRef.current   = { courseId, levelId, levelIndex };
    courseIdRef.current = courseId;
  }, [courseId, levelId, levelIndex]);

  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || !activeRef.current.courseId || !activeRef.current.levelId) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await api.post(
        '/level-activity/heartbeat',
        {
          courseId:   activeRef.current.courseId,
          levelId:    activeRef.current.levelId,
          levelIndex: activeRef.current.levelIndex,
        },
        { signal: abortRef.current.signal }
      );

      if (res.data?.data?.liveCounts && onCounts) {
        onCounts(res.data.data.liveCounts);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.warn('[heartbeat] failed, will retry', err?.message);
    }
  }, [isAuthenticated, onCounts]);

  useEffect(() => {
    if (!isAuthenticated || !courseId || !levelId) return;

    sendHeartbeat();
    timerRef.current = setInterval(sendHeartbeat, INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current);

      // Cancel any in-flight heartbeat POST
      if (abortRef.current) abortRef.current.abort();

      // ✅ FIX: use api.delete (goes to backend via axios baseURL)
      // sendBeacon was wrong — it only does POST and uses relative URLs (hits frontend)
      const id = courseIdRef.current;
      if (id) {
        api.delete(`/level-activity/offline/${id}`).catch(() => {});
      }
    };
  }, [isAuthenticated, courseId, levelId, sendHeartbeat]);
}

/* ─────────────────────────────────────────────────────────────
   useLiveCounts — read-only poll, no heartbeat sent
───────────────────────────────────────────────────────────── */
export function useLiveCounts(courseId, pollInterval = INTERVAL_MS) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [liveCounts, setLiveCounts] = useState({});
  const [levels,     setLevels]     = useState([]);

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated || !courseId) return;
    try {
      const res = await api.get(`/level-activity/live-counts/${courseId}`);
      if (res.data?.data) {
        setLiveCounts(res.data.data.liveCounts || {});
        setLevels    (res.data.data.levels     || []);
      }
    } catch {
      // silent — non-critical
    }
  }, [isAuthenticated, courseId]);

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, pollInterval);
    return () => clearInterval(id);
  }, [fetchCounts, pollInterval]);

  return { liveCounts, levels };
}