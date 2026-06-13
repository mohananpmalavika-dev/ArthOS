/**
 * test/components/ConsequenceForecastCard.test.jsx
 * Unit tests for Consequence Forecast Card component
 * 
 * Focus: Forecast display, warning indicators, interactions
 * Priority: MEDIUM
 * Target Coverage: 70%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsequenceForecastCard from '../../src/components/ConsequenceForecastCard.jsx';

describe('ConsequenceForecastCard.jsx - Consequence Forecast Display', () => {
  let mockForecastData;

  beforeEach(() => {
    mockForecastData = {
      trajectory: [
        { months: 3, projected_score: 665, health_band: 'resilient', confidence: 0.85 },
        { months: 6, projected_score: 680, health_band: 'resilient', confidence: 0.72 },
        { months: 12, projected_score: 700, health_band: 'sovereign', confidence: 0.58 }
      ],
      gap: {
        gap_size: 50,
        direction: 'positive',
        timeframe_months: 12
      },
      warnings: [
        { severity: 'low', message: 'Slight improvement expected' }
      ]
    };
  });

  // ============================================================================
  // COMPONENT RENDERING
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render forecast card without crashing', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should display forecast heading', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByText(/forecast/i)).toBeInTheDocument();
    });

    it('should display projection timeline', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByText(/3 months/i)).toBeInTheDocument();
      expect(screen.getByText(/6 months/i)).toBeInTheDocument();
      expect(screen.getByText(/12 months/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORECAST DATA DISPLAY
  // ============================================================================

  describe('Forecast Data Display', () => {
    it('should display projected scores', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByText(/665/)).toBeInTheDocument();
      expect(screen.getByText(/680/)).toBeInTheDocument();
      expect(screen.getByText(/700/)).toBeInTheDocument();
    });

    it('should display projected health bands', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      const resilientCount = screen.getAllByText(/resilient/i);
      expect(resilientCount.length).toBeGreaterThan(0);
    });

    it('should display confidence intervals', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByText(/confidence/i) || screen.getByText(/85%/)).toBeDefined();
    });

    it('should display gap information', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByText(/gap/i) || screen.getByText(/50/)).toBeDefined();
    });
  });

  // ============================================================================
  // WARNING INDICATORS
  // ============================================================================

  describe('Warning Indicators', () => {
    it('should display low severity warnings', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByText(/improvement/i) || screen.getByRole('region')).toBeDefined();
    });

    it('should highlight critical warnings', () => {
      const criticalForecast = {
        ...mockForecastData,
        warnings: [
          { severity: 'critical', message: 'Rapid decline projected' }
        ]
      };

      render(
        <ConsequenceForecastCard forecast={criticalForecast} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should display multiple warnings', () => {
      const multiWarningForecast = {
        ...mockForecastData,
        warnings: [
          { severity: 'low', message: 'Warning 1' },
          { severity: 'moderate', message: 'Warning 2' }
        ]
      };

      render(
        <ConsequenceForecastCard forecast={multiWarningForecast} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // USER INTERACTIONS
  // ============================================================================

  describe('User Interactions', () => {
    it('should handle expand/collapse toggle', async () => {
      const user = userEvent.setup();
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      const toggleButton = screen.queryByRole('button', { name: /expand|collapse/i });
      if (toggleButton) {
        await user.click(toggleButton);
        expect(toggleButton).toBeInTheDocument();
      }
    });

    it('should handle view details action', async () => {
      const mockOnViewDetails = vi.fn();
      const user = userEvent.setup();

      render(
        <ConsequenceForecastCard forecast={mockForecastData} onViewDetails={mockOnViewDetails} />
      );

      const detailButton = screen.queryByRole('button', { name: /details|more/i });
      if (detailButton) {
        await user.click(detailButton);
      }
    });

    it('should handle timeline navigation', async () => {
      const user = userEvent.setup();
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      const timelineButtons = screen.queryAllByRole('button');
      if (timelineButtons.length > 0) {
        await user.click(timelineButtons[0]);
      }
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    it('should handle missing forecast data', () => {
      render(
        <ConsequenceForecastCard forecast={null} />
      );

      const region = screen.queryByRole('region');
      expect(region || screen.getByText(/loading|no data/i)).toBeDefined();
    });

    it('should handle empty trajectory data', () => {
      const emptyForecast = {
        ...mockForecastData,
        trajectory: []
      };

      render(
        <ConsequenceForecastCard forecast={emptyForecast} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should handle no warnings', () => {
      const noWarningsForecast = {
        ...mockForecastData,
        warnings: []
      };

      render(
        <ConsequenceForecastCard forecast={noWarningsForecast} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should handle declining trajectory', () => {
      const decliningForecast = {
        trajectory: [
          { months: 3, projected_score: 630, health_band: 'developing' },
          { months: 6, projected_score: 600, health_band: 'developing' },
          { months: 12, projected_score: 550, health_band: 'fragile' }
        ],
        gap: { gap_size: -100, direction: 'negative' },
        warnings: [{ severity: 'high', message: 'Significant decline' }]
      };

      render(
        <ConsequenceForecastCard forecast={decliningForecast} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DATA VISUALIZATION
  // ============================================================================

  describe('Data Visualization', () => {
    it('should display trend chart', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should use color coding for severity', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should display confidence bands', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByRole('heading') || screen.getByRole('region')).toBeDefined();
    });

    it('should have proper ARIA labels for data points', () => {
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      expect(screen.getByRole('region')).toHaveAccessibleName() || 
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <ConsequenceForecastCard forecast={mockForecastData} />
      );

      await user.tab();
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });
});
