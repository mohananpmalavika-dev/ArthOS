import React from "react";
import { Link } from "react-router-dom";
import BigRevealAnimation from "../components/BigRevealAnimation";
import "./big-reveal.css";

const BigRevealPage = () => {
  // This is a placeholder score. In a real application, you would fetch this
  // from a data source.
  const score = 88;

  return (
    <div className="big-reveal-page">
      <Link to="/dashboard" className="big-reveal-skip-button">
        Skip
      </Link>
      <BigRevealAnimation score={score} />
      <Link to="/dashboard" className="big-reveal-button">
        View Dashboard
      </Link>
    </div>
  );
};

export default BigRevealPage;