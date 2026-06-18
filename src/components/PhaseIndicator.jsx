import React from 'react';

export default function PhaseIndicator({ currentPhase, onPhaseJump }) {
  const phases = [
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'understand', label: 'Understand', icon: '💡' },
    { id: 'optimize', label: 'Optimize', icon: '🎯' },
    { id: 'execute', label: 'Execute', icon: '🚀' }
  ];

  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="phase-indicator-wrapper">
      <div className="phase-indicator">
        {phases.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <button
              className={`phase-dot ${phase.id === currentPhase ? 'active' : ''} ${
                index < currentIndex ? 'completed' : ''
              }`}
              onClick={() => onPhaseJump && onPhaseJump(phase.id)}
              title={phase.label}
            >
              <span className="phase-icon">{phase.icon}</span>
              <span className="phase-label">{phase.label}</span>
            </button>

            {index < phases.length - 1 && (
              <div className={`phase-connector ${index < currentIndex ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="phase-progress-text">
        <span className="phase-current">{phases[currentIndex].label}</span>
        <span className="phase-count">
          {currentIndex + 1}/{phases.length}
        </span>
      </div>
    </div>
  );
}
