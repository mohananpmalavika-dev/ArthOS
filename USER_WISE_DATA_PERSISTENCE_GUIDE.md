# User-Wise Data Persistence Implementation Guide

## Overview
This document details the comprehensive user-wise data persistence system implementation for ARTH.OS. The system ensures all assessment data, telemetry, scores, and feedback are properly isolated per authenticated user.

## Architecture

### Core Components

#### 1. **Authentication Layer** (AuthContext.jsx)
- JWT-based authentication with HS256 algorithm
- 30-day token expiration
- Token stored in localStorage under "arth-os-auth"
- Automatic session restoration on app reload
- Background sync on login

**Key Functions:**
- `login(email, password)` - Authenticates user, migrates anonymous data, syncs to server
- `register(name, email, password)` - Creates new user, migrates data, initiates sync
- `logout()` - Clears session and user-scoped localStorage data
- `syncLocalDataToServer(userId, authToken)` - Pushes unsynced local data to server

**User Data Migrations on Login/Register:**
- `migrateAnonymousData(userId)` - From storageManager.js
- `migrateAnonymousDataToUser(userId)` - From userDataManager.js
- Both functions preserve anonymous data while copying to user scope

#### 2. **User Data Manager** (lib/userDataManager.js)
Manages all user-scoped localStorage operations with userId namespacing.

**Storage Key Pattern:** `arth-os-user:{userId}:{dataType}`

**Core Functions:**
- `getUserStorageKey(userId, dataType)` - Generate namespaced storage key
- `saveUserAssessment(userId, assessment, storageKey)` - Save assessment to user scope
- `loadUserAssessment(userId, storageKey)` - Retrieve user assessment from storage
- `saveUserScoreHistory(userId, scoreHistory)` - Save score progression
- `loadUserScoreHistory(userId)` - Get score history array
- `addScoreToUserHistory(userId, scoreEntry)` - Append new score (max 100 kept)
- `getUserLatestScore(userId)` - Get most recent score
- `migrateAnonymousDataToUser(userId)` - Move anon data to user scope
- `clearUserData(userId)` - Purge all user-scoped data (called on logout)
- `userHasData(userId)` - Check if user has stored data

#### 3. **User-Scoped API Endpoints**

All endpoints require JWT authentication in Authorization header: `Bearer {token}`

##### GET /api/user/assessments
**Purpose:** Retrieve all assessments for authenticated user

**Parameters:**
- `limit` (optional, default 50, max 100) - Results per page
- `offset` (optional, default 0) - Pagination offset

**Response:**
```json
{
  "status": "ok",
  "data": [
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "assessment_type": "v2",
      "health_score": 75,
      "behaviour_score": 68,
      "awareness_score": 72,
      "personality_type": "Pragmatist",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25,
    "hasMore": false
  }
}
```

**Error Handling:**
- 401: Missing or invalid JWT token
- 400: Invalid pagination parameters
- 500: Database error

##### GET /api/user/assessment-detail?id={assessmentId}
**Purpose:** Retrieve single assessment if user is owner

**Parameters:**
- `id` (required) - Assessment UUID

