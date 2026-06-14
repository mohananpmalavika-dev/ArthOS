import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const SEGMENT_COUNT = 12;
const RADIUS = 90;
const STROKE_WIDTH = 10;
const VIEWBOX_SIZE = 220;
const CENTER = VIEWBOX_SIZE / 2;
const INNER_RADIUS = RADIUS - STROKE_WIDTH / 2;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const GAP_DEG = 2;

/**
 * ScoreRing — A rich segmented circular gauge with gradient fill, glow effects,
 * and smooth animation. Shows the health score as a proportion of filled segments.
 */
function ScoreRing({ score = 0, size = "default" }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ringRef = useRef(null);

  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const filledSegments = Math.round((normalizedScore / 100) * SEGMENT_COUNT);

  // Observer for visibility-based animation
  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate the score number
  useEffect(() => {
    if (!isVisible) return;
    let frame;
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(eased * normalizedScore));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isVisible, normalizedScore]);

  // Build SVG segments
  const segments = [];
  let activeFilled = 0;

  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const isFilled = i < filledSegments;
    if (isFilled) activeFilled++;

    const startAngle = i * SEGMENT_ANGLE - 90;
    const endAngle = startAngle + SEGMENT_ANGLE - GAP_DEG;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = CENTER + INNER_RADIUS * Math.cos(startRad);
    const y1 = CENTER + INNER_RADIUS * Math.sin(startRad);
    const x2 = CENTER + INNER_RADIUS * Math.cos(endRad);
    const y2 = CENTER + INNER_RADIUS * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`
    ].join(" ");

    segments.push({
      path,
      isFilled,
      delay: i * 30,
      index: i
    });
  }

  const percentFilled = Math.round((activeFilled / SEGMENT_COUNT) * 100);
  // Determine color based on score
  const getScoreColor = (s) => {
    if (s >= 80) return { start: "#73f0bf", end: "#62e4d1" };
    if (s >= 60) return { start: "#62e4d1", end: "#8b5cf6" };
    if (s >= 40) return { start: "#f4b255", end: "#8b5cf6" };
    return { start: "#ff6f91", end: "#f4b255" };
  };

  const colors = getScoreColor(normalizedScore);

  // Determine dimension based on size prop
  const dimension = size === "small" ? 150 : VIEWBOX_SIZE;
  const scale = dimension / VIEWBOX_SIZE;
  const scaledRadius = RADIUS * scale;
  const scaledStroke = STROKE_WIDTH * scale;
  const labelSize = size === "small" ? "24px" : "42px";
  const labelSmallSize = size === "small" ? "9px" : "11px";

  return (
    <div
      className={`score-ring-chart ${size === "small" ? "score-ring-chart--small" : ""}`}
      style={{
        "--score": normalizedScore,
        "--ring-start": colors.start,
        "--ring-end": colors.end,
        width: dimension,
        height: dimension
      }}
      ref={ringRef}
    >
      {/* Glow effect behind the ring */}
      {isVisible && (
        <div
          className="score-ring-glow"
          style={{
            position: "absolute",
            inset: -Math.round(scaledStroke * 2),
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${colors.start}22 0%, ${colors.end}11 40%, transparent 70%)`,
            filter: "blur(8px)",
            animation: "scoreRingPulse 3s ease-in-out infinite",
            pointerEvents: "none"
          }}
        />
      )}

      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        style={{ position: "relative", zIndex: 1 }}
      >
        <defs>
          {/* Gradient for filled segments */}
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
          {/* Gradient for unfilled segments (subtle tone) */}
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
          </linearGradient>
        </defs>

        {/* Track segments (unfilled) */}
        {segments.map((seg) => {
          if (seg.isFilled) return null;
          return (
            <path
              key={`track-${seg.index}`}
              d={seg.path}
              fill="none"
              stroke="url(#trackGradient)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              style={{
                transition: "opacity 0.3s ease"
              }}
            />
          );
        })}

        {/* Filled segments (animated in) */}
        {segments.map((seg) => {
          if (!seg.isFilled) return null;
          return (
            <path
              key={`fill-${seg.index}`}
              d={seg.path}
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              style={{
                opacity: isVisible ? 1 : 0,
                transformOrigin: `${CENTER}px ${CENTER}px`,
                transition: `opacity 0.4s ease ${seg.delay}ms`,
                filter: isVisible
                  ? `drop-shadow(0 0 ${seg.index < 3 ? 4 : 2}px ${colors.start}44)`
                  : "none"
              }}
            />
          );
        })}

        {/* Glow ring overlay for highlight effect */}
        {isVisible && (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS - STROKE_WIDTH / 2 + 2}
            fill="none"
            stroke={colors.start}
            strokeWidth={STROKE_WIDTH + 4}
            strokeLinecap="round"
            opacity={0.04}
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>

      {/* Center label */}
      <div className="score-ring-label">
        <strong style={{ fontSize: labelSize }}>
          {isVisible ? animatedScore : 0}
        </strong>
        <small style={{ fontSize: labelSmallSize }}>/100</small>
      </div>
    </div>
  );
}

ScoreRing.propTypes = {
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOf(["default", "small"])
};

export default ScoreRing;
