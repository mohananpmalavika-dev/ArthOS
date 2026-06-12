# Implementation Task List: localStorage → Database Migration

## STEP 1: Apply Database Migration (Manual)

**Status:** ⏳ Requires User Action

### Instructions:
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/gqjlfejmhrmdbmtvnais/sql/new
2. Copy SQL from: `migrations/V13__user_input_data_persistence.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify: Check "Schema" tab, confirm 4 new tables exist

**Time Required:** 2 minutes

---

## STEP 2: Update Components (In Order)

### Task 2.1: assessmentAutoSave.js
**File:** `src/engines/assessmentAutoSave.js`
**Current State:** Uses localStorage DRAFT_KEY
**Change Required:** Replace with useAssessmentDraft hook
**Impact:** Draft auto-save will use database instead of localStorage

**Before:**
```javascript
const DRAFT_KEY = 'arth-os-draft';

export function saveDraft(draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn('[assessmentAutoSave] Save failed:', e.message);
  }
}

export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
```

**After:**
```javascript
// assessmentAutoSave.js - Updated for database persistence

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Create a promise-based wrapper for use in non-React functions
let globalDraftSaver = null;

// Call this in App.jsx to register the draft saver
export function registerDraftSaver(saveFn) {
  globalDraftSaver = saveFn;
}

export async function saveDraft(draft) {
  if (!globalDraftSaver) {
    console.warn('[assessmentAutoSave] Draft saver not registered, using fallback');
    return;
  }
  try {
    await globalDraftSaver(draft);
  } catch (e) {
    console.warn('[assessmentAutoSave] Save failed:', e.message);
  }
}

export function loadDraft() {
  // Drafts must be loaded from React component using useAssessmentDraft hook
  // This function is deprecated - use the hook instead
  return null;
}
```

### Task 2.2: App.jsx - Assessment Save Queue
**File:** `src/App.jsx`
**Current State:** Uses localStorage ASSESSMENT_SAVE_QUEUE_KEY (lines 214, 226, 228)
**Change Required:** Replace with database API or useUserPreferences

**Before (Line 214-228):**
```javascript
const raw = window.localStorage.getItem(ASSESSMENT_SAVE_QUEUE_KEY);
const queue = raw ? JSON.parse(raw) : [];
queue.push(assessment);
window.localStorage.setItem(ASSESSMENT_SAVE_QUEUE_KEY, JSON.stringify(queue));
```

**After:**
```javascript
// In App.jsx, add hook at top level
const { savePreference } = useUserPreferences();

// When saving assessment to queue
const queue = []; // ... build queue
await savePreference('assessment_save_queue', queue);
```

### Task 2.3: App.jsx - Onboarding State
**File:** `src/App.jsx`
**Current State:** Uses localStorage "arth-os-onboarding-complete" (lines 721, 728, 438)
**Change Required:** Keep in localStorage (UI state) OR move to database

**Decision:** Keep in localStorage for now (UI state, not input data)
- This is optional - it's not user input data

### Task 2.4: App.jsx - Draft Registration
**File:** `src/App.jsx`
**Location:** Add to component initialization

**Add this:**
```javascript
import { useAssessmentDraft } from './hooks/useUserInputData';
import { registerDraftSaver } from './engines/assessmentAutoSave';

function App() {
  const { saveDraft } = useAssessmentDraft();
  
  // Register draft saver for use in non-React code
  useEffect(() => {
    registerDraftSaver(saveDraft);
  }, [saveDraft]);
  
  // ... rest of component
}
```

### Task 2.5: assessmentTelemetry.js
**File:** `src/engines/assessmentTelemetry.js`
**Current State:** Uses localStorage SESSION_KEY and TELEMETRY_STORAGE_KEY (lines 53, 153, 162, 178, 187, 257)
**Change Required:** Replace with useTelemetry hook

**Before:**
```javascript
const SESSION_KEY = 'arth-os-session';
const TELEMETRY_STORAGE_KEY = 'arth-os-telemetry';

export function logEvent(event) {
  const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
  const events = raw ? JSON.parse(raw) : [];
  events.push(event);
  window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events));
}
```

**After:**
```javascript
// Global telemetry logger
let globalTelemetryLogger = null;

export function registerTelemetryLogger(logFn) {
  globalTelemetryLogger = logFn;
}

