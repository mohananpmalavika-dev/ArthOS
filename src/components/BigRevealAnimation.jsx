import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BigRevealAnimation = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReduceMotion = () => setReduceMotion(mediaQuery.matches);

    updateReduceMotion();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateReduceMotion);
    } else {
      mediaQuery.addListener(updateReduceMotion);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateReduceMotion);
      } else {
        mediaQuery.removeListener(updateReduceMotion);
      }
    };
  }, []);

  const ringVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: [0.96, 1.02, 0.98, 1],
      transition: {
        duration: 1.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror"
      }
    }
  };

  const nodeVariants = {
    hidden: { opacity: 0 },
    visible: i => ({
      opacity: [0, 1, 0.6, 1],
      transition: {
        duration: 2.4,
        delay: i * 0.2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    })
  };

  const staticSvg = (
    <svg viewBox="0 0 320 320" aria-hidden="false" role="img" className="big-reveal-animation-placeholder">
      <circle cx="160" cy="160" r="116" fill="none" stroke="rgba(98,228,209,0.18)" strokeWidth="18" />
      <circle cx="160" cy="160" r="88" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
      <circle cx="160" cy="160" r="60" fill="none" stroke="rgba(98,228,209,0.24)" strokeWidth="6" />
      <circle cx="160" cy="160" r="12" fill="#72ffe2" />
      <text x="160" y="160" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="11" opacity="0.8">
        Reveal Ready
      </text>
    </svg>
  );

  if (reduceMotion) {
    return (
      <div className="big-reveal-animation-container" role="img" aria-label="Static reveal illustration with concentric rings and glowing nodes.">
        {staticSvg}
      </div>
    );
  }

  return (
    <motion.div className="big-reveal-animation-container" initial="hidden" animate="visible">
      <motion.svg viewBox="0 0 320 320" className="big-reveal-animation-graphic" aria-hidden="true">
        <motion.circle
          cx="160"
          cy="160"
          r="116"
          fill="none"
          stroke="rgba(98,228,209,0.16)"
          strokeWidth="18"
          variants={ringVariants}
        />
        <motion.circle
          cx="160"
          cy="160"
          r="88"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="10"
          variants={ringVariants}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.circle
          cx="160"
          cy="160"
          r="60"
          fill="none"
          stroke="rgba(98,228,209,0.24)"
          strokeWidth="6"
          variants={ringVariants}
          transition={{ duration: 1.3, repeat: Infinity, repeatType: "reverse" }}
        />
        {[[56, 0], [264, 28], [228, 272], [92, 296]].map(([cx, cy], index) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="8"
            fill="#72ffe2"
            variants={nodeVariants}
            custom={index}
          />
        ))}
        <motion.circle
          cx="160"
          cy="160"
          r="14"
          fill="#ffffff"
          opacity="0.92"
          animate={{ scale: [1, 1.08, 1], opacity: [0.95, 1, 0.95] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror" }}
        />
      </motion.svg>
    </motion.div>
  );
};

export default BigRevealAnimation;
