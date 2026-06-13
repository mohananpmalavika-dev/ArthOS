/**
 * IMPLEMENTATION_CHECKLIST.md
 * Step-by-step guide to implement Phase 1 testing
 * 
 * Timeline: 8-10 hours
 * Effort: Medium
 * Impact: Catch 90% of score calculation bugs
 */

# Phase 1 Implementation Checklist

## Overview

This checklist guides you through implementing Phase 1 of the test suite:
- ✅ Test infrastructure (fixtures, mocks, templates)
- ✅ GitHub Actions CI/CD pipeline
- ⏳ **TODO:** Write 20-25 core engine tests
- ⏳ **TODO:** Verify build passes with tests

**Estimated Time:** 8-10 hours  
**Target Date:** End of Week 1

---

## Pre-Implementation

- [ ] Review `test/TESTING_STRATEGY.md` (30 mins)
- [ ] Review `test/README.md` (20 mins)
- [ ] Inspect `test/templates/engine.template.js` (15 mins)
- [ ] Run `npm test` to verify Vitest works (5 mins)

**Total Time:** ~1 hour

---

## Phase 1a: Test Infrastructure (✅ COMPLETE)

These files have been created:

- [x] `test/TESTING_STRATEGY.md` — Full roadmap & justification
- [x] `test/README.md` — Developer testing guide
- [x] `test/fixtures/factories.js` — Mock data generators
- [x] `test/fixtures/mocks.js` — Mock implementations
- [x] `test/templates/engine.template.js` — Engine test template
- [x] `test/templates/component.template.jsx` — Component test template
- [x] `test/templates/api.template.js` — API test template
- [x] `.github/workflows/test.yml` — CI/CD pipeline

**Status:** ✅ Ready to use

---

## Phase 1b: Core Engine Tests (⏳ TODO - 8-10 hours)

### Engine Priority Order

#### Tier 1: Critical (Hours 1-3)

**1. scoring-v2.js Tests** (2 hours)
- File: `src/engines/scoring-v2.js` (500+ lines)
- Risk: **CRITICAL** — Core calculation logic
- Tests to Write: 15-20 tests
- Focus Areas:
  - [ ] `calculateOverallScore()` basic functionality
  - [ ] Score range validation (0-100)
  - [ ] Weight distribution (behaviour vs awareness)
  - [ ] Personality type classification logic
  - [ ] Component-specific scoring
  - [ ] Edge cases (null, undefined, zero values)
  - [ ] Extreme values (all 100, all 0)

Steps:
```bash
# 1. Copy template
cp test/templates/engine.template.js test/engines/scoring-v2.test.js

# 2. Replace placeholders
# - myEngine → scoring-v2
# - myEngine.analyze → calculateOverallScore
# - Update mock data for scoring requirements

# 3. Write 15-20 specific tests

# 4. Run tests
npm test -- scoring-v2.test.js

# 5. Fix failures (iterate)
```

**2. mlBehaviourPredictionEngine.js Tests** (1 hour)
- File: `src/engines/mlBehaviourPredictionEngine.js`
- Risk: **HIGH** — ML model predictions
- Tests to Write: 8-10 tests
- Focus Areas:
  - [ ] Model output format validation
  - [ ] Prediction confidence values
  - [ ] Boundary cases (perfect score, zero)
  - [ ] API integration mocking

#### Tier 2: High-Priority (Hours 4-6)

**3. predictionEngine.js Tests** (1.5 hours)
- File: `src/engines/predictionEngine.js`
- Risk: **HIGH** — Forecast calculations
- Tests to Write: 10-12 tests
- Focus Areas:
  - [ ] Scenario projections
  - [ ] Time-based forecasting
  - [ ] Stress test validations

**4. habitEngine.js Tests** (1 hour)
- File: `src/engines/habitEngine.js`
- Risk: **MEDIUM** — Habit tracking
- Tests to Write: 8-10 tests
- Focus Areas:
  - [ ] Streak calculation
  - [ ] Habit scoring logic
  - [ ] Consistency metrics

