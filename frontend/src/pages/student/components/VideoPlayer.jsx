import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiSettings,
  FiAlertCircle,
} from 'react-icons/fi';
import { formatDuration } from '../../../utils/progressCalculator';
import toast from 'react-hot-toast';
import api from '../../../api/client';
import styles from './styles/VideoPlayer.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isYoutubeUrl = (url) =>
  url && /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);

function extractYoutubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

// ─── YouTube Player (iframe via YouTube IFrame API) ───────────────────────────
const YoutubePlayer = ({ videoUrl, courseId, topicId, onComplete }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);           // YT.Player instance
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const completedRef = useRef(false);
  const [ytReady, setYtReady] = useState(!!window.YT?.Player);
  const [watched, setWatched] = useState(0); // 0-100 percentage

  const videoId = extractYoutubeId(videoUrl);

  // ── Load YouTube IFrame API once ────────────────────────────────────────────
  useEffect(() => {
    if (window.YT?.Player) { setYtReady(true); return; }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => setYtReady(true);
    return () => { /* script stays — API is global */ };
  }, []);

  // ── Initialise player once API ready ────────────────────────────────────────
  useEffect(() => {
    if (!ytReady || !videoId || !containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
      },
      events: {
        onStateChange: handleStateChange,
      },
    });

    return () => {
      clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady, videoId]);

  const updateProgressAPI = async (percentage, timestamp) => {
    try {
      await api.post('/progress/video', {
        courseId,
        topicId,
        watchedPercentage: parseFloat(percentage),
        lastWatchedTimestamp: parseFloat(timestamp),
      });
    } catch (err) {
      console.error('Error updating video progress:', err);
    }
  };

  const handleStateChange = useCallback((event) => {
    // YT.PlayerState.PLAYING = 1 | ENDED = 0
    if (event.data === 1) {
      // Playing — start polling progress
      intervalRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player?.getCurrentTime) return;

        const current = player.getCurrentTime();
        const total = player.getDuration();
        if (!total) return;

        const pct = (current / total) * 100;
        setWatched(Math.round(pct));

        const now = Date.now();
        if (now - lastUpdateRef.current >= 5000) {
          lastUpdateRef.current = now;
          updateProgressAPI(pct.toFixed(2), current);

          if (pct >= 90 && !completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    // Video ended (state 0)
    if (event.data === 0) {
      const player = playerRef.current;
      const total = player?.getDuration?.() || 0;
      updateProgressAPI(100, total);
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, topicId]);

  if (!videoId) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle className={styles.errorIcon} />
        <p className={styles.errorMessage}>Invalid YouTube URL.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.playerWrapper}
        style={{ position: 'relative', paddingTop: '56.25%' /* 16:9 */ }}
      >
        {/* The IFrame API replaces this div */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        {!ytReady && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading YouTube player…</p>
          </div>
        )}
      </div>
      <div className={styles.watchedBadge}>{watched}% watched</div>
    </div>
  );
};

