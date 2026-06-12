# localStorage → Database Migration Guide

## Overview
This guide shows how to migrate input data from localStorage to database storage. All user assessment inputs, drafts, decisions, and telemetry should be stored in the database, not in localStorage.

## What to Migrate

### ✅ Keep in localStorage (UI State + Auth)
- `arth-os-auth` - JWT token (can migrate to secure cookie later)
- `arth-os-onboarding-complete` - UI state
- Other temporary UI state flags

### ❌ Migrate to Database (Input Data)
1. **Assessment Drafts** - `assessmentAutoSave.js` DRAFT_KEY
2. **Assessment Queue** - `App.jsx` ASSESSMENT_SAVE_QUEUE_KEY
3. **Telemetry Events** - `assessmentTelemetry.js` SESSION_KEY, TELEMETRY_STORAGE_KEY
4. **Decisions** - `decisionLedger.js`, `decisionIntelligence.js`
5. **Preferences** - `reminderPrefs.js`, EXPRESS_MODE_KEY from AssessmentSection.jsx
6. **Analytics** - `roastAnalytics.js` ROAST_ANALYTICS_KEY
7. **SMS Signals** - `smsSignalsPersistence.js`
8. **Usage Tracking** - `assessmentUsageTracker.js`
9. **Cognition Cache** - `cognitionEngine.js`
10. **Scoring Queue** - `scoring-v2.js`

## Migration Pattern

### Before (localStorage)
```javascript
// Save to localStorage
const draft = { answers: {...}, step: 5 };
localStorage.setItem('arth-os-draft', JSON.stringify(draft));

// Load from localStorage
const saved = JSON.parse(localStorage.getItem('arth-os-draft'));
```

### After (Database via hooks)
```javascript
import { useAssessmentDraft } from '../hooks/useUserInputData';

function MyComponent() {
  const { draft, saveDraft, loadDraft } = useAssessmentDraft();

  // Save to database
  const handleSave = async () => {
    const draft = { answers: {...}, step: 5 };
    await saveDraft(draft, 'v2');
  };

  // Load from database
  useEffect(() => {
    loadDraft('v2');
  }, [loadDraft]);

  return <div>{draft?.draft_data?.step}</div>;
}
```

## File-by-File Migration

### 1. assessmentAutoSave.js

**Current Code:**
```javascript
const DRAFT_KEY = 'arth-os-draft';

export function saveDraft(draft) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft() {
  const raw = window.localStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}
```

**Updated Code:**
```javascript
// This module should now use database via API
// Components using it should call:
import { useAssessmentDraft } from '../hooks/useUserInputData';

// In component:
const { draft, saveDraft, loadDraft } = useAssessmentDraft();
```

### 2. App.jsx - Assessment Save Queue

**Current Code:**
```javascript
const ASSESSMENT_SAVE_QUEUE_KEY = 'arth-os-save-queue';

// Save queue
const raw = window.localStorage.getItem(ASSESSMENT_SAVE_QUEUE_KEY);
const queue = raw ? JSON.parse(raw) : [];
queue.push(assessment);
window.localStorage.setItem(ASSESSMENT_SAVE_QUEUE_KEY, JSON.stringify(queue));
```

**Updated Code:**
```javascript
// Use database via hook
const { savePreference } = useUserPreferences();

// Save queue to database
await savePreference('assessment_save_queue', queue);

// Or create dedicated endpoint POST /api/user/saveQueuedAssessment
```

### 3. assessmentTelemetry.js

**Current Code:**
```javascript
const SESSION_KEY = 'arth-os-session';
const TELEMETRY_STORAGE_KEY = 'arth-os-telemetry';

// Save event
const events = JSON.parse(localStorage.getItem(TELEMETRY_STORAGE_KEY) || '[]');
events.push(event);
localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events));
```

**Updated Code:**
```javascript
import { useTelemetry } from '../hooks/useUserInputData';

// In component:
const { logEvent } = useTelemetry();

// Log event to database
await logEvent('assessment_started', { step: 1, timestamp: Date.now() });
```

### 4. decisionLedger.js

**Current Code:**
```javascript
const DECISION_LEDGER_KEY = 'arth-os-decisions';

export function addDecision(decision) {
  const raw = window.localStorage.getItem(DECISION_LEDGER_KEY);
  const store = raw ? JSON.parse(raw) : [];
  store.push(decision);
  window.localStorage.setItem(DECISION_LEDGER_KEY, JSON.stringify(store));
}
```

