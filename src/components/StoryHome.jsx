import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Zap,
  Heart,
  Wallet,
  Target,
  Brain,
  ArrowRight
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";
import FutureYou from "./FutureYou.jsx";
import { motion, AnimatePresence } from "framer-motion";

const sectionMotion = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const itemMotion = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const easeOut = [0.22, 1, 0.36, 1];

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function StoryHome({ result, assessment, onCoachOpen }) {
  const [expandedReason, setExpandedReason] = useState(null);
  const [actionExpanded, setActionExpanded] = useState(false);
  const [showCoachSuggestions, setShowCoachSuggestions] = useState(false);

  const currentScore = useMemo(
    () => clampScore((result?.healthScore ?? 0) / 10),
    [result]
  );

  const scoreChange = useMemo(() => {
    const prev = result?.previousHealthScore || currentScore;
    const change = Math.round((currentScore - prev) / 10);
    return { value: change, direction: change >= 0 ? "up" : "down" };
  }, [result, currentScore]);

  const emotionalNarrative = useMemo(() => {
    if (currentScore >= 80) return "You're in strong shape.";
    if (currentScore >= 60) return "You're recovering well.";
    if (currentScore >= 40) return "You have momentum to improve.";
    return "There's opportunity here.";
  }, [currentScore]);

  const realityCard = useMemo(() => {
    const runway = result?.survivalMonthsDisplay || "0";
    const risks = result?.riskProfile || {};
    const risks_list = risks?.drivers || [];
    const strengths = result?.strengths || [];

    const biggestRisk = risks_list?.[0]?.label || "Spending Pattern";
    const biggestStrength = strengths?.[0]?.label || "Consistent Income";

    return {
      health: currentScore,
      runway: runway,
      risk: biggestRisk,
      strength: biggestStrength
    };
  }, [result, currentScore]);

  const topReasons = useMemo(() => {
    const reasons = [];
    const biases = result?.biases || [];
    const beliefs = result?.moneyBeliefs || [];
    const riskDrivers = result?.riskProfile?.drivers || [];

    biases.slice(0, 1).forEach(bias => {
      reasons.push({
        id: `bias-${bias.name}`,
        label: bias.name || "Cognitive bias",
        detail: bias.description || "This pattern affects your decisions.",
        impact: Math.round((bias.severity || 0.5) * 20),
        icon: "brain"
      });
    });

    riskDrivers.slice(0, 2).forEach(driver => {
      reasons.push({
        id: `risk-${driver.label}`,
        label: driver.label || "Risk Factor",
        detail: driver.description || "This is impacting your score.",
        impact: Math.round((driver.severity || 0.5) * 20),
        icon: "alert"
      });
    });

    return reasons.slice(0, 3);
  }, [result]);

  const timelineData = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const decline = [0, -3, -8, -12].map(delta => clampScore(currentScore + delta));
    const improve = [0, 6, 14, 24].map(delta => clampScore(currentScore + delta));

    return [
      { year: `${baseYear}`, current: decline[0], recommended: improve[0], label: "Now" },
      { year: `${baseYear + 1}`, current: decline[1], recommended: improve[1], label: "1Y" },
      { year: `${baseYear + 2}`, current: decline[2], recommended: improve[2], label: "2Y" },
      { year: `${baseYear + 3}`, current: decline[3], recommended: improve[3], label: "3Y" }
    ];
  }, [currentScore]);

  const actionCard = useMemo(() => {
    const recommendation = result?.topRecommendation || {};
    return {
      action: recommendation?.action || "Save ₹2,000",
      week: "THIS WEEK",
      impacts: [
        { metric: "Health", change: "+7", tone: "positive" },
        { metric: "Runway", change: "+2 mo", tone: "positive" },
        { metric: "Risk", change: "-10", tone: "positive" }
      ]
    };
  }, [result]);

  const futureYouCard = useMemo(() => {
    const age = (assessment?.age || 30) + 5;
    return {
      age: age,
      emergency: "₹4.3L",
      debt: "₹0",
      stress: "Low"
    };
  }, [assessment]);

  return (
    <section className="story-home">
      {/* ════════════════════════════════════════════════
          HI‑TECH HERO
          ════════════════════════════════════════════════ */}
      <motion.section
        className="hi-tech-hero"
        initial="hidden"
        animate="visible"
        variants={sectionMotion}
        transition={{ duration: 0.72, ease: easeOut }}
      >
        <div className="particle-field" aria-hidden="true" />
        <motion.div
          className="hero-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.14 } } }}
        >
          <motion.div
            style={{ textAlign: "center" }}
            variants={itemMotion}
          >
            <div className="hero-title">YOUR FINANCIAL OPERATING SYSTEM</div>
            <h2 className="hero-subtitle">Score: <span style={{ opacity: 0.98 }}>{currentScore}</span></h2>
            <div className="score-meta">↗ {scoreChange.direction === 'up' ? Math.abs(scoreChange.value) : `-${Math.abs(scoreChange.value)}`} this month • You're outperforming 73% of people like you</div>
          </motion.div>

          <motion.div
            style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}
            variants={itemMotion}
          >
            <motion.div className="score-ring" style={{ ["--score"]: currentScore }}
              initial={{ scale: 0.98, rotate: 0 }}
              animate={{ scale: [1, 1.03, 1], rotate: [0, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="score-inner">
                <motion.div className="score-number-hero" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                  {currentScore}
                </motion.div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Financial Health</div>
              </div>
            </motion.div>

            <motion.div style={{ display: "grid", gap: 12 }} variants={itemMotion}>
              <motion.div className="mini-glass-row" variants={itemMotion} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className="mini-glass">
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Cashflow</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{result?.cashflowDisplay || '₹0'}</div>
                </div>
                <div className="mini-glass">
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Runway</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{result?.survivalMonthsDisplay || '0'} mo</div>
                </div>
                <div className="mini-glass">
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Risk</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{realityCard.risk}</div>
                </div>
              </motion.div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="hero-cta" onClick={() => document.getElementById('future')?.scrollIntoView({ behavior: 'smooth' })}>View Future</button>
                <button className="hero-cta" onClick={() => onCoachOpen && onCoachOpen()}>Open Coach</button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ════════════════════════════════════════════════
          SECTION 1: REALITY (TODAY)
          ════════════════════════════════════════════════ */}
      <motion.div
        className="story-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionMotion}
        transition={{ duration: 0.65, ease: easeOut }}
      >
        <h2 className="section-title">TODAY</h2>
        <motion.div className="reality-card compact" variants={itemMotion}>
          <div className="mini-glass-row" style={{ justifyContent: 'space-between' }}>
            <div className="mini-glass">
              <div style={{ fontSize: 12, opacity: 0.8 }}>Financial Health</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{currentScore}</div>
            </div>
            <div className="mini-glass">
              <div style={{ fontSize: 12, opacity: 0.8 }}>Cashflow</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{result?.cashflowDisplay || '₹0'}</div>
            </div>
            <div className="mini-glass">
              <div style={{ fontSize: 12, opacity: 0.8 }}>Runway</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{realityCard.runway} mo</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <button className="hero-cta" onClick={() => onCoachOpen && onCoachOpen('today')}>Talk to Coach</button>
          </div>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════
          SECTION 2: WHY (Top 3 Reasons)
          ════════════════════════════════════════════════ */}
      <motion.div
        className="story-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionMotion}
        transition={{ duration: 0.65, ease: easeOut }}
      >
        <h2 className="section-title">Why your score isn't higher</h2>

        <motion.div className="reasons-list" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">
          {topReasons.map((reason, idx) => (
            <motion.div key={reason.id} className="reason-card" variants={itemMotion}>
              <div
                className="reason-header"
                onClick={() => setExpandedReason(expandedReason === reason.id ? null : reason.id)}
              >
                <div className="reason-icon">
                  {reason.icon === "brain" ? (
                    <Brain size={18} color="var(--purple)" />
                  ) : (
                    <AlertCircle size={18} color="var(--orange)" />
                  )}
                </div>

                <div className="reason-content">
                  <span className="reason-label">{reason.label}</span>
                  <span className="reason-impact">Impact -{reason.impact}</span>
                </div>

                <ChevronDown
                  size={18}
                  style={{
                    transform: expandedReason === reason.id ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease"
                  }}
                />
              </div>

              {expandedReason === reason.id && (
                <div className="reason-detail">
                  <p>{reason.detail}</p>
                  <button
                    className="reason-action"
                    onClick={event => {
                      event.stopPropagation();
                      onCoachOpen(reason.label);
                    }}
                  >
                    Fix it
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 3: FUTURE (Trajectory)
          ════════════════════════════════════════════════ */}
      <div className="story-section">
        <h2 className="section-title">Your Future</h2>

        <TrajectoryHeroVisual data={timelineData} result={result} assessment={assessment} />
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 4: FINANCIAL TWIN
          ════════════════════════════════════════════════ */}
      <motion.div
        className="story-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionMotion}
        transition={{ duration: 0.65, ease: easeOut }}
      >
        <h2 className="section-title">Your Future</h2>

        <motion.div id="future" variants={itemMotion}>
          <FutureYou data={futureYouCard} />
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════
          SECTION 5: THIS WEEK
          ════════════════════════════════════════════════ */}
      <motion.div
        className="story-section story-action"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionMotion}
        transition={{ duration: 0.65, ease: easeOut }}
      >
        <h2 className="section-title">This Week</h2>

        <motion.div className="action-card compact-action" variants={itemMotion}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Zap size={28} color="var(--cyan)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{actionCard.action}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{actionCard.week}</div>
            </div>
            <button className="hero-cta" onClick={() => setActionExpanded(!actionExpanded)}>
              {actionExpanded ? 'Hide' : "Today's Move"}
            </button>
          </div>

          {actionExpanded && (
            <motion.div style={{ marginTop: 12, display: 'flex', gap: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              {actionCard.impacts.map((impact, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--gray-100)', minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{impact.metric}</div>
                  <div style={{ fontWeight: 700 }}>{impact.change}</div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════
          FLOATING COACH
          ════════════════════════════════════════════════ */}
      <motion.div className="floating-coach" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.66, ease: easeOut }}>
        <div style={{ position: 'relative' }}>
          <motion.button
            className="coach-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onCoachOpen) onCoachOpen();
              setShowCoachSuggestions(false);
            }}
            title="Open Coach"
            onMouseEnter={() => setShowCoachSuggestions(true)}
            onMouseLeave={() => setShowCoachSuggestions(false)}
          >
            <MessageCircle size={20} />
          </motion.button>

          <AnimatePresence>
            {showCoachSuggestions && (
              <motion.div className="coach-suggestions" role="dialog" aria-label="Coach suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.18, ease: easeOut }}>
                <button onClick={() => onCoachOpen && onCoachOpen('cashflow')}>Improve Cashflow</button>
                <button onClick={() => onCoachOpen && onCoachOpen('runway')}>Extend Runway</button>
                <button onClick={() => onCoachOpen && onCoachOpen('reduce-risk')}>Reduce Risk</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
