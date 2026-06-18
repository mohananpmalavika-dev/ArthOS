import React, { useState } from 'react';
import PhaseIndicator from './PhaseIndicator';
import PhaseNavigation from './PhaseNavigation';

export default function PhaseContainer({ initialPhase = 'discover', children }) {
  const [currentPhase, setCurrentPhase] = useState(initialPhase);

  const phases = ['discover', 'understand', 'optimize', 'execute'];
  const phaseIndex = phases.indexOf(currentPhase);

  const handleNext = () => {
    if (phaseIndex < phases.length - 1) {
      setCurrentPhase(phases[phaseIndex + 1]);
    }
  };

  const handleBack = () => {
    if (phaseIndex > 0) {
      setCurrentPhase(phases[phaseIndex - 1]);
    }
  };

  const handlePhaseJump = (phase) => {
    if (phases.includes(phase)) {
      setCurrentPhase(phase);
    }
  };

  return (
    <div className="phase-container">
      <PhaseIndicator currentPhase={currentPhase} onPhaseJump={handlePhaseJump} />

      <div className="phase-content">
        {children && typeof children === 'function'
          ? children({
              phase: currentPhase,
              handleNext,
              handleBack,
              handlePhaseJump
            })
          : children}
      </div>

      <PhaseNavigation
        currentPhase={currentPhase}
        onNext={handleNext}
        onBack={handleBack}
        isFirstPhase={phaseIndex === 0}
        isLastPhase={phaseIndex === phases.length - 1}
      />
    </div>
  );
}
