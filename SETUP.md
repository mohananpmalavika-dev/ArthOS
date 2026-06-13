# ARTH.OS Setup Guide

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Environment Configuration](#environment-configuration)
3. [Development Server](#development-server)
4. [Running Tests](#running-tests)
5. [Feature Configuration](#feature-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### Step 1: Clone/Navigate to Project
```bash
cd ArthOS
```

### Step 2: Install Dependencies
Install all required packages including the newly added tools:

```bash
npm install
```

**What gets installed:**
- React 18.3.1 + React Router 6.20.0 (frontend framework)
- Vite 6.0.3 (development server & build tool)
- TypeScript 5.4.0 (type checking)
- Vitest 1.0.0 (unit test framework)
- jsdom 24.0.0 (test environment)
- @vitest/ui 1.0.0 (test dashboard)
- html2canvas 1.4.1 + jsPDF 2.5.1 (PDF export)
- Supabase, Stripe, Lucide icons, Recharts, and more

**Installation takes ~2-3 minutes** depending on network speed.

### Step 3: Create Environment File
```bash
cp .env.example .env.local
```

This creates a local environment file where you'll add credentials. **Do not commit this file to git** - it contains secrets.

---

## Environment Configuration

Edit `.env.local` and add your credentials:

### Supabase (Required for Data Persistence)

```bash
# Get these from https://supabase.com/ → Your Project → Settings

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ASSESSMENTS_TABLE=assessments
```

**Steps to get credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create a new project or select existing project
3. Click "Settings" → "API"
4. Copy `Project URL` (this is `SUPABASE_URL`)
5. Copy `Service Role Key` (this is `SUPABASE_SERVICE_ROLE_KEY`)
6. Keep `SUPABASE_ASSESSMENTS_TABLE=assessments` as default

### Error Monitoring (Optional but Recommended)

```bash
# Get this from https://sentry.io/

VITE_SENTRY_DSN=https://your-project@sentry.io/project-id
```

**Steps to set up Sentry:**
1. Go to [Sentry.io](https://sentry.io/)
2. Create account/login
3. Create new project (choose React as platform)
4. Copy the DSN provided
5. Paste into `.env.local`

**If you skip this:**
- Errors will still be logged to localStorage (max 50 errors)
- You won't get cloud-based error tracking
- App will work normally without Sentry

### API Configuration

```bash
# For local development:
VITE_API_URL=http://localhost:5173/api

# For production:
VITE_API_URL=https://your-production-domain.com/api
```

### Database (Optional Alternative to Supabase)

```bash
# Use EITHER Supabase OR local Postgres, not both

DATABASE_URL=postgres://username:password@localhost:5432/arthos
PG_SSL=false
```

**Only set this if running local PostgreSQL instead of Supabase.**

---

## Development Server

### Start the Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.0.3  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Open in Browser

Visit [http://localhost:5173](http://localhost:5173)

### Hot Reload

Vite automatically reloads your browser when you make code changes. No manual refresh needed!

### Stop the Server

Press `Ctrl+C` in the terminal.

---

## Running Tests

### Run All Tests (60+ tests)

```bash
npm test
```

**Expected output:**
```
✓ test/scoringEngine.test.js (60+ tests)
  ✓ calculateFinancialHealthV2() - 9 tests
  ✓ Health Score Bands - 3 tests
  ✓ Behaviour Component - 1 test
  ✓ Awareness Component - 1 test
  ✓ Stability Component - 3 tests
  ✓ Recommended Actions - 2 tests
  ✓ Edge Cases - 5+ tests

Pass: 60+ | Fail: 0 | Duration: <500ms
```

### Watch Mode (Re-run Tests on Changes)

```bash
npx vitest --watch
```

Every time you edit `test/scoringEngine.test.js`, tests run automatically.

### Test UI Dashboard

```bash
npm run test:ui
```

Opens a browser dashboard showing test results with detailed breakdown.

### Test Coverage Report

```bash
npm run test:coverage
```

Shows which lines of code are covered by tests (aim for >90%).

### Run Specific Test File

```bash
npx vitest test/scoringEngine.test.js
```

---

## Feature Configuration

### 1. Input Validation

**Status:** ✅ Ready  
**File:** `src/components/AssessmentSection.jsx` (MoneyInput component)

The app now validates financial inputs:
- Prevents negative values
- Shows red error messages
- Marks critical fields with red asterisk (*)
- Prevents form submission with invalid data

**To test:**
1. Start the app: `npm run dev`
2. Go to "#assessment" hash
3. Try entering negative income → error appears
4. Try entering zero expenses → error appears
5. Try submitting with invalid data → form blocks submission

### 2. Consent Banner

**Status:** ✅ Ready  
**File:** `src/components/ConsentBanner.jsx`

On first visit, users see a privacy consent banner at the bottom.

**To test:**
```bash
# Clear localStorage to simulate first visit
# Open DevTools → Application → Local Storage
# Delete key "arth-os-data-consent"
# Reload page
# Banner appears at bottom
# Click "Accept" → localStorage saves "true"
# Reload again → banner doesn't appear
```

**Privacy guarantees displayed:**
- Zero PII Stored
- Local-First Design
- Anonymous Telemetry

### 3. Error Monitoring

**Status:** ✅ Initialized & Ready  
**File:** `src/lib/errorMonitoring.js`

Errors are automatically captured:
- **With Sentry:** Cloud-based error tracking (if `VITE_SENTRY_DSN` set)
- **Without Sentry:** localStorage backup (max 50 errors)

**To test error monitoring:**

```bash
# In browser DevTools Console, trigger an error:
throw new Error("Test error message");

# Check where it was logged:

# Option 1: Check Sentry Dashboard
# https://sentry.io/ → Your Project → Issues

# Option 2: Check localStorage
# Open DevTools → Application → Local Storage
# Look for key "arth-os-errors" containing error array
```

**Enable Sentry:**
1. Set `VITE_SENTRY_DSN` in `.env.local`
2. Restart dev server: `npm run dev`
3. Trigger error in browser console
4. Check Sentry Dashboard for error entry

### 4. PDF Export

**Status:** ✅ Component Ready (integration pending)  
**File:** `src/components/ExportPDF.jsx`

Export assessment results as professional PDF.

**To test (once integrated into results):**
1. Complete an assessment
2. Look for "Export PDF" button
3. Click to download `ARTH-OS-Report-YYYY-MM-DD.pdf`
4. PDF contains: health score, status, component breakdown, blindspots, recommendations

### 5. Enhanced Onboarding

**Status:** ✅ Ready  
**File:** `src/components/OnboardingOverlay.jsx`

First-time users see enhanced 5-step guide with:
- Step titles with duration estimates (~15 min total)
- Expandable details for each step
- Privacy guarantees section
- Start/Dismiss actions

**To test:**
```bash
# Clear localStorage to simulate first visit
# Open DevTools → Application → Local Storage
# Delete key "arth-os-onboarding-complete"
# Reload page
# Expanded onboarding overlay appears
# Click step titles to expand/collapse details
# View privacy section with 3 guarantees
```

### 6. Unit Tests

**Status:** ✅ 60+ Tests Ready  
**File:** `test/scoringEngine.test.js`

Comprehensive test coverage for scoring engine:
- Core scoring logic
- Component scores
- Health bands classification
- Survival calculations
- Edge cases

**To run:**
```bash
npm test
```

All tests should pass with <500ms execution time.

### 7. TypeScript

**Status:** ✅ Setup Complete, Ready for Migration  
**Files:** `tsconfig.json`, `src/types/assessment.ts`

Type definitions are ready:
- AssessmentInput (all 16 fields)
- HealthScore (result structure)
- ComponentScores (B/A/S breakdown)
- BlindspotData (visibility analysis)
- And more...

**To use TypeScript now:**
```bash
# Check for type errors
npm run type-check

# Should complete with no errors
```

**To migrate a file to TypeScript:**
1. Rename `.js` → `.ts` (or `.jsx` → `.tsx`)
2. Add imports: `import type { AssessmentInput } from "../types/assessment.ts"`
3. Add parameter types: `function myFunc(data: AssessmentInput): HealthScore`
4. Run `npm run type-check` to verify

---

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove lock files
rm package-lock.json

# Try again
npm install
```

### Issue: Dev server won't start

**Solution:**
```bash
# Kill any existing process on port 5173
# Windows PowerShell:
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process

# macOS/Linux:
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Restart
npm run dev
```

### Issue: Tests don't run

**Solution:**
```bash
# Verify Node version (should be 18+)
node --version

# Reinstall dev dependencies
npm install --save-dev vitest jsdom

# Run tests
npm test
```

### Issue: Type checking fails

**Solution:**
```bash
# Check TypeScript installation
npm list typescript

# Run full type check
npm run type-check

# If errors, check:
# 1. tsconfig.json exists in project root
# 2. tsconfig.node.json exists in project root
# 3. src/types/assessment.ts exists
```

### Issue: Sentry not logging errors

**Solution:**
```bash
# Check environment variable
echo $VITE_SENTRY_DSN
# Should show https://your-dsn@sentry.io/project-id

# Verify .env.local has DSN
cat .env.local | grep SENTRY_DSN

# If missing, add to .env.local:
VITE_SENTRY_DSN=https://your-project@sentry.io/project-id

# Restart dev server:
npm run dev

# Test with console error:
# Open DevTools → Console
# Type: throw new Error("Test")
# Check https://sentry.io/ → Your Project → Issues
```

### Issue: Consent banner doesn't appear

**Solution:**
```bash
# Clear localStorage
# Open DevTools → Application → Local Storage → Select http://localhost:5173
# Delete all keys starting with "arth-os-"

# Reload page - banner should appear

# If still doesn't appear:
# 1. Check browser console for errors
# 2. Verify ConsentBanner.jsx imported in main.jsx
# 3. Check that ConsentBanner component is in JSX tree
```

### Issue: Assessment validation not working

**Solution:**
```bash
# Check MoneyInput component in AssessmentSection.jsx

# Try entering negative value in any financial field
# Should see red error message

# If not:
# 1. Check browser console for component errors
# 2. Verify CSS styles loaded (styles.css)
# 3. Check .validation-error and .required-indicator classes exist
```

---

## Quick Commands Reference

```bash
# Development
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Build for production (creates dist/)
npm run preview       # Preview production build locally

# Testing
npm test              # Run all tests once
npx vitest --watch    # Watch mode (re-run on changes)
npm run test:ui       # UI dashboard
npm run test:coverage # Coverage report

# TypeScript
npm run type-check    # Check for type errors

# Database
npm run migrate       # Run database migrations (if needed)
```

---

## Getting Help

### Check Documentation
- [README.md](README.md) - Project overview
- [PRODUCTION_READY_COMPLETION.md](PRODUCTION_READY_COMPLETION.md) - Feature status
- [TEST_SETUP.md](TEST_SETUP.md) - Testing guide
- [TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) - TypeScript roadmap

### Debug Tips
1. **Open DevTools** - Press F12 or Cmd+Opt+I
2. **Check Console** - Look for red errors
3. **Check Network** - Verify API calls success
4. **Check Local Storage** - Application tab
5. **Run type check** - `npm run type-check`
6. **Run tests** - `npm test`

### Common Issues Checklist
- [ ] Node version is 18+ (`node --version`)
- [ ] npm version is 9+ (`npm version`)
- [ ] `.env.local` exists with `SUPABASE_URL` set
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Browser opens to http://localhost:5173

---

## Next Steps

1. ✅ Run: `npm install`
2. ✅ Run: `npm test` (verify all tests pass)
3. ✅ Run: `npm run dev` (start development server)
4. ✅ Visit: http://localhost:5173 in browser
5. ✅ Test features (onboarding, validation, consent banner)
6. ✅ Start building!

**Production deployment:** See [README.md](README.md) → Deployment section.

---

**Happy coding!** 🚀
