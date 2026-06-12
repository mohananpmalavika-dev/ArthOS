## Quick Verification Checklist - User-Wise Data Persistence

This checklist helps verify all components are working correctly.

### ✅ Pre-Flight Checks

**1. Database Migration Applied**
```bash
# Run migration (CRITICAL - must do first)
node scripts/run_migrations.js
```
Expected output: Migration V12 completes successfully

**Verify:** Check that user_id columns exist
```sql
-- Connect to your database and run:
SELECT column_name FROM information_schema.columns 
WHERE table_name='assessments' AND column_name='user_id';
-- Should return: user_id
```

---

### ✅ Frontend Infrastructure Checks

**2. Check All New Files Exist**
```bash
# Verify these files were created:
ls -la src/hooks/useUserAssessments.js
ls -la src/lib/userDataManager.js
ls -la src/components/UserAssessmentHistory.jsx
ls -la src/styles/user-assessment-history.css
```
Expected: All 4 files should exist with no errors

**3. Check AuthContext Updated**
```bash
# Verify imports were added
grep "clearUserData" src/context/AuthContext.jsx
grep "migrateAnonymousDataToUser" src/context/AuthContext.jsx
```
Expected: Both functions should be found

---

### ✅ API Endpoint Checks

**4. Start Dev Server**
```bash
npm run dev
# Server should start on http://localhost:5175
```

**5. Test Login and Get JWT Token**
- Navigate to http://localhost:5175/#login
- Use test account: email=test@example.com, password=test123 (or register new)
- After login, check localStorage for token
- Open browser DevTools → Application → LocalStorage
- Find key: "arth-os-auth"
- Copy the token value (long string)

**6. Test Unauthenticated Request (should fail with 401)**
```bash
curl http://localhost:5175/api/user/assessments
```
Expected response: `{"status":"error","error":"Unauthorized"}`

**7. Test Authenticated Request (with JWT token)**
```bash
# Replace {TOKEN} with actual JWT from step 5
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:5175/api/user/assessments
```
Expected response:
```json
{
  "status": "ok",
  "data": [],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 0,
    "hasMore": false
  }
}
```

**8. Test Score Endpoint**
```bash
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:5175/api/user/scores
```
Expected: Same structure as assessments (initially empty)

---

### ✅ React Component Checks

**9. Import Hook Test**
Create a test file to verify hooks work:
```jsx
// test-hooks.jsx
import { useUserAssessments } from "./hooks/useUserAssessments.js";
import { useAuth } from "./context/AuthContext.jsx";

export function TestHooks() {
  const { user, token } = useAuth();
  const { assessments, loading, error } = useUserAssessments();

  return (
    <div>
      <p>User: {user?.email}</p>
      <p>Token: {token ? "✓ Present" : "✗ Missing"}</p>
      <p>Assessments: {assessments.length}</p>
      <p>Loading: {loading ? "Yes" : "No"}</p>
      <p>Error: {error || "None"}</p>
    </div>
  );
}
```

**10. Render UserAssessmentHistory Component**
Add this to App.jsx temporarily to test:
```jsx
import { UserAssessmentHistory } from "./components/UserAssessmentHistory.jsx";

// In your render method:
<UserAssessmentHistory />
```
Expected: Component renders with "Your Assessment History" heading

---

### ✅ Data Persistence Checks

**11. Test Data Isolation - Create Two Users**

**User A:**
```javascript
// In browser console after login as User A
localStorage.getItem("arth-os-auth")  // Should show User A's token
// Navigate to assessment page and save an assessment
// Then check:
Object.keys(localStorage).filter(k => k.includes("arth-os-user"))
// Should show user-scoped keys
```

**User B:**
```javascript
// Logout User A (click logout button)
// Login as User B
localStorage.getItem("arth-os-auth")  // Should show User B's token (different userId)

// Verify User B sees empty data:
fetch("/api/user/assessments", {
  headers: { "Authorization": "Bearer " + JSON.parse(localStorage.getItem("arth-os-auth")).token }
}).then(r => r.json()).then(d => console.log(d.data))
// Should show: [] (User B has no assessments)
```

