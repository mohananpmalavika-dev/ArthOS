/**
 * test/README.md
 * Testing Guide for ARTH.OS
 */

# Testing Guide for ARTH.OS

## Quick Start

```bash
# Run all tests
npm test

# Run with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage

# Watch mode (re-run on file changes)
npm test -- --watch

# Run specific test file
npm test -- scoring-v2.test.js

# Run tests matching pattern
npm test -- --grep "scoring"
```

## Project Structure

```
test/
├── TESTING_STRATEGY.md          # Comprehensive testing roadmap
├── README.md                     # This file
├── setup.js                      # Vitest setup (globals, mocks, etc)
├── fixtures/
│   ├── factories.js              # Mock data generators
│   └── mocks.js                  # Mock implementations
├── templates/
│   ├── engine.template.js        # Copy to create engine tests
│   ├── component.template.jsx    # Copy to create component tests
│   └── api.template.js           # Copy to create API tests
├── components/                   # Component tests (mirror src/components)
├── engines/                      # Engine tests (mirror src/engines)
├── api/                          # API route tests
└── e2e/                          # End-to-end tests (coming soon)
```

## Writing Your First Test

### 1. Test an Engine (scoring-v2.js)

```javascript
// test/engines/scoring-v2.test.js
import { describe, it, expect } from 'vitest';
import { calculateScore } from '../../src/engines/scoring-v2';
import { createMockAssessment } from '../fixtures/factories';

describe('scoring-v2', () => {
  it('should calculate score correctly', () => {
    const assessment = createMockAssessment({
      behaviour: { overall: 70 },
      awareness: { overall: 75 },
    });

    const result = calculateScore(assessment);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});
```

**Effort:** 5-10 minutes per test  
**Use:** `test/templates/engine.template.js` for full template

### 2. Test a React Component

```javascript
// test/components/Header.test.jsx
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/components/Header';

describe('Header', () => {
  it('should render navigation', () => {
    render(<Header title="Home" />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
```

**Effort:** 10-15 minutes per component  
**Use:** `test/templates/component.template.jsx` for full template

### 3. Test an API Endpoint

```javascript
// test/api/assessment.test.js
import { describe, it, expect } from 'vitest';
import { createMockAssessment } from '../fixtures/factories';

describe('POST /api/assessment', () => {
  it('should save assessment', async () => {
    const assessment = createMockAssessment();
    const response = await submitAssessment(assessment);
    
    expect(response.status).toBe(200);
    expect(response.id).toBeDefined();
  });
});
```

**Effort:** 15-20 minutes per endpoint  
**Use:** `test/templates/api.template.js` for full template

## Using Fixtures & Mocks

### Mock Data Factories

```javascript
import {
  createMockAssessment,
  createMockUser,
  createMockDecision,
  createMockPrediction,
  createMockNotification,
} from '../fixtures/factories';

// Create standard mocks with optional overrides
const assessment = createMockAssessment({
  behaviour: { overall: 90 },
  awareness: { overall: 85 },
});

const user = createMockUser({
  tier: 'plus',
  email: 'custom@example.com',
});
```

### Mock Implementations

```javascript
import {
  createMockSupabaseClient,
  createMockLocalStorage,
  createMockFetch,
  createMockOpenAIClient,
  mockConsole,
} from '../fixtures/mocks';

// Use in your tests
const mockDb = createMockSupabaseClient();
const mockStorage = createMockLocalStorage();
const mockFetch = createMockFetch({ status: 'ok' }, 200);
```

## Testing Best Practices

### ✅ DO

- **Name tests clearly:** `it('should calculate score between 0 and 100')`
- **Test behavior, not implementation:** Focus on what the function does, not how
- **Use factories for test data:** Consistent, reusable fixtures
- **Group related tests:** Use `describe()` blocks
- **Test edge cases:** null, undefined, empty, extreme values
- **Mock external dependencies:** Supabase, API calls, localStorage
- **Keep tests isolated:** No test should depend on another

