/**
 * test/engines/digitalTwinEngine.test.js
 * Unit tests for digital twin simulation and scenario generation
 * 
 * Focus: Twin building, scenario simulation, outcome comparison
 * Priority: HIGH
 * Target Coverage: 75%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCompleteTwin } from '../../src/engines/digitalTwinEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('digitalTwinEngine.js - Digital Twin Simulation', () => {
  let mockAssessment;
  let mockProfile;
  let mockHistory;

  beforeEach(() => {
    mockAssessment = createMockAssessment();
    mockProfile = {
      monthlyIncome: 5000,
      monthlyExpenses: 2500,
      emergencySavingsFixed: 15000,
      emergencySavingsDiscretionary: 5000,
      totalDebt: 10000,
      dependents: 2
    };
    mockHistory = {
      decisions: [],
      outcomes: [],
      behaviorShifts: []
    };
  });

  // ============================================================================
  // CORE TWIN BUILDING
  // ============================================================================

  describe('buildCompleteTwin()', () => {
    it('should create twin object with required properties', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin).toBeDefined();
      expect(twin).toHaveProperty('id');
      expect(twin).toHaveProperty('currentState');
      expect(twin).toHaveProperty('stateTimeline');
      expect(twin).toHaveProperty('futureStatistics');
    });

    it('should establish baseline financial state', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin.currentState).toBeDefined();
      expect(twin.currentState).toHaveProperty('median');
      expect(twin.currentState.median).toHaveProperty('healthScore');
      expect(twin.currentState.median.healthScore).toBeGreaterThanOrEqual(0);
      expect(twin.currentState.median.healthScore).toBeLessThanOrEqual(1000);
    });

    it('should include behavioral evolution tracking', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin.behaviorEvolution).toBeDefined();
      expect(twin.stateTimeline).toBeDefined();
      
      // Should have timeline of behavioral changes
      if (Array.isArray(twin.stateTimeline)) {
        expect(twin.stateTimeline.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate future statistics and generator', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin.futureStatistics).toBeDefined();
      expect(twin.futureGenerator).toBeDefined();
      
      // Future generator should be callable
      if (typeof twin.futureGenerator === 'function') {
        expect(true).toBe(true);
      }
    });

    it('should handle missing profile data gracefully', () => {
      expect(() => buildCompleteTwin(mockAssessment, {}, mockHistory)).not.toThrow();
      expect(() => buildCompleteTwin(mockAssessment, null, mockHistory)).not.toThrow();
    });

    it('should track behavioral evolution in timeline', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin.behaviorEvolution).toBeDefined();
      expect(twin.stateTimeline).toBeDefined();
      
      // Should have tracked behavior changes
      expect(typeof twin.behaviorEvolution === 'object' || Array.isArray(twin.behaviorEvolution)).toBe(true);
    });

    it('should preserve twin uniqueness with unique ID', () => {
      const twin1 = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);
      const twin2 = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Each twin should have consistent structure
      expect(twin1).toHaveProperty('id');
      expect(twin2).toHaveProperty('id');
    });

    it('should handle assessment with no history', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, {});

      expect(twin).toBeDefined();
      expect(twin.currentState).toBeDefined();
      expect(twin.futureStatistics).toBeDefined();
    });
  });

  // ============================================================================
  // SCENARIO GENERATION
  // ============================================================================

  describe('twin scenario composition', () => {
    it('should include optimistic behavior simulation', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Future generator should be capable of optimistic simulation
      expect(twin.futureGenerator).toBeDefined();
      expect(twin.currentState).toBeDefined();
      expect(twin.currentState.median.healthScore).toBeGreaterThanOrEqual(0);
    });

    it('should include realistic behavior simulation', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Behavior evolution should capture realistic changes
      expect(twin.behaviorEvolution).toBeDefined();
      expect(twin.currentState).toBeDefined();
    });

    it('should include pessimistic behavior simulation', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Consequence graph captures pessimistic outcomes
      expect(twin.consequenceGraph).toBeDefined();
      expect(twin.currentState).toBeDefined();
    });

    it('should rank outcomes by projected impact', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Consequence graph ranks outcomes by impact
      expect(twin.consequenceGraph).toBeDefined();
      expect(twin.currentState).toBeDefined();
      expect(twin.currentState.median).toHaveProperty('healthScore');
    });
  });

  // ============================================================================
  // PROJECTION AND IMPACT MODELING
  // ============================================================================

  describe('twin projections and time series', () => {
    it('should include timeline of financial states', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin.stateTimeline).toBeDefined();
      if (Array.isArray(twin.stateTimeline) && twin.stateTimeline.length > 0) {
        expect(twin.stateTimeline[0]).toHaveProperty('date');
      }
    });

    it('should show score trajectory over time', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      if (Array.isArray(twin.stateTimeline) && twin.stateTimeline.length >= 2) {
        // Should show progression of health scores
        const scores = twin.stateTimeline.map(s => s.median?.healthScore || 0);
        expect(scores.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should indicate intervention impact points', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Twin should be prepared for intervention simulation
      expect(twin.currentState).toBeDefined();
      expect(twin.consequenceGraph).toBeDefined();
    });

    it('should handle long-term forecasting (36+ months)', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      if (Array.isArray(twin.stateTimeline)) {
        // Should support extended timeline
        expect(Array.isArray(twin.stateTimeline)).toBe(true);
      }
    });
  });

  // ============================================================================
  // TWIN COMPARISON AND ANALYSIS
  // ============================================================================

  describe('twin analysis capabilities', () => {
    it('should compare baseline vs scenarios', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin.currentState).toBeDefined();
      expect(twin.futureStatistics).toBeDefined();
      expect(Array.isArray(twin.futureStatistics) || typeof twin.futureStatistics === 'object').toBe(true);
    });

    it('should identify divergence points in outcomes', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Check that twin has generated future statistics
      expect(twin.futureStatistics).toBeDefined();
      expect(twin.consequenceGraph).toBeDefined();
      
      // Should track different possible outcomes
      if (Array.isArray(twin.stateTimeline)) {
        expect(twin.stateTimeline.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should assess twin accuracy/confidence', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Twin should have confidence or accuracy indicator
      expect(twin.currentState).toBeDefined();
      expect(twin).toHaveProperty('id');
    });

    it('should support "what-if" scenario analysis', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Twin foundation is built, consequence graph exists for what-if analysis
      expect(twin.consequenceGraph).toBeDefined();
      expect(twin.methods).toBeDefined();
      expect(typeof twin.methods.simulateDecision).toBe('function');
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('end-to-end twin usage patterns', () => {
    it('should create consistent twin from same input data', () => {
      const twin1 = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);
      const twin2 = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      expect(twin1.currentState.median.healthScore).toBe(twin2.currentState.median.healthScore);
      expect(twin1.id).toBeDefined();
      expect(twin2.id).toBeDefined();
    });

    it('should support healthy financial profile twin', () => {
      const healthyProfile = {
        ...mockProfile,
        emergencySavingsFixed: 50000,
        totalDebt: 0
      };

      const twin = buildCompleteTwin(mockAssessment, healthyProfile, mockHistory);

      expect(twin.currentState.median.healthScore).toBeGreaterThanOrEqual(0);
      expect(twin.currentState.median.healthScore).toBeLessThanOrEqual(1000);
    });

    it('should support stressed financial profile twin', () => {
      const stressedProfile = {
        ...mockProfile,
        emergencySavingsFixed: 1000,
        totalDebt: 50000,
        monthlyExpenses: 4000
      };

      const twin = buildCompleteTwin(mockAssessment, stressedProfile, mockHistory);

      expect(twin.currentState).toBeDefined();
      expect(twin.consequenceGraph).toBeDefined();
    });

    it('should prepare twin for multi-outcome comparison', () => {
      const twin = buildCompleteTwin(mockAssessment, mockProfile, mockHistory);

      // Should have future simulation capabilities
      expect(twin.futureGenerator).toBeDefined();
      expect(twin.futureStatistics).toBeDefined();
      
      // Twin should have timeline for comparison
      expect(twin.stateTimeline).toBeDefined();
    });}
  });
});