**Updated Code:**
```javascript
import { useUserDecisions } from '../hooks/useUserInputData';

// In component:
const { saveDecision } = useUserDecisions();

// Save decision to database
await saveDecision(decision, 'assessment');
```

### 5. reminderPrefs.js

**Current Code:**
```javascript
const REMINDER_PREFS_KEY = 'arth-os-reminders';

export function saveReminders(prefs) {
  localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs));
}
```

**Updated Code:**
```javascript
import { useUserPreferences } from '../hooks/useUserInputData';

// In component:
const { savePreference } = useUserPreferences();

// Save preferences to database
await savePreference('reminder_preferences', prefs);
```

### 6. AssessmentSection.jsx - EXPRESS_MODE_KEY

**Current Code:**
```javascript
const EXPRESS_MODE_KEY = 'arth-os-express-mode';

// Save express mode
window.localStorage.setItem(EXPRESS_MODE_KEY, String(next));

// Load express mode
const saved = window.localStorage.getItem(EXPRESS_MODE_KEY) === "true";
```

**Updated Code:**
```javascript
import { useUserPreferences } from '../hooks/useUserInputData';

// In component:
const { savePreference, preferences } = useUserPreferences();

// Save to database
await savePreference('express_mode', true);

// Load from database (preferences object)
const isExpressMode = preferences.express_mode === true;
```

## API Endpoints

### Save Assessment Draft
```
POST /api/user/saveDraft
Content-Type: application/json
Authorization: Bearer {token}

{
  "draft_data": { "answers": {...}, "step": 5 },
  "assessment_type": "v2"
}

Response:
{
  "status": "ok",
  "data": { "id": "uuid", "draft_data": {...}, "updated_at": "2024-01-01..." }
}
```

### Load Assessment Draft
```
GET /api/user/loadDraft?assessment_type=v2
Authorization: Bearer {token}

Response:
{
  "status": "ok",
  "data": { "id": "uuid", "draft_data": {...}, "updated_at": "..." }
}
```

### Save Decision
```
POST /api/user/saveDecision
Content-Type: application/json
Authorization: Bearer {token}

{
  "decision_data": { "id": "dec1", "type": "risk" },
  "decision_type": "assessment",
  "outcome_data": { "result": "approved" }
}

Response:
{
  "status": "ok",
  "data": { "id": "uuid", "user_id": "user123", "decision_data": {...} }
}
```

### Save Telemetry Event
```
POST /api/user/saveTelemetry
Content-Type: application/json
Authorization: Bearer {token}

{
  "event_type": "assessment_started",
  "event_data": { "step": 1, "mode": "express" },
  "session_id": "session-123..."
}

Response:
{
  "status": "ok",
  "data": { "id": "uuid", "user_id": "user123", "timestamp": "2024-01-01..." }
}
```

### Save Preference
```
POST /api/user/savePreference
Content-Type: application/json
Authorization: Bearer {token}

{
  "preference_key": "express_mode",
  "preference_value": true
}

Response:
{
  "status": "ok",
  "data": { "id": "uuid", "preference_key": "express_mode", "preference_value": true }
}
```

## Implementation Steps

1. ✅ Create database tables (V13 migration)
2. ✅ Create API endpoints (saveDraft.js, loadDraft.js, etc.)
3. ✅ Create React hooks (useUserInputData.js)
4. **NEXT**: Update components to use hooks instead of localStorage
5. **THEN**: Remove all localStorage references except auth
6. **FINALLY**: Run migration and test data persistence

## Testing Checklist

- [ ] Login/register still works
- [ ] Assessment draft saves when user stops typing
- [ ] Draft loads on page refresh
- [ ] Decision data persists across sessions
- [ ] Telemetry events are logged to database
- [ ] Preferences load on app start
- [ ] No localStorage errors in console
- [ ] User data isolation verified (User A can't see User B's data)
- [ ] Logout clears all user data
- [ ] Multiple users can use app simultaneously

## Rollback Plan

If issues occur:
1. Keep localStorage migration code commented out
2. Keep old localStorage endpoints alive
3. Add feature flag: `USE_DATABASE_PERSISTENCE=false`
4. Revert components to use localStorage fallback

```javascript
// Fallback pattern
async function saveDraft(draft) {
  if (process.env.VITE_USE_DATABASE_PERSISTENCE === 'false') {
    localStorage.setItem('arth-os-draft', JSON.stringify(draft));
    return;
  }
  // Use database API
  await saveDraft(draft);
}
```
