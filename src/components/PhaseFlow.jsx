import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PhaseContainer from './PhaseContainer';
import DiscoverPhase from './DiscoverPhase';
import UnderstandPhase from './UnderstandPhase';
import OptimizePhase from './OptimizePhase';
import ExecutePhase from './ExecutePhase';
import AdvancedFeaturesDrawer from './AdvancedFeaturesDrawer';
import '../styles-phases.css';

export default function PhaseFlow() {
  const [assessmentData, setAssessmentData] = useState(null);
  const [completedPhases, setCompletedPhases] = useState([]);
  const { logout } = useAuth();

  const handleDiscoverComplete = useCallback((data) => {
    setAssessmentData(data);
    setCompletedPhases(['discover']);
  }, []);

  const handlePhaseComplete = useCallback((phaseName) => {
    setCompletedPhases(prev =>
      prev.includes(phaseName) ? prev : [...prev, phaseName]
    );
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Logout Button */}
      <button
        onClick={logout}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          padding: '0.5rem 1rem',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '6px',
          color: '#ff6b6b',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(255, 107, 107, 0.15)';
          e.target.style.borderColor = 'rgba(255, 107, 107, 0.5)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'rgba(255, 107, 107, 0.1)';
          e.target.style.borderColor = 'rgba(255, 107, 107, 0.3)';
        }}
      >
        Sign Out
      </button>

      <PhaseContainer initialPhase="discover">
        {({ phase, handleNext, handleBack, handlePhaseJump }) => (
        <>
          {phase === 'discover' && (
            <DiscoverPhase
              handleNext={() => {
                handlePhaseComplete('discover');
                handleNext();
              }}
              onComplete={(data) => {
                setAssessmentData(data);
              }}
            />
          )}

          {phase === 'understand' && (
            <UnderstandPhase
              assessmentData={assessmentData}
              handleNext={() => {
                handlePhaseComplete('understand');
                handleNext();
              }}
            />
          )}

          {phase === 'optimize' && (
            <OptimizePhase
              assessmentData={assessmentData}
              handleNext={() => {
                handlePhaseComplete('optimize');
                handleNext();
              }}
            />
          )}

          {phase === 'execute' && (
            <ExecutePhase
              assessmentData={assessmentData}
            />
          )}

          <AdvancedFeaturesDrawer assessmentData={assessmentData} />
        </>
      )}
    </PhaseContainer>
    </div>
  );
}
