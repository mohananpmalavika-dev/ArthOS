import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import "./BigRevealAnimation.css";

const BigRevealAnimation = ({ score }) => {
  const loading = score === null || typeof score === "undefined";
  const [displayScore, setDisplayScore] = useState(null);
  const rafRef = useRef();

  useEffect(() => {
    if (loading) {
      setDisplayScore(null);
      return () => {};
    }

    // Animate number from 0 -> score over 900ms
    const duration = 900;
    const start = performance.now();
    const from = 0;
    const to = Math.max(0, Math.min(100, Math.round(score || 0)));

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      setDisplayScore(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, loading]);

  return (
    <div className="big-reveal-animation" aria-live="polite">
      <div className="big-reveal-score-container">
        {loading ? (
          <div className="big-reveal-spinner" aria-hidden="false">
            <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
          </div>
        ) : (
          <>
            <div className="big-reveal-animation-score">{displayScore}</div>
            <div className="big-reveal-shimmer" />
          </>
        )}
      </div>
    </div>
  );
};

BigRevealAnimation.propTypes = {
  score: PropTypes.number,
};

export default BigRevealAnimation;
