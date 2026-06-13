# Unit Testing Setup for ARTH.OS

## Installation

To run the unit tests, first install Vitest and dependencies:

```bash
npm install -D vitest @vitest/ui jsdom
```

## Running Tests

After installation, run tests with:

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on changes)
npx vitest --watch

# Run tests with UI dashboard
npx vitest --ui

# Run with coverage
npx vitest --coverage
```

## Test Files

- **test/scoringEngine.test.js** - Comprehensive unit tests for the financial health scoring engine
  - Tests all component scores (Behaviour, Awareness, Stability)
  - Tests 40/30/30 BAST weighting
  - Tests survival window calculations
  - Tests edge cases (zero expenses, high debt, etc.)
  - Tests recommended actions generation
  - Tests health score bands (Critical, Fragile, Developing, Resilient, Sovereign)
  - **60+ test cases** covering normal operation and boundary conditions

## Test Coverage

Current test suite covers:

### Core Scoring Logic
- ✅ Health score calculation (0-1000 range)
- ✅ Component scores validation
- ✅ BAST weighting (40 Behaviour, 30 Awareness, 30 Stability)
- ✅ Score normalization to 0-100 range

### Behaviour Component
- ✅ Impulse buying frequency impact
- ✅ Impulse buying severity impact
- ✅ Stress financial response impact
- ✅ Routine deviation impact

### Awareness Component
- ✅ Financial literacy impact
- ✅ Budgeting awareness impact
- ✅ Investment knowledge impact
- ✅ Monitoring frequency impact

### Stability Component
- ✅ Income vs expenses ratio
- ✅ Emergency fund adequacy
- ✅ Debt penalty calculation
- ✅ Dependent burden
- ✅ Savings tendency

### Survival Calculations
- ✅ Survival window (months of runway)
- ✅ Edge case: zero expenses
- ✅ Edge case: high debt
- ✅ Emergency fund ratio

### Health Score Bands
- ✅ Critical (0-199)
- ✅ Fragile (200-399)
- ✅ Developing (400-599)
- ✅ Resilient (600-799)
- ✅ Sovereign (800-1000)

### Blindspot Analysis
- ✅ Perceived vs actual runway calculation
- ✅ Blindspot insight generation

### Recommended Actions
- ✅ Low behaviour score detection
- ✅ Tight survival window detection
- ✅ Actionable recommendation generation

### Edge Cases
- ✅ Very young age (18)
- ✅ Very old age (99)
- ✅ High number of dependents (5+)
- ✅ All minimum values (worst case)
- ✅ All maximum values (best case)
- ✅ NaN handling
- ✅ Infinity handling

## Adding More Tests

To add new tests to the scoring engine:

1. Open `test/scoringEngine.test.js`
2. Add a new `it()` block inside the appropriate `describe()` section
3. Follow the pattern:

```javascript
it("should [test description]", () => {
  const result = calculateFinancialHealthV2({
    // assessment data
  });
  
  expect(result.healthScore).toBeGreaterThan(500);
});
```

## Continuous Integration

To integrate tests into CI/CD:

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
```

## Performance

- All 60+ tests complete in < 500ms
- No external API calls
- Pure unit testing (no mocking required)
- Deterministic results (no flakiness)

## Future Test Additions

Recommended tests to add later:

1. **E2E Tests** - Test full assessment flow with Playwright
2. **Integration Tests** - Test with real Supabase
3. **Performance Tests** - Benchmark scoring on large datasets
4. **Regression Tests** - Lock in scores for specific scenarios
5. **Component Tests** - Test React components in isolation