**5. digitalTwinEngine.js Tests** (0.5 hours)
- File: `src/engines/digitalTwinEngine.js`
- Status: **Partially tested** (extend existing tests)
- Tests to Add: 5-8 tests
- Focus Areas:
  - [ ] Scenario simulation
  - [ ] Outcome comparison
  - [ ] Twin accuracy validation

#### Tier 3: Supporting (Hours 7-8)

**6. emotionalTriggerEngine.js Tests** (1 hour)
- 8-10 tests
- Mock trigger patterns
- Validate emotional factor detection

**7. moneyBeliefEngine.js Tests** (1 hour)
- 8-10 tests
- Belief classification logic
- Score influence validation

---

## Phase 1c: Verification (1 hour)

### Test Execution

- [ ] Run all tests: `npm test -- --run`
- [ ] Verify 50+ tests passing
- [ ] Check coverage report: `npm run test:coverage`
- [ ] Verify build passes: `npm run build`

### Expected Results

```
PASS  test/engines/scoring-v2.test.js (20 tests)
PASS  test/engines/mlBehaviourPredictionEngine.test.js (10 tests)
PASS  test/engines/predictionEngine.test.js (12 tests)
PASS  test/engines/habitEngine.test.js (10 tests)
PASS  test/engines/digitalTwinEngine.test.js (8 tests)
PASS  test/engines/emotionalTriggerEngine.test.js (10 tests)
PASS  test/engines/moneyBeliefEngine.test.js (10 tests)

Total: 80+ tests passing
Time: < 30 seconds
Coverage: 20-25% (engines area)
Build: ✅ Success
```

### Coverage Check

```bash
npm run test:coverage
# View coverage/index.html to see:
# - Lines covered: ~20%
# - Engine coverage: ~50-60%
# - Component coverage: ~2% (untested)
```

---

## Phase 1d: CI/CD Verification (30 mins)

- [ ] Push changes to GitHub
- [ ] Verify GitHub Actions runs `.github/workflows/test.yml`
- [ ] Check all jobs pass:
  - [ ] `test` job (Node 18 & 20)
  - [ ] `lint` job
  - [ ] `build` job
  - [ ] `coverage-report` job
- [ ] View coverage comment on PR

---

## Writing Your First Engine Test

### Template Walkthrough (scoring-v2.js)

```javascript
// test/engines/scoring-v2.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateOverallScore } from '../../src/engines/scoring-v2';
import { createMockAssessment } from '../../test/fixtures/factories';

describe('scoring-v2', () => {
  let mockAssessment;

  beforeEach(() => {
    mockAssessment = createMockAssessment();
  });

  // SECTION 1: Core Functionality
  describe('calculateOverallScore()', () => {
    it('should calculate score between 0 and 100', () => {
      const result = calculateOverallScore(mockAssessment);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return number type', () => {
      const result = calculateOverallScore(mockAssessment);
      expect(typeof result).toBe('number');
    });
  });

  // SECTION 2: Calculations
  describe('score calculations', () => {
    it('should use correct weight: behaviour=40%, awareness=60%', () => {
      // If behaviour=50, awareness=100
      // Expected: 50*0.4 + 100*0.6 = 80
      const assessment = createMockAssessment({
        behaviour: { overall: 50 },
        awareness: { overall: 100 },
      });

      const result = calculateOverallScore(assessment);
      expect(result).toBe(80);
    });
  });

  // SECTION 3: Edge Cases
  describe('edge cases', () => {
    it('should handle null input', () => {
      expect(() => calculateOverallScore(null)).not.toThrow();
    });

    it('should handle zero values', () => {
      const assessment = createMockAssessment({
        behaviour: { overall: 0 },
        awareness: { overall: 0 },
      });

      const result = calculateOverallScore(assessment);
      expect(Number.isNaN(result)).toBe(false);
    });
  });
});
```

### Key Points

- **Structure:** Define tests in logical groups with `describe()`
- **Setup:** Use `beforeEach()` to initialize common test data
- **Assertions:** Use `expect()` for every validation
- **Mocks:** Use `createMockAssessment()` for consistent test data
- **Edge Cases:** Test null, undefined, zero, and extreme values

---

## Time Breakdown

