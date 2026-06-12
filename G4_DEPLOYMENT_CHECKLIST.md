# G4 Action Follow-Up Engine — Deployment Checklist

## Status: ✅ Code Complete | ⏳ Deployment Pending

All code is written, tested locally, and integrated. To go live, follow these steps:

---

## 📋 Pre-Deployment Verification

- [ ] Verify `src/engines/actionFollowUpEngine.js` exists and exports as default
- [ ] Verify `api_src/follow_up/follow-up-handler.js` exists and is added to `api/index.js`
- [ ] Verify `src/components/ActionFollowUpPanel.jsx` exists and imports correctly
- [ ] Verify `migrations/V10__action_follow_up_system.sql` follows Flyway naming convention
- [ ] Verify `src/follow-up-panel.css` is imported in `src/App.jsx` or `src/main.jsx`
- [ ] Verify environment variables are set in `.env.local`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` (for narrative generation)

---

## 🗄️ Database Deployment

### Step 1: Run V10 Migration

In Supabase:
1. Navigate to **SQL Editor** → **New Query**
2. Copy entire contents of `migrations/V10__action_follow_up_system.sql`
3. Paste into SQL editor
4. Click **Run** (or Ctrl+Enter)
5. Verify: Tables `action_follow_ups`, `follow_up_delta_reports`, `behavior_signals` appear in Table Editor

Alternatively, if using Flyway CLI locally:
```bash
flyway -url=jdbc:postgresql://... -user=postgres -password=... migrate
```

### Step 2: Verify RLS Policies

In Supabase Table Editor:
1. Select `action_follow_ups` → **Policies** tab
2. Confirm 4 policies exist:
   - `Users can view their own action follow-ups` (SELECT)
   - `Users can insert their own action follow-ups` (INSERT)
   - `Users can update their own action follow-ups` (UPDATE)
   - Similar for `follow_up_delta_reports` and `behavior_signals`

---

## 🚀 API Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: G4 Action Follow-Up Engine — Day 7/30 re-engagement scheduling and delta tracking"
git push origin main
```

### Step 2: Deploy to Vercel

