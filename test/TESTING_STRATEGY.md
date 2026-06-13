<!-- test/TESTING_STRATEGY.md -->

# ARTH.OS Testing Strategy & Roadmap

**Created:** 2026-06-13  
**Status:** Foundation Document  
**Estimated Coverage:** 70%+ by Phase 3

---

## 1. Current State Analysis

### ✅ What We Have

| Area | Status | Details |
|------|--------|---------|
| **Vitest Setup** | ✅ Configured | v1.0.0, jsdom, globals, coverage reporter |
| **Test Files** | 3 files | `digitalTwinEngine.test.js`, `scoringEngine.test.js`, `arthos-flow-qa.spec.js` |
| **Testing Libraries** | ✅ Installed | @testing-library/react, @testing-library/jest-dom, @testing-library/user-event |
| **npm Scripts** | ✅ Ready | `test`, `test:ui`, `test:coverage` |

### ❌ What We Need

| Category | Count | Risk | Effort |
|----------|-------|------|--------|
| **Engine Unit Tests** | 45/48 missing | **CRITICAL** | 15-20 hrs |
| **Component Tests** | 50/50 missing | **HIGH** | 10-15 hrs |
| **Integration Tests** | 0 API routes | MEDIUM | 8-10 hrs |
| **E2E Tests** | 0 workflows | LOW | 5-8 hrs |
| **CI/CD Pipeline** | 0 setup | MEDIUM | 2-3 hrs |

---

## 2. Testing Pyramid Strategy

```
        E2E Tests (5-8 hours)
       /                   \
      /   Integration Tests   \
     /      (8-10 hours)       \
    /                           \
   /     Component Tests         \
  /      (10-15 hours)           \
 /                               \
/__Component Logic & Mocks (5 hrs) \
```

**Recommended Effort Distribution:**
- **Unit Tests:** 50% (engines, utilities) — **Highest ROI**
- **Component Tests:** 30% (React validation)
- **Integration Tests:** 15% (API contracts)
- **E2E Tests:** 5% (critical workflows)

---

## 3. Phase-Based Rollout Plan

### Phase 1: Foundation (Week 1) — 8-10 hours

**Goal:** Core engine test infrastructure + top 5 engines  
**Tests to Add:** 50+ new tests

#### 3.1a Engines to Test First (Priority Order)

1. **scoring-v2.js** (500+ lines) — **CRITICAL**
   - Scope: All scoring logic, weight calculations, personality scores
   - Tests needed: 15-20 tests
   - Effort: 2 hours
   - Risk mitigation: Catches score calculation bugs early
   - Test structure:
     ```
     ✓ calculateOverallScore()
     ✓ Weight distribution validation
     ✓ Personality type classification
     ✓ Component-specific scoring
     ✓ Edge cases (zero values, null inputs)
     ```

2. **mlBehaviourPredictionEngine.js**
   - ML model outputs validation
   - 8-10 tests
   - Effort: 1.5 hours

3. **digitalTwinEngine.js** (Already tested, extend)
   - Add scenario testing
   - Add stress-test validation
   - 5-8 tests
   - Effort: 1 hour

4. **predictionEngine.js**
   - Forecast accuracy validation
   - Boundary condition testing
   - 10-12 tests
   - Effort: 1.5 hours

5. **habitEngine.js**
   - Habit tracking logic
   - Streak calculation
   - 8-10 tests
   - Effort: 1 hour

#### 3.1b Infrastructure Setup (2-3 hours)

1. **Test Template Library**
   - Mock factory patterns (engines, API responses)
   - Snapshot testing setup
   - Performance test utilities

2. **Test Utilities**
   - `createMockAssessment()` — Standard assessment fixture
   - `createMockUser()` — Standard user fixture
   - `mockSupabaseClient()` — Database mocking
   - `asyncWait()` — Async test helper

3. **Vitest Configuration Enhancement**
   - Custom matchers for financial calculations
   - Coverage threshold enforcement
   - Performance budgets

---

### Phase 2: Component Coverage (Week 2-3) — 10-15 hours

**Goal:** PropTypes validation + React Testing Library tests  
**Tests to Add:** 40-50 new tests

#### 3.2a High-Priority Components (First 10)

1. **AssessmentSection.jsx**
   - User input flow testing
   - Step progression validation
   - 5-6 tests

2. **DecisionSimulator.jsx**
   - Scenario interaction testing
   - Output calculation verification
   - 6-8 tests

3. **DigitalTwinDashboard.jsx**
   - Component integration testing
   - Data binding verification
   - 5-6 tests

4. **Header.jsx** (PropTypes already added)
   - Navigation state testing
   - Auth flow validation
   - 3-4 tests

5. **ValidationFeedbackForm.jsx**
   - Form submission logic
   - Feedback payload validation
   - 4-5 tests

