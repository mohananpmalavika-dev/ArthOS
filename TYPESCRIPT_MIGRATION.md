# TypeScript Migration Guide for ARTH.OS

## Overview

This guide documents the incremental TypeScript migration of the ARTH.OS codebase, starting with the core scoring engine and expanding to other modules.

## Status: Phase 1 (Setup Complete) ✅

### Completed
- ✅ `tsconfig.json` - Configured with strict mode enabled
- ✅ `tsconfig.node.json` - Build configuration
- ✅ `src/types/assessment.ts` - Core type definitions

### Current
- React components (`.jsx`) - Can coexist with TypeScript
- Utility files (`.js`) - Can be gradually converted

## Conversion Roadmap

### Phase 1: Setup (COMPLETE)
Duration: ~1 hour
- ✅ Create `tsconfig.json` with strict mode
- ✅ Define core types in `src/types/assessment.ts`
- ✅ Update `vite.config.js` to recognize `.ts` files

### Phase 2: Core Libraries (RECOMMENDED NEXT - ~2 days)
Duration: ~16 hours
Target files in priority order:
1. `src/lib/scoring-v2.js` → `src/lib/scoring-v2.ts` (4-5 hours)
   - Most critical file
   - Complex calculations
   - Heavy type benefits
   - Write full TypeScript

2. `src/lib/errorMonitoring.js` → `src/lib/errorMonitoring.ts` (1-2 hours)
   - Error handling patterns
   - API contracts

3. `src/lib/errorLogger.js` → `src/lib/errorLogger.ts` (1 hour)
   - Logging utilities
   - Simple types

4. `src/lib/copy.js` → `src/lib/copy.ts` (1 hour)
   - UI strings/constants
   - Simple structure

5. Other utility files in `src/lib/` (5-6 hours)
   - `api.js` → `api.ts`
   - `db.js` → `db.ts`
   - `auth.js` → `auth.ts`

### Phase 3: Components (OPTIONAL - ~3-4 days)
Duration: ~24 hours (but can be deferred)
Files to convert (in priority):
1. High-impact components first:
   - `App.jsx` → `App.tsx` (3 hours)
   - `AssessmentSection.jsx` → `AssessmentSection.tsx` (2-3 hours)
   - `ErrorBoundary.jsx` → `ErrorBoundary.tsx` (1 hour)

2. Mid-impact components:
   - `HeroSection.jsx`, `Dashboard.jsx`, etc. (2 hours each)

3. Reusable component library:
   - `MoneyInput.jsx` → `MoneyInput.tsx` (1 hour)
   - Other form components (2-3 hours)

### Phase 4: Full Type Safety (FUTURE)
- Migrate all remaining `.js`/`.jsx` files
- Add strict null checks
- Enable `noImplicitAny`
- Achieve 100% type coverage

## Quick Start

### 1. Verify TypeScript is Installed

```bash
npm list typescript
# If not installed:
npm install -D typescript
```

### 2. Test Configuration

```bash
npx tsc --noEmit
# Should complete without errors
```

### 3. Start IDE Type Checking

In VS Code:
- Open any `.ts` file
- TypeScript will automatically activate
- You'll see type errors and IntelliSense

## Migration Patterns

### Pattern 1: Add JSDoc Types to .js File

Keep file as `.js` but add type hints:

```javascript
// BEFORE
function calculateFinancialHealthV2(assessment) {
  return { healthScore: 750 };
}

// AFTER (JSDoc)
/**
 * @param {AssessmentInput} assessment
 * @returns {HealthScore}
 */
function calculateFinancialHealthV2(assessment) {
  return { healthScore: 750 };
}
```

**Pros**: Quick, incremental, works immediately
**Cons**: Not full TypeScript, less type safety

### Pattern 2: Convert to TypeScript (.ts file)

Rename and rewrite with full types:

