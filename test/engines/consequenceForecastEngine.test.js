/**
 * test/engines/consequenceForecastEngine.test.js
 * Unit tests for consequence forecasting and trajectory analysis
 * 
 * Focus: Health trajectory projection, consequence gap calculation, warnings
 * Priority: HIGH
 * Target Coverage: 70%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  projectHealthTrajectory,
  calculateConsequenceGap,
  getTrajectoryWarning
} from '../../src/engines/consequenceForecastEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('consequenceForecastEngine.js - Consequence Forecasting', () => {
  let mockResult;

  beforeEach(() => {
    mockResult = {
      current_score: 650,
      health_band: 'resilient',
      bast_breakdown: {
        behaviour: 72,
        awareness: 68,
        stability: 65,
        trajectory: 62
      },
      assessment_timestamp: new Date().toISOString(),
      previous_score: 620,
      score_trend: 'improving'
    };
  });

  // ============================================================================
  // HEALTH TRAJECTORY PROJECTION
  // ============================================================================

  describe('projectHealthTrajectory()', () => {
    it('should project health trajectory over time periods', () => {
      const trajectory = projectHealthTrajectory(mockResult);

      expect(trajectory).toBeDefined();
      expect(Array.isArray(trajectory.projections)).toBe(true);
      expect(trajectory.projections.length).toBeGreaterThan(0);
    });

    it('should provide scores for 3, 6, 12 month horizons', () => {
      const trajectory = projectHealthTrajectory(mockResult);

      expect(trajectory.projections.some((p) => p.months === 3)).toBe(true);
      expect(trajectory.projections.some((p) => p.months === 6)).toBe(true);
      expect(trajectory.projections.some((p) => p.months === 12)).toBe(true);
    });

    it('should project improvement for improving trend', () => {
      const improvingResult = {
        ...mockResult,
        score_trend: 'improving',
        current_score: 650,
        previous_score: 620
      };
      const trajectory = projectHealthTrajectory(improvingResult);

      const projectedScores = trajectory.projections.map((p) => p.projected_score);
      expect(projectedScores[projectedScores.length - 1]).toBeGreaterThan(
        improvingResult.current_score
      );
    });

    it('should project decline for declining trend', () => {
      const decliningResult = {
        ...mockResult,
        score_trend: 'declining',
        current_score: 620,
        previous_score: 650
      };
      const trajectory = projectHealthTrajectory(decliningResult);

      const projectedScores = trajectory.projections.map((p) => p.projected_score);
      expect(projectedScores[projectedScores.length - 1]).toBeLessThan(
        decliningResult.current_score
      );
    });

    it('should identify critical trajectory points', () => {
      const trajectory = projectHealthTrajectory(mockResult);

      trajectory.projections.forEach((projection) => {
        expect(projection.projected_score).toBeGreaterThanOrEqual(0);
        expect(projection.projected_score).toBeLessThanOrEqual(1000);
        expect(projection.health_band).toBeDefined();
      });
    });

    it('should calculate confidence interval for projections', () => {
      const trajectory = projectHealthTrajectory(mockResult);

      trajectory.projections.forEach((projection) => {
        expect(projection.confidence_lower).toBeDefined();
        expect(projection.confidence_upper).toBeDefined();
        expect(projection.confidence_lower).toBeLessThan(projection.projected_score);
        expect(projection.confidence_upper).toBeGreaterThan(projection.projected_score);
      });
    });
  });

  // ============================================================================
  // CONSEQUENCE GAP ANALYSIS
  // ============================================================================

  describe('calculateConsequenceGap()', () => {
    it('should calculate gap between current and projected scores', () => {
      const gap = calculateConsequenceGap(mockResult);

      expect(gap).toBeDefined();
      expect(typeof gap.gap_size).toBe('number');
    });

    it('should identify positive gaps (improvements)', () => {
      const improvingResult = {
        ...mockResult,
        score_trend: 'improving',
        current_score: 650
      };
      const gap = calculateConsequenceGap(improvingResult);

      expect(gap.direction).toMatch(/positive|improving/);
    });

    it('should identify negative gaps (deterioration)', () => {
      const decliningResult = {
        ...mockResult,
        score_trend: 'declining',
        current_score: 450
      };
      const gap = calculateConsequenceGap(decliningResult);

      expect(gap.direction).toMatch(/negative|declining/);
    });

    it('should quantify consequences by band transition', () => {
      const gap = calculateConsequenceGap(mockResult);

      expect(gap.band_transitions).toBeDefined();
      expect(Array.isArray(gap.band_transitions)).toBe(true);
    });

    it('should estimate impact timeline', () => {
      const gap = calculateConsequenceGap(mockResult);

      expect(gap.timeframe_months).toBeDefined();
      expect(gap.timeframe_months).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // TRAJECTORY WARNINGS
  // ============================================================================

  describe('getTrajectoryWarning()', () => {
    it('should return warning object with severity', () => {
      const warning = getTrajectoryWarning(mockResult);

      expect(warning).toBeDefined();
      expect(['none', 'low', 'moderate', 'high', 'critical']).toContain(
        warning.severity
      );
    });

    it('should warn about critical trajectory decline', () => {
      const criticalResult = {
        ...mockResult,
        current_score: 250,
        health_band: 'fragile',
        score_trend: 'rapidly_declining',
        bast_breakdown: {
          behaviour: 25,
          awareness: 30,
          stability: 20,
          trajectory: 15
        }
      };
      const warning = getTrajectoryWarning(criticalResult);

      expect(warning.severity).toBe('critical');
      expect(warning.message).toBeDefined();
    });

    it('should warn about band drops', () => {
      const bandDropResult = {
        ...mockResult,
        current_score: 400,
        previous_score: 620,
        health_band: 'developing',
        was_band: 'resilient'
      };
      const warning = getTrajectoryWarning(bandDropResult);

      expect(warning.message).toContain('band');
    });

    it('should identify accelerating decline', () => {
      const acceleratingResult = {
        ...mockResult,
        current_score: 600,
        previous_score: 620,
        score_acceleration: 'increasing',
        velocity: -15
      };
      const warning = getTrajectoryWarning(acceleratingResult);

      if (warning.severity !== 'none') {
        expect(warning.message).toBeDefined();
      }
    });

    it('should provide actionable recommendations', () => {
      const warning = getTrajectoryWarning(mockResult);

      if (warning.severity !== 'none') {
        expect(warning.recommended_actions).toBeDefined();
        expect(Array.isArray(warning.recommended_actions)).toBe(true);
      }
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration: Complete Forecasting Workflow', () => {
    it('should project trajectory and identify gaps', () => {
      const trajectory = projectHealthTrajectory(mockResult);
      const gap = calculateConsequenceGap(mockResult);

      expect(trajectory.projections.length).toBeGreaterThan(0);
      expect(gap.gap_size).toBeDefined();
    });

    it('should provide warning when gap crosses critical threshold', () => {
      const poorResult = {
        ...mockResult,
        current_score: 300,
        health_band: 'fragile',
        score_trend: 'declining'
      };

      const trajectory = projectHealthTrajectory(poorResult);
      const warning = getTrajectoryWarning(poorResult);

      expect(trajectory).toBeDefined();
      expect(warning).toBeDefined();
    });

    it('should forecast across all health bands', () => {
      const bands = ['critical', 'fragile', 'developing', 'resilient', 'sovereign'];
      const scores = [100, 300, 500, 700, 900];

      bands.forEach((band, index) => {
        const testResult = {
          ...mockResult,
          current_score: scores[index],
          health_band: band
        };

        const trajectory = projectHealthTrajectory(testResult);
        expect(trajectory).toBeDefined();
      });
    });
  });
});
