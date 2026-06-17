import React from "react";
import PropTypes from "prop-types";
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const BigReveal = ({
  score,
  scoreLabel = "Live profile",
  runway = "0",
  cashflow = "INR 0",
  outlook = "Future risk",
  onCoachOpen
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score || 0)));

  return (
    <section className="cinematic-hero big-reveal" aria-labelledby="big-reveal-title">
      <div className="cinematic-mesh" aria-hidden="true" />
      <div className="cinematic-grid" aria-hidden="true" />

      <div className="cinematic-content">
        <div className="cinematic-left">
          <p className="cinematic-system-line">Financial Health OS</p>
          <h1 id="big-reveal-title" className="cinematic-title">
            Your money system, decoded into one operating score.
          </h1>
          <p className="cinematic-lede">
            ARTH.OS turns income, runway, behaviour, and risk into a clear command center so the
            next financial move is obvious.
          </p>

          <div className="cinematic-metrics" aria-label="Current financial signals">
            <span className="metric-delta">
              <TrendingUp size={16} aria-hidden="true" />
              {scoreLabel}
            </span>
            <span className="metric-percent">
              <ShieldCheck size={16} aria-hidden="true" />
              {runway} mo runway
            </span>
          </div>

          <div className="cinematic-cta-row">
            <a className="hero-cta" href="#journey">
              View Dashboard
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <button className="hero-secondary" type="button" onClick={() => onCoachOpen?.("start")}>
              <MessageCircle size={17} aria-hidden="true" />
              Open AI Coach
            </button>
          </div>
        </div>

        <div className="cinematic-right" aria-label={`Financial health score ${normalizedScore}`}>
          <div className="score-ring-large" style={{ "--score": normalizedScore }}>
            <div className="score-inner-large">
              <Sparkles size={22} aria-hidden="true" />
              <span className="score-number-hero-large">{normalizedScore}</span>
              <span className="score-label-large">Health score</span>
            </div>
          </div>
          <div className="hero-signal-stack">
            <div>
              <span>Cashflow</span>
              <strong>{cashflow}</strong>
            </div>
            <div>
              <span>Outlook</span>
              <strong>{outlook}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

BigReveal.propTypes = {
  score: PropTypes.number,
  scoreLabel: PropTypes.string,
  runway: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  cashflow: PropTypes.string,
  outlook: PropTypes.string,
  onCoachOpen: PropTypes.func
};

export default BigReveal;