```typescript
// scoring-v2.ts
import type { AssessmentInput, HealthScore } from "../types/assessment";

function calculateFinancialHealthV2(assessment: AssessmentInput): HealthScore {
  return { healthScore: 750 };
}
```

**Pros**: Full type safety, better refactoring, IDE support
**Cons**: Requires compilation step, larger learning curve

### Pattern 3: Allow Mixed JS/TS

During migration, both can coexist:

```javascript
// scoring-v2.js (OLD)
export function calculateOldVersion(data) { ... }

// scoring-v2.ts (NEW)
export function calculateNewVersion(data: AssessmentInput) { ... }
```

## Conversion Checklist

When converting a file from JS to TS:

- [ ] Copy file and rename `.js` → `.ts`
- [ ] Add type imports at top:
  ```typescript
  import type { AssessmentInput, HealthScore } from "../types/assessment";
  ```
- [ ] Add parameter types:
  ```typescript
  function myFunction(param: Type): ReturnType { }
  ```
- [ ] Add return types on all functions
- [ ] Run `npx tsc --noEmit` to check for errors
- [ ] Update imports in other files (if needed)
- [ ] Delete old `.js` file
- [ ] Test in browser/Vite dev server

## Common Patterns

### React Component

```typescript
// OLD: AssessmentSection.jsx
export default function AssessmentSection({ onComplete }) {
  // ...
}

// NEW: AssessmentSection.tsx
import type { ReactNode } from "react";

interface Props {
  onComplete: () => void;
}

export default function AssessmentSection({ onComplete }: Props): ReactNode {
  // ...
}
```

### API Call

```typescript
// OLD: api.js
async function fetchUserProfile(userId) {
  const response = await fetch(`/api/profile/${userId}`);
  return response.json();
}

// NEW: api.ts
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`/api/profile/${userId}`);
  return response.json();
}
```

### Utility Function

```typescript
// OLD: utils.js
function calculatePercentage(value, total) {
  return (value / total) * 100;
}

// NEW: utils.ts
function calculatePercentage(value: number, total: number): number {
  return (value / total) * 100;
}
```

## Troubleshooting

### "Cannot find module X"
Make sure file has correct extension (`.ts` or `.tsx`):
```bash
# Check file exists
ls -la src/lib/scoring-v2.ts

# Update tsconfig.json moduleResolution
```

### "Type 'X' is not assignable to type 'Y'"
Add proper type casting or fix the data flow:
```typescript
// WRONG
const score: number = calculateScore(data); // Returns HealthScore

// RIGHT
const result: HealthScore = calculateScore(data);
const score: number = result.healthScore;
```

### IDE not showing type errors
Restart TypeScript server:
- VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Or: Close and reopen the file

### Build errors after conversion
Run full type check:
```bash
npx tsc --noEmit
```

Fix all reported issues, then rebuild.

## Testing TypeScript

Unit tests should work with both `.js` and `.ts`:

```bash
# Tests still work
npm test

# Type checking separate from tests
npx tsc --noEmit
```

For TypeScript-specific tests, see `test/scoringEngine.test.js` which imports typed functions.

## Performance Impact

- **Build time**: +200-500ms (first time only, cached after)
- **Runtime**: No performance impact (compiled to JS)
- **IDE feedback**: Instant type checking as you type

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vite + TypeScript](https://vitejs.dev/guide/features.html#typescript)
- [Type Definitions in `src/types/assessment.ts`](./src/types/assessment.ts)

## Next Steps

1. **Immediate** (This week): Install TypeScript, validate config
2. **Week 1-2**: Convert `src/lib/scoring-v2.js` → `src/lib/scoring-v2.ts`
3. **Week 2-3**: Convert error handling and utility files
4. **Week 3-4**: Convert critical React components
5. **Optional**: Convert remaining components incrementally

## Support

For TypeScript questions:
- Check [Type Definitions](./src/types/assessment.ts)
- Run `npx tsc --noEmit` for errors
- Refer to Vite + React + TypeScript examples