Vercel should auto-deploy on push. Monitor:
1. [Vercel Dashboard](https://vercel.com) → Select project
2. Watch build progress
3. Verify build succeeds (green ✓)
4. Test endpoints:
   ```bash
   curl -X GET "https://your-domain.vercel.app/api/follow-up/health"
   ```

### Step 3: Verify Environment Variables in Vercel

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Confirm these are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
3. If missing, add them and redeploy

---

## 🧪 Manual Testing (Post-Deployment)

### Test 1: Schedule a Follow-Up

```bash
curl -X POST "https://your-domain.vercel.app/api/follow-up/schedule" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "insight": {
      "id": "test-insight",
      "category": "Behavior",
      "headline": "You spend more than you plan"
    },
    "action": "Track every purchase for 7 days",
    "assessment": {
      "behaviourScore": 50,
      "awarenessScore": 60,
      "stabilityScore": 40,
      "healthScore": 50
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "followUp": {
    "id": "uuid",
    "user_id": "test-user-123",
    "action_committed": "Track every purchase for 7 days",
    "day_7_reminder_date": "2024-XX-XX...",
    "day_30_reminder_date": "2024-XX-XX..."
  },
  "message": "Follow-up scheduled. You'll receive a Day 7 check-in..."
}
```

### Test 2: Get Pending Follow-Ups

```bash
curl -X GET "https://your-domain.vercel.app/api/follow-up/pending?userId=test-user-123" \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "followUps": [...]
}
```

### Test 3: Submit Day 7 Response

```bash
curl -X POST "https://your-domain.vercel.app/api/follow-up/day-7/respond" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "followUpId": "uuid",
    "response": {
      "actionCompleted": true,
      "progressScore": 85,
      "obstacles": "Forgot to track once, but caught up"
    }
  }'
```

### Test 4: Get Metrics

```bash
curl -X GET "https://your-domain.vercel.app/api/follow-up/metrics?userId=test-user-123" \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
{
  "success": true,
  "metrics": {
    "totalFollowUps": 1,
    "day7ResponseRate": 100,
    "day30ResponseRate": 0,
    "actionSustainmentRate": 0,
    "habitFormationRate": 0,
    "averageHealthImprovement": 0
  }
}
```

---

## 🎨 Frontend Testing

### In Browser (After Deployment)

1. **Navigate to:** `https://your-domain/#reports` (after taking assessment)
2. **Verify UI:**
   - [ ] "Your Most Important Insight" card displays
   - [ ] "I will do this this week" button is visible
   - [ ] Click button → network request to `/api/follow-up/schedule` succeeds
   - [ ] "Action Follow-Ups" panel appears below (initially empty if no due reminders)
3. **Create a pending follow-up:**
   - Manually update DB to set `day_7_reminder_date` to today
   - Refresh browser
   - Verify follow-up appears in ActionFollowUpPanel
   - Expand and submit response form
   - Verify success message + page reload

---

## 🔔 Notification System (Optional — Not Yet Built)

Currently, the app fetches pending follow-ups **on load only**. For true re-engagement, implement:

### Option 1: Client-Side (Simple, MVP)
- On app load, call `/api/follow-up/pending` 
- If any due, show modal notification
- ✅ Already implemented in App.jsx

### Option 2: Supabase Edge Functions (Recommended)
- Deploy Edge Function that runs on a schedule (e.g., 9 AM daily)
- Queries `action_follow_ups` where `day_7_reminder_date <= now()` and `day_7_status = 'scheduled'`
- Sends email/SMS/push via external service (e.g., Twilio, SendGrid)
- Updates `day_7_status = 'sent'`

### Option 3: External Cron Job (Scalable)
- Host cron endpoint at `/api/follow-up/send-reminders`
- External service (e.g., cron-job.org) hits endpoint daily
- Endpoint loops through pending follow-ups, sends notifications

---

## ✅ Deployment Success Checklist

- [ ] V10 migration runs without errors
- [ ] Tables exist with RLS policies
- [ ] API code deploys to Vercel
- [ ] Environment variables set in Vercel
- [ ] Test endpoints respond (see Manual Testing above)
- [ ] Frontend renders ActionFollowUpPanel without errors
- [ ] Can schedule follow-up from SingleMostImportantInsight
- [ ] Can submit Day 7 response form
- [ ] Metrics endpoint returns valid data
- [ ] Navigate through flow: Assessment → Reports → Insight → Schedule → Pending follow-up → Response → Metrics

---

## 🐛 Troubleshooting

### Error: "SUPABASE_URL not defined"
- [ ] Check `.env.local` has `SUPABASE_URL` set
- [ ] Check Vercel Environment Variables panel
- [ ] Redeploy after setting vars

### Error: "RLS policy violation"
- [ ] Verify Supabase user is authenticated (JWT in headers)
- [ ] Verify RLS policies allow `auth.uid()` read/write
- [ ] Check DB policy names match table names

### Error: "404 on /api/follow-up/..."
- [ ] Verify `api/index.js` imports `followUpHandler`
- [ ] Verify route matcher includes `/api/follow-up`
- [ ] Redeploy Vercel

### UI Component Not Rendering
- [ ] Check browser console for errors
- [ ] Verify `ActionFollowUpPanel.jsx` imports are correct
- [ ] Verify `follow-up-panel.css` is imported
- [ ] Check network tab: is `/api/follow-up/pending` request firing?

---

## 📞 Next Steps

1. **Deploy V10 migration** (highest priority — unblocks API)
2. **Deploy API to Vercel** (verify endpoints work)
3. **Manual test cycle** (follow Manual Testing section above)
4. **Verify UI integration** (ActionFollowUpPanel renders, forms work)
5. **Optional: Implement notification system** (for true re-engagement)

---

## 📊 Success Metrics

Once deployed, track:
- **Schedule rate:** % of users who click "I will do this"
- **Day 7 response rate:** % who respond to reminder
- **Day 30 response rate:** % who complete 30-day check-in
- **Habit formation rate:** % with `habit_formed = true` at Day 30
- **Average health improvement:** Avg delta in health score between baseline and Day 30
- **Action sustainment rate:** % with `action_sustained = true` at Day 30

**Target KPIs (from Blueprint Ch. 12):**
- Day 7 response rate: ≥60%
- Day 30 response rate: ≥40%
- Habit formation rate: ≥30%
- Action sustainment rate: ≥50%