export async function logEvent(event) {
  if (!globalTelemetryLogger) {
    console.warn('[assessmentTelemetry] Logger not registered');
    return;
  }
  try {
    await globalTelemetryLogger('user_event', {
      ...event,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[assessmentTelemetry] Log failed:', e.message);
  }
}
```

**In App.jsx:**
```javascript
import { useTelemetry } from './hooks/useUserInputData';
import { registerTelemetryLogger } from './engines/assessmentTelemetry';

function App() {
  const { logEvent } = useTelemetry();
  
  useEffect(() => {
    registerTelemetryLogger(logEvent);
  }, [logEvent]);
}
```

### Task 2.6: decisionLedger.js
**File:** `src/lib/decisionLedger.js`
**Current State:** Uses localStorage DECISION_LEDGER_KEY (lines 23, 31)
**Change Required:** Replace with database

**Before:**
```javascript
const DECISION_LEDGER_KEY = 'arth-os-decisions';

export function addDecision(decision) {
  const raw = window.localStorage.getItem(DECISION_LEDGER_KEY);
  const store = raw ? JSON.parse(raw) : [];
  store.push(decision);
  window.localStorage.setItem(DECISION_LEDGER_KEY, JSON.stringify(store));
  return decision;
}
```

**After:**
```javascript
// Register decision saver on app init
let globalDecisionSaver = null;

export function registerDecisionSaver(saveFn) {
  globalDecisionSaver = saveFn;
}

export async function addDecision(decision) {
  if (!globalDecisionSaver) {
    console.warn('[decisionLedger] Saver not registered');
    return decision;
  }
  try {
    await globalDecisionSaver(decision, 'assessment');
  } catch (e) {
    console.warn('[decisionLedger] Save failed:', e.message);
  }
  return decision;
}
```

**In App.jsx:**
```javascript
import { useUserDecisions } from './hooks/useUserInputData';
import { registerDecisionSaver } from './lib/decisionLedger';

function App() {
  const { saveDecision } = useUserDecisions();
  
  useEffect(() => {
    registerDecisionSaver(saveDecision);
  }, [saveDecision]);
}
```

### Task 2.7: AssessmentSection.jsx - EXPRESS_MODE_KEY
**File:** `src/components/AssessmentSection.jsx`
**Current State:** Uses localStorage EXPRESS_MODE_KEY (lines 438, 448)
**Change Required:** Replace with database preference

**Before (Line 438, 448):**
```javascript
const isExpressMode = window.localStorage.getItem(EXPRESS_MODE_KEY) === "true";
window.localStorage.setItem(EXPRESS_MODE_KEY, String(next));
```

**After:**
```javascript
import { useUserPreferences } from '../hooks/useUserInputData';

function AssessmentSection() {
  const { savePreference, preferences } = useUserPreferences();
  const isExpressMode = preferences.express_mode === true;
  
  const setExpressMode = async (value) => {
    await savePreference('express_mode', value);
  };
  
  // ... rest of component
}
```

### Task 2.8: AssessmentSection.jsx - STEP_STORAGE_KEY
**File:** `src/components/AssessmentSection.jsx`
**Current State:** Uses localStorage STEP_STORAGE_KEY (lines 486, 699)
**Change Required:** Replace with database

**Before:**
```javascript
const saved = window.localStorage.getItem(STEP_STORAGE_KEY);
window.localStorage.setItem(STEP_STORAGE_KEY, String(newStep));
```

**After:**
```javascript
// Save step to database
await savePreference('assessment_step', newStep);
```

### Task 2.9: reminderPrefs.js
**File:** `src/lib/reminderPrefs.js`
**Current State:** Uses localStorage REMINDER_PREFS_KEY (lines 21, 33)
**Change Required:** Replace with database

**Before:**
```javascript
const REMINDER_PREFS_KEY = 'arth-os-reminders';

export function saveReminders(prefs) {
  localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs));
}
```

**After:**
```javascript
let globalPrefSaver = null;

export function registerPrefSaver(saveFn) {
  globalPrefSaver = saveFn;
}

export async function saveReminders(prefs) {
  if (!globalPrefSaver) return;
  try {
    await globalPrefSaver('reminder_preferences', prefs);
  } catch (e) {
    console.warn('[reminderPrefs] Save failed:', e.message);
  }
}
```

**In App.jsx:**
```javascript
import { useUserPreferences } from './hooks/useUserInputData';
import { registerPrefSaver } from './lib/reminderPrefs';

function App() {
  const { savePreference } = useUserPreferences();
  
  useEffect(() => {
    registerPrefSaver(savePreference);
  }, [savePreference]);
}
```

### Task 2.10: cognitionEngine.js
**File:** `src/engines/cognitionEngine.js`
**Current State:** Uses localStorage for cache (lines 130, 137)
**Change Required:** Replace with database caching

**Before:**
```javascript
const raw = window.localStorage.getItem(key);
window.localStorage.setItem(key, JSON.stringify(value));
```

**After:**
```javascript
let globalCacheSaver = null;

