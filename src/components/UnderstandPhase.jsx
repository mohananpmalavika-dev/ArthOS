import React, { useState } from 'react';
import FinancialMindProfileCard from './FinancialMindProfileCard';
import BehaviourDrivers from './BehaviourDrivers';
import SingleMostImportantInsight from './SingleMostImportantInsight';
import NextBestActionCard from './NextBestActionCard';
import ExportPDF from './ExportPDF';

export default function UnderstandPhase({ assessmentData, handleNext }) {
  const [showExport, setShowExport] = useState(false);

  if (!assessmentData) {
    return (
      <div className="understand-phase">
        <div className="understand-empty">
          <p>Complete the discovery phase first to see your detailed profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="understand-phase">
      <h1 className="understand-title">Your Financial Profile</h1>
      <p className="understand-subtitle">
        Here's what your assessment reveals about your finances and mindset.
      </p>

      <div className="understand-grid">
        {/* Personality Card */}
        <div className="understand-section">
          <h2 className="understand-section-title">Your Financial Style</h2>
          <div className="personality-card" style={{
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem',
            minHeight: '150px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h3 style={{ color: 'var(--cyan)', marginBottom: '0.5rem' }}>
              {assessmentData?.result?.personalityType || assessmentData?.personalityType || 'Balanced Financial Profile'}
            </h3>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              {typeof assessmentData?.result?.personalityReport === 'string'
                ? assessmentData.result.personalityReport
                : assessmentData?.personalityReport ||
                  'Based on your assessment, you demonstrate a thoughtful approach to money. You balance between enjoying today and securing your financial future, with room for growth in financial discipline.'}
            </p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="understand-section">
          <h2 className="understand-section-title">What's Working</h2>
          <div className="insights-container">
            <div className="insight-card insight-positive">
              <span className="insight-icon">✓</span>
              <div className="insight-content">
                <p className="insight-title">
                  {assessmentData?.result?.strongestComponent?.label || assessmentData?.result?.componentRows?.[assessmentData.result.componentRows.length - 1]?.label || 'Financial Awareness'}
                </p>
                <p className="insight-description">
                  Your strongest area with a score of {assessmentData?.result?.strongestComponent?.percent || assessmentData?.result?.awarenessScore || '75'}%
                </p>
              </div>
            </div>
            <div className="insight-card insight-positive">
              <span className="insight-icon">✓</span>
              <div className="insight-content">
                <p className="insight-title">Survival Capacity</p>
                <p className="insight-description">
                  {assessmentData?.result?.survivalMonthsDisplay || '12 months'} of financial runway
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blind Spots */}
        <div className="understand-section">
          <h2 className="understand-section-title">What Needs Work</h2>
          <div className="insights-container">
            <div className="insight-card insight-warning">
              <span className="insight-icon">!</span>
              <div className="insight-content">
                <p className="insight-title">
                  {assessmentData?.result?.lowestComponent?.label || 'Financial Stability'}
                </p>
                <p className="insight-description">
                  This is your lowest-scoring area. Focus here for the biggest impact on your financial health.
                </p>
              </div>
            </div>
            {assessmentData?.result?.awarenessGap && (
              <div className="insight-card insight-warning">
                <span className="insight-icon">!</span>
                <div className="insight-content">
                  <p className="insight-title">Awareness Gap</p>
                  <p className="insight-description">
                    {assessmentData.result.awarenessGapDisplay || '3 months'} difference between your perceived and actual financial runway
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Behavior Drivers */}
        <div className="understand-section">
          <h2 className="understand-section-title">Your Spending Patterns</h2>
          <div className="behavior-summary" style={{
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              Your behavior score: <span style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{assessmentData.result?.behaviourScore || 0}</span> out of 100
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginTop: '0.5rem' }}>
              This reflects your spending discipline, impulse control, and financial decision-making patterns.
            </p>
          </div>
        </div>

        {/* Most Important Insight */}
        <div className="understand-section">
          <h2 className="understand-section-title">The One Thing</h2>
          <div className="insight-box" style={{
            background: 'rgba(128, 0, 128, 0.05)',
            border: '1px solid rgba(128, 0, 128, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6', fontStyle: 'italic' }}>
              "{assessmentData.result?.recommendedActionText || 'Focus on improving your lowest-scoring financial component this week.'}"
            </p>
          </div>
        </div>

        {/* Next Best Action */}
        <div className="understand-section understand-action-focus">
          <h2 className="understand-section-title">Your Next Step</h2>
          <div className="action-card" style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(128, 0, 128, 0.05))',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h4 style={{ color: 'var(--cyan)', marginBottom: '0.5rem' }}>
              {assessmentData.result?.lowestComponent?.label || 'Improve Your Weakest Area'}
            </h4>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              {assessmentData.result?.recommendedActionText || 'Take action on your lowest-scoring component to maximize financial impact this week.'}
            </p>
          </div>
          <p className="understand-action-subtitle">
            This is the single most impactful action you can take this week.
          </p>
        </div>
      </div>

      {/* Export & Actions */}
      <div className="understand-actions">
        <button
          className="understand-export-btn"
          onClick={() => setShowExport(true)}
        >
          <span className="export-icon">📥</span>
          <span>Download Report</span>
        </button>

        <button className="understand-next-btn" onClick={handleNext}>
          <span>See Scenarios</span>
          <span className="arrow">→</span>
        </button>
      </div>

      {showExport && <ExportPDF data={assessmentData} onClose={() => setShowExport(false)} />}
    </div>
  );
}