6. **EnhancedInsightNarrative.jsx**
   - Narrative generation testing
   - Content validation
   - 5-6 tests

7-10. **Other high-use components** (20-25 tests)

#### 3.2b Component Test Template

```javascript
// test/components/MyComponent.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@components/MyComponent';

describe('MyComponent', () => {
  it('renders with required props', () => {
    render(<MyComponent data={mockData} onAction={vi.fn()} />);
    expect(screen.getByText(/expected/)).toBeInTheDocument();
  });

  it('validates PropTypes', () => {
    const { container } = render(<MyComponent invalidProp="test" />);
    // Check for console warnings about invalid prop
  });

  it('handles user interactions', () => {
    const mockFn = vi.fn();
    render(<MyComponent onAction={mockFn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

---

### Phase 3: Integration & API Tests (Week 4) — 8-10 hours

**Goal:** API contract validation + end-to-end workflows  
**Tests to Add:** 20-30 new tests

#### 3.3a API Routes to Test (Priority)

1. **Assessment Routes**
   - `POST /api/assessment` — Submit assessment
   - `GET /api/assessment/:id` — Retrieve assessment
   - `POST /api/feedback` — Submit feedback
   - 6-8 tests

2. **User Routes**
   - `GET /api/user/profile` — Get user profile
   - `PUT /api/user/preferences` — Update preferences
   - `GET /api/user/assessments` — List assessments
   - 4-6 tests

3. **Stripe Integration**
   - `POST /api/stripe/webhook` — Webhook handling
   - `POST /api/stripe/create-session` — Checkout
   - 3-4 tests (already tested per notes)

4. **Memory/Event Sync**
   - `POST /api/memory/event` — Log event
   - `POST /api/memory/sync/events` — Batch sync
   - 3-4 tests

#### 3.3b Integration Test Template

```javascript
// test/api/assessment.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@test/mocks';

