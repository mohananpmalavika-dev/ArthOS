import React from 'react';

export default function PhaseNavigation({
  currentPhase,
  onNext,
  onBack,
  isFirstPhase,
  isLastPhase
}) {
  const phaseLabels = {
    discover: 'Discover',
    understand: 'Understand',
    optimize: 'Optimize',
    execute: 'Execute'
  };

  const nextPhaseLabels = {
    discover: 'Go to Understanding',
    understand: 'Create Scenarios',
    optimize: 'Start Executing',
    execute: 'View History'
  };

  return (
    <div className="phase-navigation-wrapper">
      <div className="phase-navigation">
        {!isFirstPhase && (
          <button className="phase-nav-btn phase-nav-back" onClick={onBack}>
            <span className="phase-nav-arrow">←</span>
            <span className="phase-nav-text">Back</span>
          </button>
        )}

        <div className="phase-nav-spacer" />

        {!isLastPhase && (
          <button className="phase-nav-btn phase-nav-next" onClick={onNext}>
            <span className="phase-nav-text">{nextPhaseLabels[currentPhase] || 'Next'}</span>
            <span className="phase-nav-arrow">→</span>
          </button>
        )}

        {isLastPhase && (
          <button className="phase-nav-btn phase-nav-restart" onClick={() => window.location.reload()}>
            <span className="phase-nav-text">Start Over</span>
            <span className="phase-nav-arrow">↻</span>
          </button>
        )}
      </div>
    </div>
  );
}
