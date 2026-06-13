import React from "react";
import PropTypes from "prop-types";

function SurvivalHero({ survivalMonths = 0 }) {
  const days = Math.max(0, Math.round(survivalMonths * 30));

  return (
    <section className="survival-hero result-card">
      <div className="survival-inner">
        <div className="survival-label">If income stops today</div>
        <div className="survival-days">{days}</div>
        <div className="survival-sub">Days</div>
        <div className="survival-title">Financial Survival Window</div>
      </div>
    </section>
  );
}

SurvivalHero.propTypes = {
  survivalMonths: PropTypes.number
};

SurvivalHero.defaultProps = {
  survivalMonths: 0
};

export default SurvivalHero;
