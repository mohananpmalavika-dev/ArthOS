import React, { useState, useMemo } from "react";
import { getMilestoneStats, getAllBadgeDefs } from "../engines/milestoneEngine.js";
import { Sparkles, Trophy, Lock } from "lucide-react";

/**
 * BadgeDisplay — shows all milestones with unlocked/locked state.
 * Compact variant for sidebar, full variant for dedicated page.
 */
export default function BadgeDisplay({ compact = false, newlyUnlocked = [], onDismissMilestone }) {
  const stats = useMemo(() => getMilestoneStats(), []);
  const [showAll, setShowAll] = useState(false);

  if (compact) {
    // Compact sidebar version
    return (
      <div className="badge-display-compact">
        <div className="badge-compact-header">
          <Trophy size={16} />
          <span>Achievements</span>
          <span className="badge-count">
            {stats.unlockedCount}/{stats.totalCount}
          </span>
        </div>
        {stats.unlockedCount > 0 && (
          <div className="badge-compact-grid">
            {stats.unlockedBadges.slice(0, 5).map(badge => (
              <div
                key={badge.id}
                className="badge-chip"
                title={`${badge.label}: ${badge.description}`}
              >
                <span>{badge.icon}</span>
              </div>
            ))}
            {stats.unlockedBadges.length > 5 && (
              <div className="badge-chip badge-chip-more">+{stats.unlockedBadges.length - 5}</div>
            )}
          </div>
        )}
        <div className="badge-progress-bar">
          <div className="badge-progress-fill" style={{ width: `${stats.progress}%` }} />
        </div>
        <button type="button" className="badge-view-all" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Hide" : "View all badges"}
        </button>

        {showAll && (
          <div className="badge-full-list-compact">
            {getAllBadgeDefs().map(badge => {
              const isUnlocked = stats.unlockedBadges.some(b => b.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`badge-full-item ${isUnlocked ? "unlocked" : "locked"}`}
                >
                  <span className="badge-full-icon">
                    {isUnlocked ? badge.icon : <Lock size={14} />}
                  </span>
                  <div className="badge-full-info">
                    <strong>{badge.label}</strong>
                    <span>{badge.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Newly unlocked milestone popup */}
        {newlyUnlocked.length > 0 && (
          <div className="milestone-popup">
            {newlyUnlocked.map(badge => (
              <div key={badge.id} className="milestone-popup-card">
                <div className="milestone-popup-icon">{badge.icon}</div>
                <div className="milestone-popup-content">
                  <strong>New Badge Unlocked!</strong>
                  <span>{badge.label}</span>
                  <small>{badge.description}</small>
                </div>
                <button
                  type="button"
                  className="milestone-popup-dismiss"
                  onClick={() => onDismissMilestone?.(badge.id)}
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full version (for dedicated milestone page)
  return (
    <section className="badge-display-full">
      <div className="badge-full-header">
        <Sparkles size={22} />
        <h2>Achievements & Milestones</h2>
        <span className="badge-full-count">
          {stats.unlockedCount}/{stats.totalCount} unlocked
        </span>
      </div>
      <div className="badge-full-progress">
        <div className="badge-progress-bar large">
          <div className="badge-progress-fill" style={{ width: `${stats.progress}%` }} />
        </div>
        <span>{stats.progress}% complete</span>
      </div>
      <div className="badge-full-grid">
        {getAllBadgeDefs().map(badge => {
          const isUnlocked = stats.unlockedBadges.some(b => b.id === badge.id);
          return (
            <div key={badge.id} className={`badge-full-card ${isUnlocked ? "unlocked" : "locked"}`}>
              <div className="badge-full-card-icon">{isUnlocked ? badge.icon : "🔒"}</div>
              <strong>{badge.label}</strong>
              <span>{badge.description}</span>
              {isUnlocked && <span className="badge-check">✓ Unlocked</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
