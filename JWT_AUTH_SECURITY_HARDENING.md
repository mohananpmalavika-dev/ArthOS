# JWT-Based Authentication Security Hardening - Implementation Guide

## ✅ Completed Implementation Phase

### Phase 1: Database Schema & Auth Infrastructure
- ✅ Added `user_role VARCHAR(50) DEFAULT 'user'` column to users table
- ✅ Created role-based indexes for fast lookups
- ✅ Enhanced JWT payload to include `role` field during login

### Phase 2: Centralized Auth Helpers
- ✅ Created `requireAuth(req, res)` - Enforces valid JWT on all endpoints
- ✅ Created `requireAdminRole(req, res)` - Enforces JWT + admin role for sensitive operations
- ✅ Replaced all client-supplied userId extraction with JWT-derived identification

### Phase 3: Backend Handler Hardening
**Files Updated (7 total):**
1. ✅ `api_src/follow-up/follow-up-handler.js` - Removed x-user-id header extraction
2. ✅ `api_src/decision.js` - Removed query param userId extraction
3. ✅ `api_src/memory/sync.js` - Removed body userId extraction
4. ✅ `api_src/longitudinal/ai-coach-handler.js` - Refactored getUserId() to use JWT
5. ✅ `api_src/longitudinal/prediction-engine-handler.js` - Removed query param userId
6. ✅ `api_src/b2b/admin.js` - Replaced static API key with JWT + admin role
7. ✅ `api_src/auth/login.js` & `api_src/auth/me.js` - Include role in responses

### Phase 4: Frontend Security Cleanup
**Files Updated (3 total):**
1. ✅ `src/App.jsx` - Removed insecure userId in query params and headers
2. ✅ `src/components/ActionFollowUpPanel.jsx` - Removed x-user-id headers
3. ✅ `src/App.jsx` - Removed hardcoded admin login form code

## 🔧 Deployment & Testing Requirements

### Pre-Deployment Checklist

#### 1. Database Migration
```bash
# Run migration to add user_role column
# This should be done before deploying the new backend code
# Existing users will default to role='user'

# Create an admin user (if needed):
# UPDATE users SET user_role = 'admin' WHERE email = 'admin@example.com';
```

#### 2. Environment Variables
**Remove from deployment:**
- `ARTHOS_ADMIN_KEY` - No longer used (replaced by JWT + role)
- Verify these are set correctly:
  - `JWT_SECRET` (used for HS256 signing)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### 3. AuthContext Verification
The frontend AuthContext already:
- ✅ Sends `Authorization: Bearer ${token}` on all API calls
- ✅ Persists JWT to localStorage
- ✅ Validates token on app mount via GET /api/auth/me
- ✅ No changes needed - already compatible

### Testing Scenarios

#### Scenario 1: User Login Flow
**Test:** Standard user with role='user'
```bash
1. POST /api/auth/login { email, password }
   Response includes: { user: { id, email, name, role: 'user' }, token: 'jwt...' }
2. Token stored in AuthContext + localStorage
3. GET /api/auth/me (with Authorization header)
   Response: { user: { id, email, name, role: 'user' } }
4. Subsequent API calls automatically include Authorization header
```

#### Scenario 2: Admin Operations
**Test:** Admin user attempting to change partner tier
```bash
1. Admin logs in: POST /api/auth/login { email: 'admin@example.com', password }
   Response includes: { user: { role: 'admin' }, token: 'jwt...' }
2. Call admin endpoint: POST /api/b2b/admin/change-tier
   Authorization: Bearer <admin_jwt>
   Expected: Success (200)
3. Non-admin user attempts same endpoint:
   Authorization: Bearer <user_jwt>
   Expected: 403 Forbidden with "Admin role required"
```

#### Scenario 3: Unauthorized Access
**Test:** Missing or invalid JWT
```bash
1. Call protected endpoint without Authorization header:
   GET /api/decision
   Expected: 401 Unauthorized "Valid JWT token required"
2. Call protected endpoint with expired/invalid token:
   Authorization: Bearer invalid_token
   Expected: 401 Unauthorized
```

#### Scenario 4: Frontend Security Improvements
**Test:** Verify no client-supplied user identity is sent
```bash
1. Open browser DevTools → Network tab
2. Trigger a decision fetch or follow-up request
3. Verify:
   - ✅ NO `?userId=...` query parameter
   - ✅ NO `x-user-id` header
   - ✅ Authorization header present: `Authorization: Bearer <token>`
```

#### Scenario 5: Multi-Tab Session Management
**Test:** User logs in on Tab A, Tab B should auto-authenticate
```bash
1. Open Tab A, login normally
2. Open Tab B to the app
3. Tab B should auto-restore session from localStorage + validate via GET /api/auth/me
4. Both tabs share the same JWT token
```

### Rollback Plan

If issues arise during deployment:

1. **Quick Rollback:** Deploy previous backend version (before JWT changes)
   - Old endpoints still accept userId in query/headers
   - Admin endpoints revert to ARTHOS_ADMIN_KEY auth
   - Timeline: < 5 minutes