// ─── Native Video Player (Cloudinary / direct URL) ────────────────────────────
const NativeVideoPlayer = ({
  videoUrl,
  courseId,
  topicId,
  lastTimestamp = 0,
  onComplete,
}) => {
  const playerRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const updateVideoProgressAPI = async (watchedPercentage, lastWatchedTimestamp) => {
    try {
      await api.post('/progress/video', {
        courseId,
        topicId,
        watchedPercentage: parseFloat(watchedPercentage),
        lastWatchedTimestamp: parseFloat(lastWatchedTimestamp),
      });
    } catch (err) {
      console.error('Error updating video progress:', err);
    }
  };

  // Seek to last timestamp on load
  useEffect(() => {
    if (isReady && playerRef.current && lastTimestamp > 0 && !hasStarted) {
      try {
        playerRef.current.currentTime = lastTimestamp;
        setHasStarted(true);
      } catch (err) {
        console.error('Error seeking to timestamp:', err);
      }
    }
  }, [isReady, lastTimestamp, hasStarted]);

  const handleProgress = () => {
    if (!seeking && playerRef.current) {
      const el = playerRef.current;
      const currentPlayed = el.currentTime / el.duration;
      setPlayed(currentPlayed);

      const now = Date.now();
      if (now - lastUpdateRef.current >= 5000) {
        lastUpdateRef.current = now;
        const percentage = (currentPlayed * 100).toFixed(2);
        updateVideoProgressAPI(percentage, el.currentTime);
        if (percentage >= 90 && onComplete) onComplete();
      }
    }
  };

  const handleSeekChange = (e) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    if (playerRef.current) playerRef.current.currentTime = newPlayed * duration;
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (playing) { playerRef.current.pause(); }
    else          { playerRef.current.play();  }
    setPlaying(!playing);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (playerRef.current) playerRef.current.volume = v;
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    playerRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (playerRef.current) playerRef.current.playbackRate = rate;
  };

  const handleFullscreen = () => {
    const el = playerRef.current;
    if (!el) return;
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
  };

  const handleLoadedMetadata = () => {
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
      setIsReady(true);
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('Failed to load video. Please try again later.');
    setLoading(false);
    toast.error('Failed to load video');
  };

  const handleVideoEnd = async () => {
    if (!playerRef.current) return;
    await updateVideoProgressAPI(100, playerRef.current.duration);
    onComplete?.();
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle className={styles.errorIcon} />
        <h3 className={styles.errorTitle}>Video Error</h3>
        <p className={styles.errorMessage}>{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); }}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(playing ? false : true)}
    >
      <div className={styles.playerWrapper}>
        <video
          ref={playerRef}
          src={videoUrl}
          onTimeUpdate={handleProgress}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={handleVideoEnd}
          className={styles.videoElement}
        />

        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading video…</p>
          </div>
        )}

        {!playing && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.playOverlay}
            onClick={handlePlayPause}
          >
            <div className={styles.playButton}>
              <FiPlay className={styles.playIcon} />
            </div>
          </motion.div>
        )}

        {showControls && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.controls}
          >
            {/* Progress Bar */}
            <div className={styles.progressSection}>
              <input
                type="range"
                min={0}
                max={0.999999}
                step="any"
                value={played}
                onChange={handleSeekChange}
                onMouseDown={() => setSeeking(true)}
                onMouseUp={() => setSeeking(false)}
                className={styles.progressSlider}
                style={{
                  background: `linear-gradient(to right, #00f0ff 0%, #00f0ff ${played * 100}%, #4b5563 ${played * 100}%, #4b5563 100%)`,
                }}
              />
              <div className={styles.timeDisplay}>
                <span>{formatDuration(played * duration)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className={styles.controlsBar}>
              <div className={styles.controlsLeft}>
                <button onClick={handlePlayPause} className={styles.controlButton}>
                  {playing
                    ? <FiPause className={styles.controlIcon} />
                    : <FiPlay  className={styles.controlIcon} />}
                </button>

                <div className={styles.volumeControl}>
                  <button onClick={handleToggleMute} className={styles.controlButton}>
                    {muted || volume === 0
                      ? <FiVolumeX className={styles.controlIcon} />
                      : <FiVolume2 className={styles.controlIcon} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                </div>

                <span className={styles.timeText}>
                  {formatDuration(played * duration)} / {formatDuration(duration)}
                </span>
              </div>

              <div className={styles.controlsRight}>
                <div className={styles.speedControl}>
                  <button className={styles.speedButton}>
                    <FiSettings className={styles.controlIcon} />
                    <span className={styles.speedText}>{playbackRate}x</span>
                  </button>
                  <div className={styles.speedMenu}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`${styles.speedOption} ${
                          playbackRate === rate ? styles.speedOptionActive : ''
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleFullscreen} className={styles.controlButton}>
                  <FiMaximize className={styles.controlIcon} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className={styles.watchedBadge}>
        {Math.round(played * 100)}% watched
      </div>
    </div>
  );
};

// ─── Public wrapper — auto-selects the right player ──────────────────────────
const VideoPlayer = ({ videoUrl, courseId, topicId, lastTimestamp = 0, onComplete }) => {
  if (isYoutubeUrl(videoUrl)) {
    return (
      <YoutubePlayer
        videoUrl={videoUrl}
        courseId={courseId}
        topicId={topicId}
        onComplete={onComplete}
      />
    );
  }

  return (
    <NativeVideoPlayer
      videoUrl={videoUrl}
      courseId={courseId}
      topicId={topicId}
      lastTimestamp={lastTimestamp}
      onComplete={onComplete}
    />
  );
};

export default VideoPlayer;