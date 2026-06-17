import React from "react";
import PropTypes from "prop-types";
import "./BigRevealAnimation.css";

const BigRevealAnimation = ({ score }) => {
  return (
    <div className="big-reveal-animation">
      <div className="big-reveal-score-container">
        <div className="big-reveal-score">{score}</div>
        <div className="big-reveal-shimmer" />
      </div>
    </div>
  );
};

BigRevealAnimation.propTypes = {
  score: PropTypes.number,
};

export default BigRevealAnimation;