2. **Database Rollback:** The new `user_role` column is backward compatible
   - Existing code will default role='user' for null values
   - Can be reversed if needed (drop column, users table still functional)

3. **Frontend Rollback:** Old frontend will not work with new backend
   - Must coordinate frontend + backend deploys
   - Recommend: Deploy backend first (backward compatible with old frontend for 1 hour)
   - Then deploy frontend immediately

## 📋 Post-Implementation Verification

### Code Review Checklist
- [ ] No remaining `req.query.userId` or `req.body.userId` without JWT verification
- [ ] No remaining `req.headers['x-user-id']` usages
- [ ] All handlers call `requireAuth()` or `requireAdminRole()` as first validation
- [ ] All response errors use correct HTTP status codes (401 for auth, 403 for authorization)
- [ ] JWT_CONFIG secret properly loaded from environment (fallback only for dev)

### Security Audit Checklist
- [ ] ARTHOS_ADMIN_KEY no longer hardcoded in code (only in old admin.js if statements removed)
- [ ] No hardcoded credentials anywhere (admin login form removed)
- [ ] JWT expiry properly set (30 days) and checked by jsonwebtoken library
- [ ] Role field properly validated (admin role check happens server-side only)

### Performance Verification
- [ ] JWT verification happens once per request (in requireAuth/requireAdminRole)
- [ ] Database role lookups use indexed `idx_users_role` column
- [ ] No N+1 queries for role checks (single JWT decode suffices)
- [ ] Response times unchanged (JWT verification is < 1ms)

## 📚 Key Security Principles Applied

### 1. **Trust Only Server-Verified Tokens**
```javascript
// BEFORE (INSECURE)
const userId = req.query.userId;  // Client can forge any userId

// AFTER (SECURE)
const user = await requireAuth(req, res);
const userId = user.id;  // Only from verified JWT
```

### 2. **Role-Based Access Control**
```javascript
// Centralized admin check
const admin = await requireAdminRole(req, res);
if (!admin) return; // Already sent error response
// Now safe to perform admin operations
```

### 3. **No Client-Supplied Identity**
```javascript
// BEFORE (INSECURE)
fetch('/api/decision?userId=hack', { headers: { 'x-user-id': 'hack' } })

// AFTER (SECURE)
fetch('/api/decision')  // AuthContext automatically sends Authorization header
```

### 4. **Fail Secure**
- Invalid JWT → 401 (blocks access)
- Missing JWT → 401 (blocks access)
- Non-admin on admin endpoint → 403 (blocks access)
- Invalid role → defaults to 'user' (least privileged)

## 🚀 Production Deployment Steps

### Step 1: Pre-Deployment (2 hours before)
1. Back up database (automated)
2. Verify migration script tested locally
3. Confirm JWT_SECRET, SUPABASE env vars in production config

### Step 2: Deploy Database Migration (1 hour before)
```bash
# Apply migration to add user_role column
psql $DATABASE_URL < migrations/V4__add_user_role.sql

# Verify migration succeeded
SELECT column_name FROM information_schema.columns WHERE table_name='users';
# Should show: id, email, name, password_hash, user_role, created_at, last_login_at, avatar_url
```

### Step 3: Deploy Backend Code
1. Deploy updated Node.js backend to Vercel
2. Monitor error logs for 401/403 patterns
3. Test all admin endpoints with admin JWT

### Step 4: Deploy Frontend Code
1. Deploy updated React frontend
2. Verify no x-user-id headers in network requests
3. Test user login → dashboard flow

### Step 5: Post-Deployment Verification
1. ✅ Test user login
2. ✅ Test admin operations
3. ✅ Test API rate limiting still works
4. ✅ Monitor error logs (should see 401 for invalid tokens)

## 🔒 Security Guarantees

After this implementation:

| Attack Vector | Before | After |
|---|---|---|
| Client forges userId | ❌ Possible | ✅ Blocked (JWT signature required) |
| Admin impersonation | ❌ Possible (static key) | ✅ Blocked (role check + JWT) |
| Session hijacking | ⚠️ Risky (localStorage only) | ✅ Mitigated (httpOnly would help more) |
| Token expiry bypass | ⚠️ 30 days | ✅ Verified by jsonwebtoken library |
| Role escalation | ❌ Possible | ✅ Blocked (server-side role verification) |

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** Frontend gets 401 after login
- Check: Is AuthContext sending Authorization header?
- Check: Is JWT token valid in localStorage?
- Solution: Clear localStorage + re-login

**Issue:** Admin endpoints return 403
- Check: Does user have role='admin' in database?
- Check: Is JWT valid and not expired?
- Solution: Verify user record, check JWT payload with jwt.io

**Issue:** Existing integrations fail
- Cause: They send userId in query param (old pattern)
- Solution: Update to send Authorization header instead

## 📖 Reference Documentation

- JWT Specification: https://tools.ietf.org/html/rfc7519
- jsonwebtoken library: https://github.com/auth0/node-jsonwebtoken
- HTTP Status Codes: https://httpwg.org/specs/rfc9110.html#overview.of.status.codes
- Role-Based Access Control (RBAC): https://en.wikipedia.org/wiki/Role-based_access_control
