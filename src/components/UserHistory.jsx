// src/components/UserHistory.jsx
// Track and display financial health score progression over time

import React, { useState, useEffect } from "react";
import { TrendingUp, Calendar, Award } from "lucide-react";

export default function UserHistory({ currentScore, personalityType, className }) {
  const [history, setHistory] = useState([]);
  const [timespan, setTimespan] = useState("all");

  useEffect(() => {
    // Load history from localStorage
    try {
      const saved = window.localStorage.getItem("arth-os-score-history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load score history:", e);
    }
  }, []);

  // Save current score to history when it changes
  useEffect(() => {
    if (currentScore !== undefined && currentScore !== null) {
      try {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        
        // Check if we already have a score for today
        const todayEntry = history.find(h => h.date === today);
        
        let updated;
        if (todayEntry) {
          // Update today's entry
          updated = history.map(h => 
            h.date === today ? { ...h, score: currentScore } : h
          );
        } else {
          // Add new entry
          updated = [...history, { date: today, score: currentScore }];
        }

        setHistory(updated);
        window.localStorage.setItem("arth-os-score-history", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save score to history:", e);
      }
    }
  }, [currentScore]);

  // Filter history by timespan
  const getFilteredHistory = () => {
    if (!history.length) return [];
    
    const now = new Date();
    let cutoffDate = new Date();

    switch (timespan) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default: // "all"
        return history;
    }

    return history.filter(h => new Date(h.date) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();
  
  // Calculate statistics
  const getStats = () => {
    if (!filteredHistory.length) return { avg: 0, min: 0, max: 0, trend: 0 };
    
    const scores = filteredHistory.map(h => h.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    
    // Trend: compare first to last
    const first = scores[0];
    const last = scores[scores.length - 1];
    const trend = last - first;
    
    return { avg, min, max, trend };
  };

  const stats = getStats();
  const hasTrend = stats.trend !== 0;

  return (
    <section className={`result-card user-history-card ${className || ""}`}>
      <div className="result-heading">
        <Calendar size={19} />
        <h2>Your Progress Journey</h2>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="history-empty">
          <p>No history yet. Complete an assessment to start tracking your progress.</p>
        </div>
      ) : (
        <>
          {/* Timespan selector */}
          <div className="history-timespan-tabs">
            {["week", "month", "quarter", "all"].map((span) => (
              <button
                key={span}
                className={`timespan-tab ${timespan === span ? "active" : ""}`}
                onClick={() => setTimespan(span)}
              >
                {span === "week" ? "7D" : span === "month" ? "30D" : span === "quarter" ? "90D" : "All"}
              </button>
            ))}
          </div>

          {/* Stats grid */}
          <div className="history-stats-grid">
            <div className="history-stat">
              <span className="stat-label">Current</span>
              <strong className="stat-value current">{Math.round(currentScore)}</strong>
            </div>
            <div className="history-stat">
              <span className="stat-label">Average</span>
              <strong className="stat-value">{stats.avg}</strong>
            </div>
            <div className="history-stat">
              <span className="stat-label">High</span>
              <strong className="stat-value high">{stats.max}</strong>
            </div>
            <div className="history-stat">
              <span className="stat-label">Low</span>
              <strong className="stat-value low">{stats.min}</strong>
            </div>
          </div>

          {/* Trend indicator */}
          {hasTrend && (
            <div className={`history-trend ${stats.trend > 0 ? "positive" : "negative"}`}>
              <TrendingUp size={16} />
              <span>
                {stats.trend > 0 ? "+" : ""}{stats.trend} points since {filteredHistory[0].date}
              </span>
            </div>
          )}

          {/* Timeline visualization */}
          <div className="history-timeline">
            <div className="timeline-header">
              <span className="timeline-label">Score Timeline</span>
              <span className="timeline-count">{filteredHistory.length} assessments</span>
            </div>
            
            <div className="timeline-bars">
              {filteredHistory.map((entry, idx) => {
                const isLatest = idx === filteredHistory.length - 1;
                const maxScore = Math.max(...filteredHistory.map(h => h.score), 100);
                const barHeight = (entry.score / maxScore) * 100;
                
                return (
                  <div key={entry.date} className="timeline-bar-wrapper" title={`${entry.date}: ${entry.score}`}>
                    <div
                      className={`timeline-bar ${isLatest ? "latest" : ""}`}
                      style={{ height: `${barHeight}%` }}
                    >
                      <span className="bar-score">{entry.score}</span>
                    </div>
                    <span className="bar-date">{new Date(entry.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent entries list */}
          <div className="history-recent">
            <span className="recent-label">Recent Scores</span>
            <div className="recent-list">
              {filteredHistory.slice(-5).reverse().map((entry) => (
                <div key={entry.date} className="recent-item">
                  <span className="recent-date">{new Date(entry.date).toLocaleDateString("en-IN")}</span>
                  <span className="recent-score">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
