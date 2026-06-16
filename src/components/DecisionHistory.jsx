import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function DecisionHistory({ userId = "demo", refreshSignal = 0 }) {
  const { token, isAuthenticated } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setDecisions([]);
      setTrend(null);
      return;
    }

    let mounted = true;
    async function load() {
      if (mounted) {
        setLoading(true);
      }
      try {
        const res = await fetch(`/api/decision`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error("Failed to load");
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          if (mounted) {
            setDecisions([]);
          }
          return;
        }
        const json = await res.json();
        if (mounted) {
          setDecisions(json.decisions || []);
          setTrend(json.trend || null);
        }
      } catch (err) {
        console.warn("Could not load decisions", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId, refreshSignal, isAuthenticated, token]);

  function formatRelativeTime(ts) {
    try {
      const then = new Date(ts);
      const diff = Date.now() - then.getTime();
      const s = Math.floor(diff / 1000);
      if (s < 60) {
        return `${s}s ago`;
      }
      const m = Math.floor(s / 60);
      if (m < 60) {
        return `${m}m ago`;
      }
      const h = Math.floor(m / 60);
      if (h < 24) {
        return `${h}h ago`;
      }
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch (e) {
      return "";
    }
  }

  return (
    <div className="decision-history summary-card premium-report-block">
      <div className="premium-report-block-header">
        <h3 className="premium-report-block-title">Decision History</h3>
      </div>
      {trend && !loading && (
        <div className="decision-trend-banner">
          <span className="decision-trend-pill">{trend.trend}</span>
          <span className="decision-trend-note">Avg quality {trend.currentScore}%</span>
        </div>
      )}
      {loading && <div className="decision-empty-state">Loading…</div>}
      {!loading && decisions.length === 0 && (
        <div className="decision-empty-state">No decisions yet</div>
      )}
      <ul className="decision-history-list">
        {decisions.map((d, i) => (
          <li key={i} className="decision-history-item">
            <div className="decision-history-meta">
              <div>
                <div className="decision-history-category">{d.category}</div>
                {d.overallDecisionQuality !== undefined && (
                  <div className="decision-history-quality">
                    Quality {Math.round(d.overallDecisionQuality)}%
                  </div>
                )}
              </div>
              <div
                className="decision-history-timestamp"
                title={new Date(d.recorded_at || d.timestamp || Date.now()).toLocaleString()}
              >
                {formatRelativeTime(d.recorded_at || d.timestamp || Date.now())}
              </div>
            </div>
            <div className="decision-history-notes">{d.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
