import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiSettings, FiAlertCircle } from 'react-icons/fi';
import { formatDuration } from '../../../utils/progressCalculator';
import toast from 'react-hot-toast';
import api from '../../../api/client';
import styles from './styles/VideoPlayer.module.css';

const VideoPlayer = ({ 
  videoUrl, 
  courseId, 
  topicId, 
  lastTimestamp = 0,
  onComplete 
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

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // API call to update video progress
  const updateVideoProgressAPI = async (watchedPercentage, lastWatchedTimestamp) => {
  try {
    const response = await api.post('/progress/video', {
      courseId,
      topicId,
      watchedPercentage: parseFloat(watchedPercentage),
      lastWatchedTimestamp: parseFloat(lastWatchedTimestamp)
    });

    if (response.data.success) {
      console.log('Video progress updated successfully');
    }

  } catch (error) {
    console.error('Error updating video progress:', error);
  }
};


  useEffect(() => {
    if (isReady && playerRef.current && lastTimestamp > 0 && !hasStarted) {
      try {
        const videoElement = playerRef.current;
        videoElement.currentTime = lastTimestamp;
        setHasStarted(true);
      } catch (err) {
        console.error('Error seeking to timestamp:', err);
      }
    }
  }, [isReady, lastTimestamp, hasStarted]);

  const handleProgress = () => {
    if (!seeking && playerRef.current) {
      const videoElement = playerRef.current;
      const currentPlayed = videoElement.currentTime / videoElement.duration;
      setPlayed(currentPlayed);
      
      const now = Date.now();
      
      // Update backend every 5 seconds
      if (now - lastUpdateRef.current >= 5000) {
        lastUpdateRef.current = now;
        
        const percentage = (currentPlayed * 100).toFixed(2);
        
        updateVideoProgressAPI(percentage, videoElement.currentTime);

        // Call onComplete when video is 90% watched
        if (percentage >= 90 && onComplete) {
          onComplete();
        }
      }
    }
  };

  const handleSeekChange = (e) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    if (playerRef.current) {
      playerRef.current.currentTime = newPlayed * duration;
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = () => {
    setSeeking(false);
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playing) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.volume = newVolume;
    }
  };

  const handleToggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (playerRef.current) {
      playerRef.current.playbackRate = rate;
    }
  };

  const handleFullscreen = () => {
    const elem = playerRef.current;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  };

  const handleReady = () => {
    setIsReady(true);
    setLoading(false);
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
    }
  };

  const handleError = (error) => {
    console.error('Video player error:', error);
    setError('Failed to load video. Please try again later.');
    setLoading(false);
    toast.error('Failed to load video');
  };

  const handleLoadedMetadata = () => {
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
      handleReady();
    }
  };
  const handleVideoEnd = async () => {
  if (!playerRef.current) return;

  const videoElement = playerRef.current;

  await updateVideoProgressAPI(100, videoElement.duration);

  if (onComplete) {
    onComplete();
  }
};


  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle className={styles.errorIcon} />
        <h3 className={styles.errorTitle}>Video Error</h3>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
          }}
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
          onEnded={handleVideoEnd}   // 🔥 ADD THIS
          className={styles.videoElement}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading video...</p>
          </div>
        )}

        {/* Play/Pause Overlay */}
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

        {/* Custom Controls */}
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
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
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
                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className={styles.controlButton}
                >
                  {playing ? (
                    <FiPause className={styles.controlIcon} />
                  ) : (
                    <FiPlay className={styles.controlIcon} />
                  )}
                </button>

                {/* Volume */}
                <div className={styles.volumeControl}>
                  <button
                    onClick={handleToggleMute}
                    className={styles.controlButton}
                  >
                    {muted || volume === 0 ? (
                      <FiVolumeX className={styles.controlIcon} />
                    ) : (
                      <FiVolume2 className={styles.controlIcon} />
                    )}
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

                {/* Time Display */}
                <span className={styles.timeText}>
                  {formatDuration(played * duration)} / {formatDuration(duration)}
                </span>
              </div>

              <div className={styles.controlsRight}>
                {/* Playback Speed */}
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
                        className={`${styles.speedOption} ${playbackRate === rate ? styles.speedOptionActive : ''}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className={styles.controlButton}
                >
                  <FiMaximize className={styles.controlIcon} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className={styles.watchedBadge}>
        {Math.round(played * 100)}% watched
      </div>
    </div>
  );
};

export default VideoPlayer;