**User A Returned:**
```javascript
// Login as User A again
// Verify their data is still there:
fetch("/api/user/assessments", {
  headers: { "Authorization": "Bearer " + JSON.parse(localStorage.getItem("arth-os-auth")).token }
}).then(r => r.json()).then(d => console.log("Assessments:", d.data.length))
// Should show: 1 (User A's assessment still exists)
```

---

### ✅ Error Handling Checks

**12. Test Error Scenarios**

**Missing JWT:**
```bash
curl http://localhost:5175/api/user/assessments
# Expected: 401 Unauthorized
```

**Invalid JWT:**
```bash
curl -H "Authorization: Bearer invalid.token.here" \
  http://localhost:5175/api/user/assessments
# Expected: 401 Unauthorized
```

**Invalid Pagination:**
```bash
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:5175/api/user/assessments?limit=999
# Expected: 400 Bad Request
```

**Non-existent Assessment:**
```bash
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:5175/api/user/assessment-detail?id=nonexistent-uuid
# Expected: 404 Not Found
```

---

### ✅ Storage and Memory Checks

**13. Check localStorage Cleanup on Logout**
```javascript
// Before logout, check keys:
Object.keys(localStorage)

// Logout (click logout button)

// After logout, verify user keys are cleared:
Object.keys(localStorage).filter(k => k.includes("arth-os-user"))
// Should show: [] (all user-scoped data cleared)

// But "arth-os-auth" should be removed too:
localStorage.getItem("arth-os-auth")
// Should show: null
```

**14. Check Data Migration on Login**
```javascript
// Before login, create some anonymous data:
localStorage.setItem("arth-os-assessment", JSON.stringify({ test: "data" }))

// Login (click login button)

// Check that data was migrated:
Object.keys(localStorage).filter(k => k.includes("arth-os-user"))
// Should show keys like: ["arth-os-user:{userId}:migrated-anonymous-assessment", ...]

// Verify migrated data exists:
const key = Object.keys(localStorage).find(k => k.includes("migrated-anonymous"))
localStorage.getItem(key)
// Should show: {"test":"data"}
```

---

### ✅ Documentation Checks

**15. Verify Documentation Exists**
```bash
# Check main guide created:
ls -la USER_WISE_DATA_PERSISTENCE_GUIDE.md

# Verify it contains:
grep -c "User-Wise Data Persistence" USER_WISE_DATA_PERSISTENCE_GUIDE.md
grep -c "useUserAssessments" USER_WISE_DATA_PERSISTENCE_GUIDE.md
grep -c "clearUserData" USER_WISE_DATA_PERSISTENCE_GUIDE.md
```

---

## Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| 401 errors on /api/user/* endpoints | JWT token in Authorization header | Copy token from localStorage, format: "Bearer {token}" |
| Empty assessment list | Migration V12 executed | Run: node scripts/run_migrations.js |
| Component not rendering | File paths correct | Check import statements match file locations |
| User data not isolated | Database schema | Verify user_id column exists in assessments table |
| localStorage cleared unexpectedly | Logout function | Check clearUserData() is called with correct userId |
| Hook errors "useAuth not found" | AuthContext provider | Ensure <AuthProvider> wraps component tree in App.jsx |

---

## Sign-Off Verification

When all checks pass, you can confirm:

- [x] Database migration V12 applied successfully
- [x] All new files created and accessible
- [x] AuthContext properly updated with migrations
- [x] User endpoints working with JWT authentication
- [x] User data isolation verified with multi-user test
- [x] Error handling working for edge cases
- [x] localStorage cleanup working on logout
- [x] Data migration working on login
- [x] Documentation complete and accurate
- [x] Component renders without errors

**Status:** Ready for extended coverage (adding user_id to other data types)

---

**Last Updated:** January 2024
