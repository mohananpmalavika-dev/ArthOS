import React, { useState } from 'react';
import CognitionGraphDashboard from './CognitionGraphDashboard';
import DigitalTwinDashboard from './DigitalTwinDashboard';
import PredictionEngineDashboard from './PredictionEngineDashboard';
import AiCoachInterface from './AiCoachInterface';
import BankingIntegrationDashboard from './BankingIntegrationDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function AdvancedFeaturesDrawer({ assessmentData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const features = [
    {
      id: 'deep-dive',
      icon: '🔍',
      label: 'Deep Dive',
      description: 'Explore your financial patterns in detail',
      component: <CognitionGraphDashboard />
    },
    {
      id: 'digital-twin',
      icon: '👯',
      label: 'Digital You',
      description: 'Your AI-powered financial counterpart',
      component: <DigitalTwinDashboard result={assessmentData?.result} />
    },
    {
      id: 'predictions',
      icon: '🎯',
      label: 'Predictions',
      description: 'AI-powered forecasts of your financial future',
      component: <PredictionEngineDashboard />
    },
    {
      id: 'ai-coach',
      icon: '🤖',
      label: 'AI Coach',
      description: 'Get personalized advice from AI',
      component: <AiCoachInterface />
    },
    {
      id: 'bank-connect',
      icon: '🏦',
      label: 'Bank Connect',
      description: 'Link your bank account for real-time data',
      component: <BankingIntegrationDashboard />
    },
    {
      id: 'analytics',
      icon: '📊',
      label: 'Full Analytics',
      description: 'Complete data dashboard and insights',
      component: <AnalyticsDashboard />
    }
  ];

  if (!isOpen) {
    return (
      <button className="advanced-features-trigger" onClick={() => setIsOpen(true)}>
        <span className="trigger-icon">⚙️</span>
        <span className="trigger-text">Advanced</span>
      </button>
    );
  }

  return (
    <div className="advanced-features-drawer-overlay">
      <div className="advanced-features-drawer">
        <div className="drawer-header">
          <h2 className="drawer-title">Advanced Features</h2>
          <button
            className="drawer-close"
            onClick={() => {
              setIsOpen(false);
              setActiveTab(null);
            }}
          >
            ✕
          </button>
        </div>

        {!activeTab ? (
          <div className="drawer-grid">
            {features.map((feature) => (
              <button
                key={feature.id}
                className="feature-card"
                onClick={() => setActiveTab(feature.id)}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-label">{feature.label}</h3>
                <p className="feature-description">{feature.description}</p>
                <span className="feature-arrow">→</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="drawer-content">
            <button
              className="drawer-back"
              onClick={() => setActiveTab(null)}
            >
              ← Back to Features
            </button>
            <div className="drawer-body">
              {features.find((f) => f.id === activeTab)?.component}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
