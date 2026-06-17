import React from "react";
import PropTypes from "prop-types";

const BigReveal = ({ score }) => {
  return (
    <div className="big-reveal">
      <div className="big-reveal-score">{score}</div>
    </div>
  );
};

BigReveal.propTypes = {
  score: PropTypes.number,
};

export default BigReveal;