# AI Coach System - Quick Deployment Guide

## Overview
Full AI Coach system ready for production deployment. Follow these steps to activate the coaching features.

## Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase project active with PostgreSQL 14+
- [ ] OpenAI API key obtained
- [ ] Git repository up to date

## Step 1: Database Migration (2 minutes)

### Copy V8 migration to Supabase

1. Open Supabase dashboard → SQL Editor
2. Create new query, paste contents of `migrations/V8__ai_coach_system.sql`
3. Execute query
4. Verify 5 tables created:
   - `coach_conversations`
   - `coach_session_context`
   - `coach_recommendations`
   - `coach_memory_profiles`
   - `coach_performance_metrics`

```sql
-- Quick verification
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'coach_%' AND table_schema='public';
```

**Expected result**: 5 rows

---

## Step 2: Environment Configuration (2 minutes)

### Update `.env.local` or environment variables

```env
# Required (already existing)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NEW for AI Coach
OPENAI_API_KEY=sk-...
```

### Get OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to environment

**⚠️ Do NOT commit `.env.local` to git**

---

## Step 3: NPM Dependencies (1 minute)

```bash
# Install OpenAI SDK
npm install openai

# Verify installation
npm list openai
```

**Expected**: `openai@latest` (4.0.0 or higher)

---

## Step 4: Backend Deployment (3 minutes)

### Verify file locations

```
✅ api_src/longitudinal/ai-coach-engine.js (800+ lines)
✅ api_src/longitudinal/ai-coach-handler.js (400+ lines)
✅ api/index.js (updated with import + route)
```

### Deploy to Vercel (if applicable)

```bash
# Commit changes
git add .
git commit -m "Add AI Coach system - Session 3"

# Deploy
git push origin main
# Vercel auto-deploys

# Verify deployment
curl https://your-domain.com/api/coach/health?userId=test
```

**Expected response**:
```json
{
  "success": true,
  "service": "ai-coach-engine",
  "status": "operational",
  "openaiConfigured": true
}
```

---

## Step 5: Frontend Deployment (2 minutes)

### Verify component location

```
✅ src/components/AiCoachInterface.jsx (700+ lines)
```

### Import in your app

```jsx
import AiCoachInterface from './components/AiCoachInterface';

// In your routing:
<AiCoachInterface userId={currentUserId} />
```

### Deploy frontend

```bash
npm run build
npm run deploy
```

---

## Step 6: Verification (5 minutes)

### Test 1: Health Check

```bash
curl "http://localhost:3000/api/coach/health?userId=test"
```

Expected: `"status": "operational"`

### Test 2: Start Session

```bash
curl -X POST http://localhost:3000/api/coach/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "primaryConcern": "Spending Control"
  }'
```

Expected: `"success": true` with `sessionId`

### Test 3: Send Message

```bash
curl -X POST "http://localhost:3000/api/coach/sessions/YOUR_SESSION_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "message": "I spent too much money this week"
  }'
```

Expected: Coach response from GPT-4

### Test 4: Check Coaching Memory

```bash
curl "http://localhost:3000/api/coach/memory?userId=test-user-123"
```

Expected: User's coaching preferences

---

## Post-Deployment Setup (5 minutes)

### 1. Configure Monitoring

In your logging service:
- Track `tokens_used` field for cost monitoring
- Alert if average tokens per message exceeds 500
- Monitor API error rates

### 2. Test with Real User

1. Create test user account
2. Complete 5-question assessment (to populate Cognition Graph)
3. Start AI Coach session
4. Verify coach references user's beliefs/biases in greeting
5. Have a 5-message conversation
6. End session and check summary

### 3. Review Logs

Check for:
- ✅ No 404 errors on coach endpoints
- ✅ No 500 errors on message sending
- ✅ OpenAI API calls completing successfully
- ✅ Database RLS policies not blocking queries

---

## Integration with Existing Features

### Show Coach in Main Navigation

```jsx
<nav>
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/cognition-graph">Cognition Graph</Link>
  <Link to="/ai-coach">AI Coach</Link>  {/* NEW */}
</nav>
```

### Add to Assessment Flow

After user completes assessment:

```jsx
<Button onClick={() => navigate('/ai-coach')}>
  Chat with Financial Coach
</Button>
```

### Link Cognition Graph to Coach