export function registerCacheSaver(saveFn) {
  globalCacheSaver = saveFn;
}

export async function setCognitionCache(key, value) {
  if (!globalCacheSaver) return;
  await globalCacheSaver(`cognition_cache_${key}`, value);
}
```

### Task 2.11: roastAnalytics.js
**File:** `src/lib/roastAnalytics.js`
**Current State:** Uses localStorage ROAST_ANALYTICS_KEY (lines 211, 222)
**Change Required:** Replace with database

**Similar pattern to reminderPrefs.js**
```javascript
// Replace localStorage with registered saver
await globalAnalyticsSaver('roast_analytics', this.data);
```

### Task 2.12: smsSignalsPersistence.js
**File:** `src/lib/smsSignalsPersistence.js`
**Current State:** Uses localStorage (lines 23, 37, 44)
**Change Required:** Replace with database

**Similar pattern to reminderPrefs.js**
```javascript
// Replace localStorage with:
await globalSmsSaver('sms_signals', storage);
```

### Task 2.13: assessmentUsageTracker.js
**File:** `src/lib/assessmentUsageTracker.js`
**Current State:** Uses localStorage STORAGE_KEY (lines 35, 61, 81, 131)
**Change Required:** Replace with database

**Similar pattern to other utility files**

### Task 2.14: decisionIntelligence.js
**File:** `src/engines/decisionIntelligence.js`
**Current State:** Uses localStorage DECISION_OUTCOME_KEY (lines 35, 43)
**Change Required:** Replace with saveDecision hook

### Task 2.15: scoring-v2.js
**File:** `src/lib/scoring-v2.js`
**Current State:** Uses localStorage queue keys (lines 1223, 1233, 1277)
**Change Required:** Replace with database

---

## STEP 3: Cleanup & Verification

### Task 3.1: Remove localStorage constants
Search for and remove all:
```javascript
const DRAFT_KEY = 'arth-os-draft';
const SESSION_KEY = 'arth-os-session';
const DECISION_LEDGER_KEY = 'arth-os-decisions';
// etc.
```

### Task 3.2: Search for remaining localStorage
```bash
grep -r "localStorage" src/ --include="*.{js,jsx}"
```
Should only find:
- AUTH_STORAGE_KEY in AuthContext.jsx (intentional)
- sessionStorage references (acceptable for session-scoped data)

### Task 3.3: Test localStorage removal
- [ ] Verify no console errors
- [ ] Verify all data persists across page reload
- [ ] Verify user isolation
- [ ] Verify logout clears data

---

## Execution Order

**Phase 1 (Must do):**
1. Apply V13 migration (manual in Supabase SQL Editor)

**Phase 2 (All core data):**
1. Task 2.1: assessmentAutoSave.js
2. Task 2.4: App.jsx - register draft saver
3. Task 2.5: assessmentTelemetry.js
4. Task 2.6: decisionLedger.js
5. Task 2.7/2.8: AssessmentSection.jsx preferences

**Phase 3 (All remaining data):**
1. Task 2.9: reminderPrefs.js
2. Task 2.10: cognitionEngine.js
3. Task 2.11: roastAnalytics.js
4. Task 2.12: smsSignalsPersistence.js
5. Task 2.13: assessmentUsageTracker.js
6. Task 2.14: decisionIntelligence.js
7. Task 2.15: scoring-v2.js

**Phase 4 (Cleanup):**
1. Task 3.1: Remove localStorage constants
2. Task 3.2: Search for remaining localStorage
3. Task 3.3: Test and verify

---

## Estimated Time per Task

- Tasks 2.1-2.15: 30 minutes each (includes testing) = 7.5 hours total
- Tasks 3.1-3.3: 1 hour
- **Total: ~8.5 hours** or **split into multiple sessions**

## Risk Assessment

**Low Risk:**
- Already have working hooks and API endpoints
- Patterns are simple and consistent
- Database schema and RLS policies already in place

**Mitigation:**
- Test each file individually
- Keep localStorage code commented out initially
- Add feature flag to switch between old/new
- Keep database transaction logs for rollback

## Success Criteria

- ✅ All 4 new database tables created
- ✅ All 15 files updated to use database APIs
- ✅ No localStorage references remaining (except auth)
- ✅ All data persists across sessions
- ✅ User data properly isolated
- ✅ No console errors
- ✅ Application performance unchanged or improved
