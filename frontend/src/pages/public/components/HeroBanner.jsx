import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  fetchActiveBanners,
  trackBannerView,
  trackBannerClick,
} from "../../../redux/slices/bannerSlice";
import styles from "./styles/HeroBanner.module.css";

const SLIDE_INTERVAL = 6000;

// Direction-aware slide variants
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "brightness(0.3) saturate(3)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "brightness(1) saturate(1)",
    transition: {
      x: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.4 },
      filter: { duration: 0.5 },
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    filter: "brightness(0.3) saturate(3)",
    transition: {
      x: { duration: 0.5, ease: [0.7, 0, 0.84, 0] },
      opacity: { duration: 0.3 },
    },
  }),
};

const HeroBanner = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { activeBanners, activeBannersLoading } = useSelector((s) => s.banners);
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const [current,  setCurrent]  = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused,   setPaused]   = useState(false);
  const [glitching, setGlitching] = useState(false);
  const timerRef  = useRef(null);

  useEffect(() => { dispatch(fetchActiveBanners()); }, [dispatch]);

  // Track view on slide change
  useEffect(() => {
    if (activeBanners[current]?._id) {
      dispatch(trackBannerView(activeBanners[current]._id));
    }
  }, [current, activeBanners, dispatch]);

  const goTo = useCallback(
    (index, dir) => {
      setDirection(dir);
      setGlitching(true);
      setTimeout(() => setGlitching(false), 400);
      setCurrent((index + activeBanners.length) % activeBanners.length);
    },
    [activeBanners.length]
  );

  const next = useCallback(() => goTo(current + 1,  1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Auto-slide
  useEffect(() => {
    if (activeBanners.length <= 1 || paused) return;
    timerRef.current = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next, paused, activeBanners.length]);

  const handleCtaClick = (banner) => {
    dispatch(trackBannerClick(banner._id));
    navigate(banner.buttonUrl);
  };

  // ── Loading skeleton ──
  if (activeBannersLoading) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonScanlines} />
        <div className={styles.skeletonContent}>
          <div className={styles.skeletonLine} style={{ width: "60%", height: "2.5rem" }} />
          <div className={styles.skeletonLine} style={{ width: "80%", height: "1rem", marginTop: "1rem" }} />
          <div className={styles.skeletonLine} style={{ width: "40%", height: "1rem", marginTop: "0.5rem" }} />
          <div className={styles.skeletonBtn} />
        </div>
      </div>
    );
  }

  if (!activeBanners.length) return null;

  const banner = activeBanners[current];
  const total  = activeBanners.length;

  return (
    <section
      className={`${styles.sliderSection} ${glitching ? styles.glitchActive : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero banner slider"
    >
      {/* ── Cyberpunk overlays ── */}
      <div className={styles.scanlines}         aria-hidden="true" />
      <div className={styles.gridOverlay}       aria-hidden="true" />
      <div className={styles.vignetteOverlay}   aria-hidden="true" />
      <div className={styles.cornerTL}          aria-hidden="true" />
      <div className={styles.cornerTR}          aria-hidden="true" />
      <div className={styles.cornerBL}          aria-hidden="true" />
      <div className={styles.cornerBR}          aria-hidden="true" />

      {/* ── HUD: slide counter top-right ── */}
      <div className={styles.hudCounter} aria-hidden="true">
        <span className={styles.hudLabel}>SLIDE</span>
        <span className={styles.hudValue}>
          {String(current + 1).padStart(2, "0")}
          <span className={styles.hudSep}>/</span>
          {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* ── Slide track ── */}
      <div className={styles.sliderTrack}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={banner._id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={styles.slide}
          >
            {/* BG image */}
            <div
              className={styles.slideBackground}
              style={{ backgroundImage: `url(${banner.image?.url})` }}
            >
              <div className={styles.slideOverlay} />
              <div className={styles.slideNeonEdge} />
            </div>

            {/* Content */}
            <div className={styles.slideContent}>
              {/* Type badge */}
              {banner.type && banner.type !== "hero" && (
                <motion.div
                  className={styles.typeBadge}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <span className={styles.typeBadgeDot} />
                  {banner.type.toUpperCase()}
                </motion.div>
              )}

              {/* Title with glitch effect */}
              <motion.h1
                key={`title-${banner._id}`}
                className={`${styles.slideTitle} ${glitching ? styles.glitchText : ""}`}
                data-text={banner.title}
                initial={{ opacity: 0, y: 40, skewX: -3 }}
                animate={{ opacity: 1, y: 0, skewX: 0 }}
                transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                {banner.title}
              </motion.h1>

              {banner.subtitle && (
                <motion.p
                  key={`sub-${banner._id}`}
                  className={styles.slideSubtitle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.5 }}
                >
                  {banner.subtitle}
                </motion.p>
              )}

              {/* CTA row */}
              {banner.buttonText && (
                <motion.div
                  key={`btn-${banner._id}`}
                  className={styles.ctaRow}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.5 }}
                >
                  {isAuthenticated ? (
                    <Link
                      to={user?.role === "admin" ? "/admin" : "/dashboard"}
                      className={styles.ctaButton}
                    >
                      <span className={styles.ctaBtnInner}>
                        GO TO DASHBOARD
                        <FiArrowRight className={styles.ctaIcon} />
                      </span>
                      <span className={styles.ctaGlow} />
                    </Link>
                  ) : (
                    <button
                      className={styles.ctaButton}
                      onClick={() => handleCtaClick(banner)}
                    >
                      <span className={styles.ctaBtnInner}>
                        {banner.buttonText.toUpperCase()}
                        <FiArrowRight className={styles.ctaIcon} />
                      </span>
                      <span className={styles.ctaGlow} />
                    </button>
                  )}

                  {/* Secondary ghost link for unauthenticated */}
                  {!isAuthenticated && (
                    <Link to="/courses" className={styles.ghostButton}>
                      EXPLORE COURSES
                    </Link>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation (only if >1 slide) ── */}
      {total > 1 && (
        <>
          {/* Arrow left */}
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={prev}
            aria-label="Previous slide"
          >
            <FiChevronLeft />
            <span className={styles.arrowGlow} />
          </button>

          {/* Arrow right */}
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={next}
            aria-label="Next slide"
          >
            <FiChevronRight />
            <span className={styles.arrowGlow} />
          </button>

          {/* Dot indicators */}
          <div className={styles.dots} role="tablist" aria-label="Slides">
            {activeBanners.map((b, i) => (
              <button
                key={b._id}
                role="tab"
                aria-selected={i === current}
                aria-label={`Slide ${i + 1}`}
                className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
                onClick={() => goTo(i, i > current ? 1 : -1)}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className={styles.progressBar}>
              <motion.div
                key={`progress-${current}`}
                className={styles.progressFill}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: SLIDE_INTERVAL / 1000, ease: "linear" }}
              />
              <div className={styles.progressGlow} />
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default HeroBanner;