In Cognition Graph Dashboard:

```jsx
<Button onClick={() => navigate('/ai-coach', { 
  state: { focusBelief: selectedBelief.id } 
})}>
  Discuss this belief with coach
</Button>
```

---

## Cost Tracking

### Monitor Token Usage

```sql
-- Daily token usage
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages,
  SUM(tokens_used) as total_tokens,
  ROUND(SUM(tokens_used) * 0.00003, 4) as estimated_cost  -- $0.03 per 1K tokens
FROM coach_conversations
WHERE message_type = 'coach_response'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Set Budget Alerts

At 1M tokens/month (cost ~$30):
- Email alert to admin
- Consider rate limiting per user
- Review prompt optimization

---

## Troubleshooting

### Issue: "OpenAI API 401 Error"

**Cause**: Invalid or expired API key

```bash
# Verify environment variable
echo $OPENAI_API_KEY

# Test directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: "Session Not Found"

**Cause**: User ID mismatch between requests

```javascript
// Verify same userId in all requests
const sessionResponse = await fetch('/api/coach/sessions', {
  body: JSON.stringify({ userId: "user-123", ... })
});

const messageResponse = await fetch('/api/coach/sessions/{sessionId}/messages', {
  body: JSON.stringify({ userId: "user-123", ... })  // MUST match
});
```

### Issue: "RLS Policy Violation"

**Cause**: Service key not used or policy misconfiguration

```javascript
// Verify using SERVICE_ROLE_KEY (not ANON_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // NOT ANON_KEY
);
```

### Issue: Coach Responses Very Slow

**Cause**: Long cognition context or network latency

**Solution**:
1. Reduce system prompt context (fewer beliefs/biases)
2. Cache cognition data in Redis
3. Use `gpt-4` (faster) instead of `gpt-4-turbo`
4. Check OpenAI API status

---

## Performance Optimization

### Cache Cognition Data (Optional)

```javascript
// In ai-coach-engine.js, add Redis caching:
const cachedData = await redis.get(`cognition:${userId}`);
if (cachedData) return JSON.parse(cachedData);

// After fetching:
await redis.setex(`cognition:${userId}`, 3600, JSON.stringify(data));
```

### Compress Old Conversations (Optional)

```sql
-- Archive conversations older than 30 days
INSERT INTO coach_conversations_archive
SELECT * FROM coach_conversations
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM coach_conversations
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Success Indicators

After deployment, you should see:

- ✅ Users can start coaching sessions
- ✅ Coach greetings reference user's beliefs/biases
- ✅ Conversations flow naturally (not robotic)
- ✅ Recommendations are specific and actionable
- ✅ Session summaries are insightful
- ✅ Coaching memory persists across sessions
- ✅ Analytics show acceptance rates > 60%
- ✅ User satisfaction ratings > 4/5 stars

---

## Rollback Plan

If critical issues occur:

1. **Disable Coach Endpoint**:
   ```javascript
   // In api/index.js, comment out:
   // { match: (pathname) => pathname.startsWith('/api/coach'), handler: aiCoachHandler },
   ```

2. **Rollback Database**:
   ```sql
   -- Drop V8 tables (WARNING: deletes all coach data)
   DROP TABLE IF EXISTS coach_performance_metrics;
   DROP TABLE IF EXISTS coach_memory_profiles;
   DROP TABLE IF EXISTS coach_recommendations;
   DROP TABLE IF EXISTS coach_session_context;
   DROP TABLE IF EXISTS coach_conversations;
   ```

3. **Communicate**:
   - Notify users of temporary unavailability
   - Deploy fix to ai-coach-engine.js
   - Re-enable endpoint

---

## Support Resources

- **API Documentation**: `docs/AI_COACH_ARCHITECTURE.md`
- **Code Examples**: `docs/AI_COACH_ARCHITECTURE.md#usage-examples`
- **Troubleshooting**: `docs/AI_COACH_ARCHITECTURE.md#troubleshooting`
- **OpenAI Docs**: https://platform.openai.com/docs/api-reference

---

## Approval & Sign-off

**Ready for Production**: ✅

Deployed and verified by: [Your Name]  
Date: [Deployment Date]  
Status: [Live/Staging/Testing]  

---

**Next Session**: Monitor usage, collect user feedback, prepare enhancement roadmap
