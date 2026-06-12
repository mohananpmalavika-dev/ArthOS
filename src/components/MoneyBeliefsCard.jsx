import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';

export function MoneyBeliefsCard({ moneyBeliefs }) {
  if (!moneyBeliefs || !moneyBeliefs.beliefs) return null;

  const beliefScores = moneyBeliefs.beliefScores || {};

  const getDimensionColor = (score) => {
    if (score > 70) return 'var(--purple)';
    if (score > 50) return 'var(--blue)';
    if (score > 30) return 'var(--orange)';
    return 'var(--red)';
  };

  const dimensions = [
    { key: 'scarcityVsAbundance', label: 'Scarcity vs Abundance', icon: '🌊' },
    { key: 'moneyAsIdentity', label: 'Money as Identity', icon: '🎭' },
    { key: 'moneyAsSecurity', label: 'Money as Security', icon: '🔒' },
    { key: 'moneyAsFreedom', label: 'Money as Freedom', icon: '🦅' },
  ];

  return (
    <div className="cognition-card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <Lightbulb size={20} style={{ marginRight: '8px', color: 'var(--blue-700)' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Money Belief Dimensions</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dimensions.map(({ key, label, icon }) => {
          const score = beliefScores[key] || 50;
          const color = getDimensionColor(score);

          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-strong)' }}>
                  {icon} {label}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '600', color }}>
                  {score}/100
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--gray-100)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${score}%`,
                  height: '100%',
                  backgroundColor: color,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {moneyBeliefs.beliefs && moneyBeliefs.beliefs.length > 0 && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--purple-50)', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--purple-700)', display: 'flex', gap: '8px', alignItems: 'start' }}>
            <BookOpen size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Your Beliefs:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '11px' }}>
                {moneyBeliefs.beliefs.map((b, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoneyBeliefsCard;