describe('Assessment API Routes', () => {
  beforeEach(() => {
    // Setup mock database state
  });

  it('submits assessment with valid data', async () => {
    const payload = {
      userId: 'user_123',
      assessment: mockAssessment,
    };
    const response = await submitAssessment(payload);
    expect(response.status).toBe(200);
    expect(response.data.id).toBeDefined();
  });

  it('rejects invalid assessment format', async () => {
    const payload = { userId: 'user_123' }; // Missing assessment
    await expect(submitAssessment(payload)).rejects.toThrow();
  });

  it('enforces assessment frequency limits', async () => {
    // Submit first assessment
    await submitAssessment(payload);
    // Try second assessment immediately
    await expect(submitAssessment(payload)).rejects.toThrow('exceeds monthly limit');
  });
});
```

---

### Phase 4: E2E Workflows (Week 4) — 5-8 hours

**Goal:** User journey testing with Playwright  
**Tests to Add:** 5-8 new workflows

#### 3.4a Critical User Flows

1. **Assessment Completion Flow**
   - User starts assessment
   - Completes all steps
   - Views results
   - 1 test (3-5 minutes execution)

2. **Decision Logging + Analysis**
   - User logs a decision
   - Engine analyzes it
   - Notification sent
   - 1 test

3. **Subscription Upgrade Flow**
   - User views pricing
   - Upgrades to Plus
   - Feature unlock verification
   - 1 test (uses Stripe test mode)

4. **Digital Twin Scenario Testing**
   - User creates scenario
   - Views forecast
   - Compares outcomes
   - 1 test

5. **Feedback Loop Closure**
   - User provides feedback
   - System records outcome
   - User views improvement
   - 1 test

---

## 4. Test Templates & Fixtures

### 4.1 Mock Factory (Create `test/fixtures/factories.js`)

```javascript
export function createMockAssessment(overrides = {}) {
  return {
    id: 'assess_' + Math.random().toString(36).slice(7),
    userId: 'user_123',
    behaviour: { overall: 65, components: [60, 70, 65] },
    awareness: { overall: 72, components: [70, 75, 70] },
    profile: { name: 'John', email: 'john@example.com' },
    habits: { dailyTracking: true, reviewFrequency: 'weekly' },
    personalityType: 'Builder',
    healthScore: 68,
    survivalMonths: 12,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUser(overrides = {}) {
  return {
    id: 'user_' + Math.random().toString(36).slice(7),
    email: 'user@example.com',
    name: 'Test User',
    tier: 'free',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function mockSupabaseResponse(data = {}) {
  return {
    data,
    error: null,
    status: 200,
  };
}
```

### 4.2 Engine Test Template (Create `test/templates/engine.test.template.js`)

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { myEngine } from '@engines/myEngine';
import { createMockAssessment } from '@test/fixtures/factories';

describe('myEngine', () => {
  let mockAssessment;

  beforeEach(() => {
    mockAssessment = createMockAssessment();
  });

  describe('core functionality', () => {
    it('should process valid input', () => {
      const result = myEngine.analyze(mockAssessment);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle edge cases', () => {
      const edgeCases = [null, undefined, {}, { behaviour: null }];
      edgeCases.forEach(input => {
        expect(() => myEngine.analyze(input)).not.toThrow();
      });
    });
  });

  describe('calculations', () => {
    it('should calculate scores correctly', () => {
      const assessment = createMockAssessment({
        behaviour: { overall: 50 },
      });
      const result = myEngine.analyze(assessment);
      expect(result.score).toMatchSnapshot();
    });
  });

  describe('performance', () => {
    it('should complete within 100ms', () => {
      const start = performance.now();
      myEngine.analyze(mockAssessment);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
```

---

## 5. Coverage Targets

### Target Coverage by Area

| Area | Target | Current | Gap |
|------|--------|---------|-----|
| **Engines** | 85%+ | ~5% | 45 files |
| **Components** | 70%+ | ~2% | 50 files |
| **Utilities** | 90%+ | ~10% | 25 files |
| **API Routes** | 60%+ | ~10% | 20 routes |
| **Overall** | 70%+ | ~5% | 140 items |

### Enforcement (CI/CD)

```javascript
// vitest.config.js enhancement
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  all: true,
  lines: 70,        // Enforce 70% line coverage
  functions: 70,
  branches: 60,     // Branches are harder
  statements: 70,
  exclude: ['node_modules/', 'test/', 'dist/'],
}
```

---

## 6. Tools & Dependencies

### Already Installed ✅
- `vitest` v1.0.0
- `@testing-library/react` v16.3.2
- `@testing-library/jest-dom` v6.9.1
- `jsdom` v24.1.3

### Recommended Additions (Optional)

```bash
npm install --save-dev \
  @testing-library/user-event \
  @vitest/coverage-v8 \
  @vitest/ui \
  happy-dom \
  msw  # Mock Service Worker for API mocking
```

---

## 7. CI/CD Pipeline Setup

### GitHub Actions Workflow (Create `.github/workflows/test.yml`)

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test -- --run --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
```

---

## 8. Implementation Roadmap

### Week 1 (Phase 1: Foundations)
- [ ] Set up test fixtures & factories
- [ ] Create test templates (engine, component, API)
- [ ] Write 20 engine tests (scoring-v2, ML engines, prediction)
- [ ] Enhance vitest.config.js with coverage thresholds
- [ ] Estimate: **8-10 hours**

### Week 2-3 (Phase 2: Components)
- [ ] Add tests to top 10 components
- [ ] Validate PropTypes in component tests
- [ ] Create component test suite (40-50 tests)
- [ ] Estimate: **10-15 hours**

### Week 4 (Phase 3: Integration)
- [ ] API route integration tests (20-30 tests)
- [ ] Mock Supabase queries
- [ ] Create E2E workflows (5-8 tests)
- [ ] Set up GitHub Actions CI/CD
- [ ] Estimate: **8-10 hours**

### Week 5+ (Phase 4: Maintenance)
- [ ] Review test coverage reports
- [ ] Identify gaps and add targeted tests
- [ ] Integrate into code review process
- [ ] Document testing best practices

---

## 9. Test Execution Commands

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- scoring-v2.test.js

# Run tests in watch mode
npm test -- --watch

# Run with specific reporter
npm test -- --reporter=verbose

# Run specific test suite
npm test -- --grep "scoring-v2"
```

---

## 10. Success Metrics

### Target Milestones

| Milestone | Coverage | Tests | Timeline |
|-----------|----------|-------|----------|
| Phase 1 | 15-20% | 50 | Week 1 |
| Phase 2 | 35-40% | 100 | Week 2-3 |
| Phase 3 | 55-60% | 130 | Week 4 |
| Phase 4 | 70%+ | 150+ | Week 5 |

### Benefits by Phase

**Phase 1:** Catch score calculation bugs early  
**Phase 2:** Validate component integration  
**Phase 3:** Protect API contracts  
**Phase 4:** Enable confident refactoring  

---

## 11. Handoff Checklist

- [ ] Vitest configuration finalized
- [ ] Test templates created
- [ ] Mock factories set up
- [ ] First 20 tests passing
- [ ] CI/CD pipeline configured
- [ ] Coverage reporting working
- [ ] Team trained on testing patterns
- [ ] Testing guidelines documented

---

## Questions? Next Steps?

1. **Start Phase 1 now?** I'll scaffold 20+ engine tests for scoring-v2, ML engines, prediction
2. **Setup CI/CD first?** GitHub Actions workflow ready to deploy
3. **Focus on a specific engine?** Let me know which one is riskiest
4. **Need test templates?** All ready in separate files

**Recommended:** Start with Phase 1 (foundations + top 5 engines) = 8-10 hrs → Deploy Phase 1 by end of week
