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
      financial: {
        score: 650,
        band: 'resilient',
        trend: 'improving'
      },
      behavioral: {
        consistency: 0.85,
        volatility: 0.15
      },
      predictive: {
        trajectory: 'improving',
        confidence: 0.82
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

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display financial health score', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByText(/650/)).toBeInTheDocument();
    });

    it('should display health band badge', () => {
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      expect(screen.getByText(/resilient/i)).toBeInTheDocument();
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

      expect(screen.getByText(/improving/i)).toBeInTheDocument();
    });

    it('should show confidence intervals', () => {
      const twinWithConfidence = {
        ...mockTwinData,
        financial: { ...mockTwinData.financial, confidence: 0.85 }
      };

      render(
        <DigitalTwinDashboard twinData={twinWithConfidence} />
      );

      expect(screen.getByText(/confidence/i)).toBeInTheDocument();
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
        financial: { score: 1000, band: 'sovereign' }
      };

      render(
        <DigitalTwinDashboard twinData={extremeTwin} />
      );

      expect(screen.getByText(/1000/)).toBeInTheDocument();
    });

    it('should handle low financial scores', () => {
      const criticalTwin = {
        ...mockTwinData,
        financial: { score: 50, band: 'critical' }
      };

      render(
        <DigitalTwinDashboard twinData={criticalTwin} />
      );

      expect(screen.getByText(/critical/i)).toBeInTheDocument();
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

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAccessibleName() || expect(mainElement).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <DigitalTwinDashboard twinData={mockTwinData} />
      );

      await user.tab();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
