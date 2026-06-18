import React, { useState } from 'react';
import DecisionSimulator from './DecisionSimulator';
import ConsequenceForecastCard from './ConsequenceForecastCard';
import FinancialWeatherCard from './FinancialWeatherCard';

export default function OptimizePhase({ assessmentData, handleNext }) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);

  const predefinedScenarios = [
    {
      id: 'save-more',
      title: 'Increase Savings Rate',
      description: 'Save 20% of income instead of current rate',
      icon: '💰',
      changes: {
        monthlySavings: assessmentData?.monthlySavings * 1.5 || 500
      }
    },
    {
      id: 'debt-payoff',
      title: 'Accelerated Debt Payoff',
      description: 'Pay off debt in 24 months instead of default timeline',
      icon: '🚀',
      changes: {
        monthlyDebtPayment: (assessmentData?.totalDebt || 10000) / 24
      }
    },
    {
      id: 'emergency-fund',
      title: 'Build Emergency Fund',
      description: 'Reach 6 months of expenses in emergency savings',
      icon: '🛡️',
      changes: {
        emergencyFundTarget: (assessmentData?.monthlyExpenses || 3000) * 6
      }
    },
    {
      id: 'career-boost',
      title: 'Career Growth Plan',
      description: 'Increase income by 15% through career advancement',
      icon: '📈',
      changes: {
        monthlyIncome: (assessmentData?.monthlyIncome || 5000) * 1.15
      }
    }
  ];

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
  };

  const handleSavePlan = (plan) => {
    setSavedPlans([...savedPlans, { ...plan, savedAt: new Date() }]);
  };

  return (
    <div className="optimize-phase">
      <h1 className="optimize-title">Test Your Decisions</h1>
      <p className="optimize-subtitle">
        Explore different scenarios and see how they impact your financial future.
      </p>

      {/* Predefined Scenarios */}
      <div className="optimize-section">
        <h2 className="optimize-section-title">Quick Scenarios</h2>
        <p className="optimize-section-desc">
          Select a scenario to see the impact on your financial health over time.
        </p>

        <div className="scenarios-grid">
          {predefinedScenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
              onClick={() => handleScenarioSelect(scenario)}
            >
              <span className="scenario-icon">{scenario.icon}</span>
              <h3 className="scenario-title">{scenario.title}</h3>
              <p className="scenario-description">{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Results */}
      {selectedScenario && (
        <div className="optimize-section optimize-results">
          <h2 className="optimize-section-title">Impact Timeline</h2>

          <div className="timeline-grid">
            <div className="timeline-point">
              <span className="timeline-label">Today</span>
              <div className="timeline-value">
                <p className="timeline-score">{assessmentData?.healthScore || 600}</p>
                <p className="timeline-band">{assessmentData?.healthBand}</p>
              </div>
            </div>

            <div className="timeline-point">
              <span className="timeline-label">1 Year</span>
              <div className="timeline-value">
                <p className="timeline-score">
                  {Math.min(assessmentData?.healthScore + 80 || 680, 900)}
                </p>
                <p className="timeline-trend">📈 +80 points</p>
              </div>
            </div>

            <div className="timeline-point">
              <span className="timeline-label">2 Years</span>
              <div className="timeline-value">
                <p className="timeline-score">
                  {Math.min(assessmentData?.healthScore + 150 || 750, 950)}
                </p>
                <p className="timeline-trend">📈 +150 points</p>
              </div>
            </div>

            <div className="timeline-point">
              <span className="timeline-label">5 Years</span>
              <div className="timeline-value">
                <p className="timeline-score">
                  {Math.min(assessmentData?.healthScore + 250 || 850, 1000)}
                </p>
                <p className="timeline-trend">🚀 Exceptional</p>
              </div>
            </div>
          </div>

          <ConsequenceForecastCard scenario={selectedScenario} data={assessmentData} />

          <FinancialWeatherCard
            currentBand={assessmentData?.healthBand}
            projectedBand="Resilient"
          />

          <button
            className="optimize-save-btn"
            onClick={() => handleSavePlan(selectedScenario)}
          >
            <span className="save-icon">💾</span>
            <span>Save This Plan</span>
          </button>
        </div>
      )}

      {/* Advanced Simulator */}
      <div className="optimize-section">
        <h2 className="optimize-section-title">Custom Scenario</h2>
        <p className="optimize-section-desc">
          Build your own scenario by adjusting key variables.
        </p>
        <DecisionSimulator data={assessmentData} />
      </div>

      {/* Next Action */}
      <div className="optimize-actions">
        <button className="optimize-next-btn" onClick={handleNext}>
          <span>Create Action Plan</span>
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}