```
Phase 1a: Infrastructure       [✅ COMPLETE]  0.5 hours
                               (already done)

Phase 1b: Engine Tests         [⏳ TODO]      8 hours
  - Tier 1 (scoring, ML)       2 hours
  - Tier 2 (prediction, habit) 2 hours
  - Tier 3 (trigger, belief)   2 hours
  - Iteration & fixes          2 hours

Phase 1c: Verification         [⏳ TODO]      1 hour
  - Run tests, check coverage
  - Verify build passes

Phase 1d: CI/CD                [⏳ TODO]      0.5 hours
  - Push to GitHub
  - Verify workflows

TOTAL PHASE 1                                 10 hours
```

---

## Success Criteria

✅ **Phase 1 Complete When:**

1. **80+ Engine Tests Written**
   - [ ] 20 tests for scoring-v2
   - [ ] 10 tests for ML engine
   - [ ] 12 tests for prediction
   - [ ] 10 tests for habit
   - [ ] 8 tests for digital twin
   - [ ] 10 tests for emotional trigger
   - [ ] 10 tests for money belief

2. **All Tests Passing**
   - [ ] `npm test -- --run` shows 0 failures
   - [ ] All 80+ tests pass in < 30 seconds
   - [ ] No console errors

3. **Coverage Improved**
   - [ ] Engine coverage: 50-60% (up from ~5%)
   - [ ] Overall coverage: 20-25% (up from ~5%)

4. **Build Verified**
   - [ ] `npm run build` completes successfully
   - [ ] `npm run lint` shows no new errors
   - [ ] `npm run type-check` shows no type errors

5. **CI/CD Working**
   - [ ] GitHub Actions workflow runs on push
   - [ ] All jobs pass (test, lint, build, coverage)
   - [ ] Coverage reports posted to PRs

---

## Common Issues & Solutions

### Issue: "Cannot find module"

**Solution:** Use path aliases from `vitest.config.js`
```javascript
// ✅ Correct
import { calculateScore } from '@engines/scoring-v2';

// ❌ Wrong
import { calculateScore } from '../../../src/engines/scoring-v2';
```

### Issue: Tests timeout or hang

**Solution:** Add explicit timeout
```javascript
it('should handle large dataset', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: Mocks not resetting between tests

**Solution:** Clear mocks explicitly
```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Issue: "Snapshot mismatch"

**Solution:** Update snapshot if expected
```bash
npm test -- -u  # Update all snapshots
npm test -- -t "test name" -u  # Update specific test
```

---

## Next Steps (Phase 2+)

After Phase 1 completes:

**Phase 2 (Week 2-3):** Component PropTypes Tests
- [ ] AssessmentSection.jsx (5-6 tests)
- [ ] DecisionSimulator.jsx (6-8 tests)
- [ ] DigitalTwinDashboard.jsx (5-6 tests)
- [ ] 40+ more component tests

**Phase 3 (Week 4):** API Integration Tests
- [ ] Assessment routes (6-8 tests)
- [ ] User routes (4-6 tests)
- [ ] Memory/Event routes (3-4 tests)

**Phase 4 (Week 5+):** E2E Workflows
- [ ] Assessment completion flow
- [ ] Decision logging + analysis
- [ ] Subscription upgrade

---

## Questions?

1. **How do I write a test?**
   - See "Writing Your First Engine Test" above
   - Use `test/templates/engine.template.js`

2. **What if a test fails?**
   - Read the error message carefully
   - Add `console.log()` statements to debug
   - Run `npm run test:ui` for interactive debugging

3. **How do I check coverage?**
   - Run `npm run test:coverage`
   - Open `coverage/index.html` in browser
   - Each file shows which lines are covered

4. **Should I commit test changes?**
   - Yes! Commit tests alongside code changes
   - Tests protect future refactoring

---

## Commitment Tracker

**Start Date:** ________________  
**Target Completion:** End of Week 1  
**Actual Completion:** ________________  

**By Phase:**
- [ ] Phase 1a: Infrastructure (complete)
- [ ] Phase 1b: Engine Tests (TODO: 8 hours)
- [ ] Phase 1c: Verification (TODO: 1 hour)
- [ ] Phase 1d: CI/CD (TODO: 0.5 hours)

---

**Ready to start?** Begin with **Tier 1: scoring-v2.js**

Good luck! 🚀