**Response:**
```json
{
  "status": "ok",
  "data": {
    "id": "uuid",
    "user_id": "user-uuid",
    "full_assessment_data": {},
    "health_score": 75,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Handling:**
- 401: Not authenticated
- 404: Assessment not found or user doesn't own it
- 500: Database error

##### GET /api/user/scores
**Purpose:** Retrieve user's score history with trend analysis

**Parameters:**
- `limit` (optional, default 50)
- `offset` (optional, default 0)

**Response:**
```json
{
  "status": "ok",
  "data": [
    {
      "health_score": 75,
      "behaviour_score": 68,
      "awareness_score": 72,
      "stability_score": 70,
      "habits_score": 65,
      "personality_type": "Pragmatist",
      "future_risk_label": "Medium",
      "future_risk_score": 45,
      "awareness_gap_months": 6,
      "nominal_survival_months": 24,
      "crisis_survival_months": 8,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "trends": {
    "healthScore": {
      "current": 75,
      "previous": 70,
      "direction": "up",
      "change": 5
    },
    "behaviourScore": {
      "current": 68,
      "previous": 72,
      "direction": "down",
      "change": -4
    }
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

#### 4. **Custom React Hooks** (hooks/useUserAssessments.js)

##### useUserAssessments()
**Returns:** `{ assessments, loading, error, pagination, refetch }`

Automatically fetches user's assessments on mount if authenticated.

##### useUserScoreHistory()
**Returns:** `{ scores, loading, error, trends, pagination, refetch }`

Fetches score history with trend analysis.

##### useUserAssessmentDetail(assessmentId)
**Returns:** `{ assessment, loading, error, refetch }`

Fetches specific assessment if user is owner.

#### 5. **User Assessment History Component** (components/UserAssessmentHistory.jsx)

**Features:**
- Displays score trends with directional indicators
- Recent assessments list with scores and personality type
- Score timeline showing historical progression
- Responsive grid layout
- Auto-loads on component mount

**Usage:**
```jsx
import { UserAssessmentHistory } from "../components/UserAssessmentHistory.jsx";

export function ProfilePage() {
  return <UserAssessmentHistory />;
}
```

#### 6. **Database Schema Changes** (migrations/V12__add_user_id_to_assessments.sql)

**New Columns:**
- `assessments.user_id` - FK to users(id) with CASCADE delete
- `anonymous_telemetry.user_id` - User identifier for telemetry
- `anonymous_telemetry.is_authenticated` - Boolean flag
- `tester_feedback.user_id` - User identifier for feedback

**New Indexes:**
- `assessments(user_id)` - Fast user-specific lookups
- `anonymous_telemetry(user_id, created_at)` - Filtered query optimization
- `tester_feedback(user_id, created_at)` - Sorted user feedback

**Row Level Security (RLS):**
```sql
-- Users can only read their own assessments
CREATE POLICY user_assessments_policy ON assessments
  FOR SELECT TO authenticated
  USING (user_id = current_user_id());

-- Users can only read their own telemetry
CREATE POLICY user_telemetry_policy ON anonymous_telemetry
  FOR SELECT TO authenticated
  USING (user_id = current_user_id());
```

## Implementation Workflow

### Phase 1: Backend Setup (✅ COMPLETE)
1. ✅ Created JWT extraction functions in saveAssessment.js and telemetry.js
2. ✅ Added user_id capture to assessment and telemetry records
3. ✅ Created user-scoped API endpoints (assessments, assessment-detail, scores)
4. ✅ Updated api_src/index.js with new endpoint exports
5. ✅ Created database migration V12 with schema changes

### Phase 2: Frontend Data Management (🟡 IN PROGRESS)
1. ✅ Created userDataManager.js for localStorage namespacing
2. ✅ Created useUserAssessments.js hooks for data fetching
3. ✅ Updated AuthContext.jsx to call migrations on login/logout
4. ✅ Created UserAssessmentHistory.jsx component
5. ✅ Created user-assessment-history.css styling
6. ⏳ **NEXT: Execute database migration V12**
7. ⏳ **NEXT: Update App.jsx to use user-scoped hooks**
8. ⏳ **NEXT: Test all endpoints with real JWT tokens**

### Phase 3: Extended Coverage (⏳ NOT STARTED)
1. ⏳ Add user_id to feedback.js endpoint
2. ⏳ Add user_id to memory.js endpoint
3. ⏳ Add user_id to reminders.js endpoint
4. ⏳ Add user_id to decisions.js endpoint
5. ⏳ Add user_id to follow-ups endpoints
6. ⏳ Create user-scoped endpoints for all data types

### Phase 4: Testing & Validation (⏳ NOT STARTED)
1. ⏳ Run database migration: `node scripts/run_migrations.js`
2. ⏳ Test JWT authentication on all user endpoints
3. ⏳ Verify user_id filtering works correctly
4. ⏳ Test cross-user data isolation
5. ⏳ Test with multiple simultaneous users
6. ⏳ Verify RLS policies prevent unauthorized access

## Usage Examples

### In a React Component
```jsx
import { useUserAssessments } from "../hooks/useUserAssessments.js";
import { useAuth } from "../context/AuthContext.jsx";

export function MyDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { assessments, loading, error } = useUserAssessments();

  if (!isAuthenticated) return <p>Please log in</p>;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Your Assessments ({assessments.length})</h1>
      {assessments.map(a => (
        <div key={a.id}>{a.assessment_type}: {a.health_score}</div>
      ))}
    </div>
  );
}
```

### Saving Assessment with User Context
```jsx
import { useAuth } from "../context/AuthContext.jsx";
import { saveUserAssessment } from "../lib/userDataManager.js";

export function SaveAssessment() {
  const { user } = useAuth();

  const handleSave = (assessmentData) => {
    if (user?.id) {
      saveUserAssessment(user.id, assessmentData);
    }
  };

  return <button onClick={() => handleSave(data)}>Save</button>;
}
```

### Fetching Specific Assessment
```jsx
import { useUserAssessmentDetail } from "../hooks/useUserAssessments.js";

export function ViewAssessment({ assessmentId }) {
  const { assessment, loading } = useUserAssessmentDetail(assessmentId);

  if (loading) return <p>Loading...</p>;
  if (!assessment) return <p>Assessment not found</p>;

  return <div>{JSON.stringify(assessment)}</div>;
}
```

## Data Isolation Strategy

### localStorage Namespacing
```
Anonymous data:    "arth-os-{dataType}"
User-scoped data:  "arth-os-user:{userId}:{dataType}"
```

### Database User Filtering
```sql
-- All user queries include WHERE user_id = $1
SELECT * FROM assessments 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT $2 OFFSET $3;
```

### JWT Token Verification
```javascript
// All user endpoints verify JWT before querying
const user = extractUserFromToken(req);
if (!user) return res.status(401).json({ error: "Unauthorized" });

// Then filter all queries by user.id
WHERE user_id = user.id
```

## Error Handling

### Client-Side (React Hooks)
- Returns structured `{ data, loading, error }`
- Auto-retries with backoff on network errors
- Logs errors to console with context prefix
- Graceful degradation when not authenticated

### Server-Side (API Endpoints)
- 401: Missing/invalid JWT token
- 400: Invalid parameters (missing id, bad limit)
- 404: Resource not found or not owned by user
- 500: Database/server errors with error message

## Security Considerations

1. **JWT Token Validation**
   - Verified with HS256 algorithm
   - 30-day expiration enforced
   - Bearer token format required

2. **User ID Extraction**
   - Extracted from decoded JWT, not from client parameters
   - Cannot be spoofed by client
   - Prevents cross-user data access

3. **Row Level Security (RLS)**
   - Database enforces user isolation at table level
   - Defense-in-depth: multiple layers of protection
   - Even if API is compromised, RLS prevents data breach

4. **CORS & Headers**
   - Authorization header required for all user endpoints
   - Content-Type validated for POST/PUT requests
   - CORS properly configured

## Monitoring & Debugging

### Console Logs
```
[UserDataManager] Saved assessment for user {userId}
[UserDataManager] Loaded assessment for user {userId}
[useUserAssessments] Error: Failed to fetch assessments
[AuthContext] Migrated anonymous assessment to user {userId}
```

### Common Issues

**Issue: "Not authenticated" error**
- Solution: Ensure JWT token is being passed in Authorization header
- Check: `Authorization: Bearer {token}`

**Issue: 404 on GET /api/user/assessments**
- Solution: Check that endpoint is exported from api_src/index.js
- Check: Run `node scripts/run_migrations.js` to create schema

**Issue: Empty assessment list**
- Solution: Verify assessments were saved with current user_id
- Check: User has actually completed assessments

**Issue: localStorage cleared unexpectedly**
- Solution: Check logout function is being called properly
- Check: clearUserData() is clearing correct user ID

## Next Steps

1. **Immediate:** Run database migration V12
   ```bash
   node scripts/run_migrations.js
   ```

2. **Testing:** Verify user endpoints work
   ```bash
   curl -H "Authorization: Bearer {token}" http://localhost:5175/api/user/assessments
   ```

3. **Integration:** Update components to use user hooks
   - Replace anonymous data fetching with useUserAssessments()
   - Add UserAssessmentHistory component to profile page

4. **Extension:** Repeat process for other data types
   - decisions, reminders, follow-ups, banking data
   - Each follows same pattern: JWT extraction → user_id filter → RLS policy

5. **Validation:** Comprehensive testing
   - Multi-user simultaneous access
   - Cross-user data access attempts (should fail)
   - Session persistence and restoration
   - Data migration on login

---

**Last Updated:** January 2024
**Status:** Phase 2 In Progress (75% complete)
**Owner:** AI Coaching System
