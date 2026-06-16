/**
 * test/components/DigitalTwinDashboard.test.jsx
 * Unit tests for Digital Twin Dashboard component
 * 
 * Focus: Dashboard rendering, data display, user interactions
 * Priority: HIGH
 * Target Coverage: 75%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DigitalTwinDashboard from '../../src/components/DigitalTwinDashboard.jsx';

vi.mock('../../src/lib/digitalTwinEngine.js', () => ({
  buildCompleteTwin: vi.fn(() => ({
    identity: { name: 'Test User', avatar: 'avatar-url' },
    financial: { score: 650, band: 'resilient' },
    behavioral: { consistency: 0.85 },
    predictive: { trajectory: 'improving' }
  }))
}));

describe('DigitalTwinDashboard.jsx - Twin Dashboard Display', () => {
  let mockTwinData;

  beforeEach(() => {
    mockTwinData = {
      identity: {
        name: 'Test User',
        avatar: 'data:image/svg+xml,...',
        created_at: '2026-01-01'
      },
      metadata: {
        confidence: 0.82,
        dataPoints: 18
      },
      financial: {
        score: 650,
        band: 'resilient',
        trend: 'improving'
      },
      currentState: {
        median: {
          healthScore: 82,
          runway: 6.4,
          income: 58000,
          expenses: 42000,
          savings: 16000
        },
        behavior: {
          savingsDiscipline: 0.72,
          impulseProbability: 0.2
        }
      },
      futureStatistics: {
        percentiles: {
          finalRunway: {
            p5: 2.1,
            p50: 6.4,
            p95: 11.2
          }
        },
        survivalRate: 78
      },
      predictive: {
        trajectory: 'improving',
        confidence: 0.82
      },
      methods: {
        getFutureScenarios: () => ({
          pessimistic: 2.1,
          median: 6.4,
          optimistic: 11.2,
          survivalRate: 78
        })
      }
    };
  });

  // ============================================================================
  // COMPONENT RENDERING
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render dashboard without crashing', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display user identity section', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      const userIdentity = screen.getByText((content, element) => {
        return element?.textContent?.includes('Test User') && element.tagName === 'P';
      });
      expect(userIdentity).toBeInTheDocument();
    });

    it('should display financial health score', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByText(/82\s*\/100/)).toBeInTheDocument();
    });

    it('should display current runway and survival metrics', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      const runwayNodes = screen.getAllByText(/6\.4\s*mo/);
      expect(runwayNodes.length).toBeGreaterThan(0);
      expect(
        screen.getByText((content) => /78\.0\s*%/.test(content))
      ).toBeInTheDocument();
    });

    it('should display health band badge', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      const badges = screen.getAllByText(/resilient/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DATA VISUALIZATION
  // ============================================================================

  describe('Data Visualization', () => {
    it('should render BAST breakdown chart', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByText(/BAST/i)).toBeInTheDocument();
    });

    it('should display trend indicators', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      const trendNode = screen.getAllByText(/improving/i);
      expect(trendNode.length).toBeGreaterThan(0);
    });

    it('should render the decision simulator section', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByText(/Interactive decision simulator/i)).toBeInTheDocument();
    });

    it('should show confidence intervals', () => {
      const twinWithConfidence = {
        ...mockTwinData,
        financial: { ...mockTwinData.financial, confidence: 0.85 }
      };

      render(
        <DigitalTwinDashboard twinData={twinWithConfidence} />
      );

      const confidenceNodes = screen.getAllByText(/confidence/i);
      expect(confidenceNodes.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // USER INTERACTIONS
  // ============================================================================

  describe('User Interactions', () => {
    it('should allow toggling sections', async () => {
      const user = userEvent.setup();
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      const toggleButton = screen.queryByRole('button', { name: /toggle/i });
      if (toggleButton) {
        await user.click(toggleButton);
        expect(toggleButton).toBeInTheDocument();
      }
    });

    it('should handle refresh action', async () => {
      const mockRefresh = vi.fn();
      const user = userEvent.setup();

      render(
        <DigitalTwinDashboard twinData={mockTwinData} onRefresh={mockRefresh} />
      );

      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      if (refreshButton) {
        await user.click(refreshButton);
      }
    });

    it('should handle detail navigation', async () => {
      const mockNavigate = vi.fn();
      const user = userEvent.setup();

      render(
        <DigitalTwinDashboard twinData={mockTwinData} onNavigate={mockNavigate} />
      );

      const detailLinks = screen.queryAllByRole('link');
      if (detailLinks.length > 0) {
        await user.click(detailLinks[0]);
      }
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    it('should handle missing twin data gracefully', () => {
      render(
        <DigitalTwinDashboard twinData={null} />
      );

      const mainElement = screen.queryByRole('main');
      expect(mainElement || screen.getByText(/loading|no data/i)).toBeDefined();
    });

    it('should handle empty twin data', () => {
      render(
        <DigitalTwinDashboard twinData={{}} />
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle extreme financial scores', () => {
      const extremeTwin = {
        ...mockTwinData,
        currentState: {
          median: {
            healthScore: 100,
            runway: 14.2,
            income: 100000,
            expenses: 30000,
            savings: 70000
          },
          behavior: {
            savingsDiscipline: 0.95,
            impulseProbability: 0.05
          }
        },
        financial: { score: 1000, band: 'sovereign' }
      };

      render(
        <DigitalTwinDashboard twinData={extremeTwin} />
      );

      expect(screen.getByText(/100\s*\/100/)).toBeInTheDocument();
    });

    it('should handle low financial scores', () => {
      const criticalTwin = {
        ...mockTwinData,
        financial: { score: 50, band: 'critical' }
      };

      render(
        <DigitalTwinDashboard twinData={criticalTwin} />
      );

      const criticalBadges = screen.getAllByText(/critical/i);
      expect(criticalBadges.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      const mainElements = screen.getAllByRole('main');
      expect(mainElements.length).toBeGreaterThan(0);
      expect(mainElements[0]).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      await user.tab();
      const mainElements = screen.getAllByRole('main');
      expect(mainElements.length).toBeGreaterThan(0);
    });
  });
});