### ❌ DON'T

- **Use hardcoded values:** Use factories instead
- **Test implementation details:** Mock internals change, behavior doesn't
- **Skip setup/teardown:** Always clean up mocks
- **Create large test files:** Keep < 300 lines per file
- **Test multiple things:** One `it()` = one assertion (or related assertions)
- **Have timing dependencies:** Use `beforeEach/afterEach` instead

## Common Test Patterns

### Testing Calculations

```javascript
it('should apply weight correctly', () => {
  const result1 = calculateScore({ behaviour: 50, awareness: 100 });
  const result2 = calculateScore({ behaviour: 100, awareness: 50 });
  
  expect(result1).not.toBe(result2); // Verify weights matter
});
```

### Testing Error Handling

```javascript
it('should handle null input', () => {
  expect(() => processData(null)).not.toThrow();
});

it('should provide helpful error message', () => {
  expect(() => processData(invalid)).toThrow('must be a number');
});
```

### Testing Async Operations

```javascript
it('should load data from API', async () => {
  const result = await fetchAssessments(userId);
  
  await waitFor(() => {
    expect(result.status).toBe(200);
  });
});
```

### Testing React Components

```javascript
it('should call onSubmit when form is submitted', async () => {
  const mockFn = vi.fn();
  render(<Form onSubmit={mockFn} />);
  
  const submitBtn = screen.getByRole('button', { name: /submit/i });
  await userEvent.click(submitBtn);
  
  expect(mockFn).toHaveBeenCalled();
});
```

## Coverage Targets

| Area | Target | Current | Status |
|------|--------|---------|--------|
| **Engines** | 85%+ | ~5% | 🔴 |
| **Components** | 70%+ | ~2% | 🔴 |
| **Utilities** | 90%+ | ~10% | 🟡 |
| **Overall** | 70%+ | ~5% | 🔴 |

### View Coverage Report

```bash
npm run test:coverage
# Opens coverage/index.html in browser
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- scoring-v2.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "scoring"
```

### Debug in Browser

```bash
npm run test:ui
# Opens interactive dashboard at http://localhost:51204
```

### Add Console Output

```javascript
it('should work', () => {
  console.log('Debug info here'); // Shows in test output
  expect(true).toBe(true);
});
```

## CI/CD Pipeline

Tests run automatically on:
- **Push to main/develop/staging**
- **Pull requests** against main/develop/staging

### GitHub Actions Workflow

File: `.github/workflows/test.yml`

**Jobs:**
1. `test` — Run tests on Node 18 & 20
2. `lint` — Check code style
3. `build` — Verify production build
4. `coverage-report` — Post results to PR

**Artifacts:**
- Build output saved for 5 days
- Coverage reports uploaded to Codecov

## Troubleshooting

### "Cannot find module" errors

```javascript
// Use path aliases defined in vitest.config.js
import { Component } from '@components/Component';  // ✅
import { Component } from '../../../src/components/Component';  // ❌
```

### Vitest warnings about duplicate test names

```javascript
// Make test names unique
describe('MyComponent', () => {
  it('should render', () => {}); // ✅
  it('should render', () => {}); // ❌ Duplicate!
});
```

### Tests hang or timeout

```javascript
// Add timeout to slow tests
it('should process large dataset', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mocks not working

```javascript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks(); // Clear all mocks
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) — Full roadmap
- [Engine Template](./templates/engine.template.js)
- [Component Template](./templates/component.template.jsx)
- [API Template](./templates/api.template.js)

## Contributing Tests

1. Create test file in appropriate directory
2. Use relevant template from `test/templates/`
3. Use factories from `test/fixtures/factories.js`
4. Run `npm test` to verify
5. Commit test with code changes
6. CI/CD will verify coverage

## Questions?

Check out:
- `test/TESTING_STRATEGY.md` for full roadmap
- Template files for examples
- Existing test files for patterns

---

**Last Updated:** 2026-06-13  
**Maintainer:** ARTH.OS Development Team
