import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BigRevealAnimation from "../components/BigRevealAnimation";
import { useAuth } from "../context/AuthContext.jsx";
import "./big-reveal.css";

const BigRevealPage = () => {
  const { user } = useAuth();
  const [score, setScore] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadScore() {
      if (!user || !user.id) {
        setScore(null);
        return;
      }

      try {
        const res = await fetch(`/api/user/${encodeURIComponent(user.id)}/score`);
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const healthScore = Number(data.healthScore ?? data.health_score ?? 0);
          setScore(Math.max(0, Math.min(100, Math.round(healthScore))));
        }
      } catch (error) {
        // Leave score null when the score endpoint is unavailable.
        console.error("Failed loading health score", error);
      }
    }

    void loadScore();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="big-reveal-page">
      <Link to="/dashboard/home" className="big-reveal-skip-button">
        Skip
      </Link>
      <section className="big-reveal-stage" aria-labelledby="big-reveal-page-title">
        <div className="big-reveal-copy">
          <p>Score reveal</p>
          <h1 id="big-reveal-page-title">Your ARTH.OS financial health score is ready.</h1>
          <span>
            This score compresses behavior, runway, stability, and awareness into one command
            signal.
          </span>
        </div>
        <BigRevealAnimation score={score} />
        <Link to="/dashboard/home" className="big-reveal-button">
          View Dashboard
        </Link>
      </section>
    </div>
  );
};

export default BigRevealPage;
