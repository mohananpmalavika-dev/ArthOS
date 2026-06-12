# G4 Action Follow-Up Engine — Technical Deep Dive

## Overview

The Action Follow-Up Engine implements the "Day 7 & Day 30 re-engagement" validation metric from ARTH.OS Blueprint Ch. 12. It tracks whether users follow through on their committed financial actions and measures behavior change via delta calculations.

---

## 🏗️ Architecture Layers

### 1. Database Layer (V10 Migration)

**Tables:**

#### `action_follow_ups`
Tracks each user's scheduled reminders and responses across Day 7 & Day 30.

```sql
CREATE TABLE action_follow_ups (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_id TEXT NOT NULL,
  insight_category VARCHAR(50),
  insight_headline TEXT,
  action_committed TEXT,
  baseline_behaviour_score NUMERIC,
  baseline_awareness_score NUMERIC,
  baseline_stability_score NUMERIC,
  baseline_overall_health NUMERIC,
  
  -- Day 7 tracking
  day_7_reminder_date TIMESTAMP NOT NULL,
  day_7_status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled | sent | responded | skipped
  day_7_response_date TIMESTAMP,
  day_7_action_completed BOOLEAN,
  day_7_response_text TEXT,
  day_7_progress_score NUMERIC,  -- 0-100
  day_7_obstacles TEXT,
  
  -- Day 30 tracking
  day_30_reminder_date TIMESTAMP NOT NULL,
  day_30_status VARCHAR(20) DEFAULT 'scheduled',
  day_30_response_date TIMESTAMP,
  day_30_action_sustained BOOLEAN,
  day_30_response_text TEXT,
  day_30_progress_score NUMERIC,
  day_30_habit_formed BOOLEAN,
  day_30_obstacles TEXT,
  day_30_complete BOOLEAN DEFAULT FALSE,
  
  scheduled_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_action_follow_ups_user_id` — Fast user lookup
- `idx_action_follow_ups_day_7_reminder` — Find due Day 7 reminders
- `idx_action_follow_ups_day_30_reminder` — Find due Day 30 reminders
- `idx_action_follow_ups_day_7_status` — Filter by status

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`

Ensures users can only access their own follow-ups.

#### `follow_up_delta_reports`
Stores the behavior change delta calculated after Day 30 response.

```sql
CREATE TABLE follow_up_delta_reports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  follow_up_id UUID NOT NULL REFERENCES action_follow_ups(id),
  
  -- Deltas (Day 30 score minus Day 0 baseline)
  behavior_delta NUMERIC DEFAULT 0,
  awareness_delta NUMERIC DEFAULT 0,
  stability_delta NUMERIC DEFAULT 0,
  health_delta NUMERIC DEFAULT 0,
  
  -- Improvement indicators
  improved BOOLEAN DEFAULT FALSE,
  improvement_percentage NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Why separate table?**
- Follow-up lifecycle can be tracked without delta (user might not complete Day 30 yet)
- Delta is "computed" data, distinct from "event" data
- Easier to query "how many users improved?" via this table

#### `behavior_signals`
Logs signal events triggered by follow-up responses (for future ML training).

```sql
CREATE TABLE behavior_signals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  signal_type VARCHAR(100),  -- 'day_7_action_follow_up', 'day_30_follow_up', etc.
  signal_source VARCHAR(50) DEFAULT 'action_follow_up',
  signal_value NUMERIC,  -- e.g., progress score
  signal_data JSONB,  -- { progressScore, actionCompleted, obstacles, ... }
  
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Backend Engine (actionFollowUpEngine.js)

Singleton class that orchestrates all business logic.

#### Key Methods

**`scheduleFollowUp(userId, insight, action, assessment)`**
- Called when user clicks "I will do this this week"
- Creates `action_follow_ups` record
- Sets `day_7_reminder_date = today + 7 days`
- Sets `day_30_reminder_date = today + 30 days`
- Stores baseline B/A/S/Health scores
- Returns the created record

```javascript
const followUp = await engine.scheduleFollowUp(
  'user-123',
  { id: 'insight-456', category: 'Behavior', headline: 'Spend > Plan' },
  'Track purchases for 7 days',
  { behaviourScore: 50, awarenessScore: 60, stabilityScore: 40, healthScore: 50 }
);
// followUp.id, followUp.day_7_reminder_date, followUp.day_30_reminder_date
```

**`getPendingFollowUps(userId)`**
- Queries `action_follow_ups` where `(day_7_status='scheduled' AND day_7_reminder_date <= now()) OR (day_30_status='scheduled' AND day_30_reminder_date <= now())`
- Returns array of follow-ups the user should respond to right now
- Used by frontend to populate ActionFollowUpPanel

**`recordDay7Response(followUpId, userId, response)`**
- Called when user submits Day 7 form
- Updates follow-up record:
  - `day_7_status = 'responded'`
  - `day_7_response_date = now()`
  - `day_7_action_completed = response.actionCompleted`
  - `day_7_progress_score = response.progressScore` (0-100)
  - `day_7_obstacles = response.obstacles`
- Creates signal in `behavior_signals` table for ML training
- Returns updated record

**`recordDay30Response(followUpId, userId, response, currentAssessment)`**
- Called when user submits Day 30 form (most important call)
- Updates follow-up record with Day 30 data
- **Calculates delta:**
  - `behavior_delta = currentAssessment.behaviourScore - baseline_behaviour_score`
  - `awareness_delta = currentAssessment.awarenessScore - baseline_awareness_score`
  - ... (same for stability and health)
  - `improved = (health_delta > 0)`
  - `improvement_percentage = (health_delta / baseline_overall_health * 100)` capped at 0-100%
- **Creates `follow_up_delta_reports` record** with deltas
- **Updates `follow_up_delta_reports` to compute:**
  - `behavior_delta, awareness_delta, stability_delta, health_delta`
  - `improved` (boolean)
  - `improvement_percentage` (0-100%)
- Creates signal in `behavior_signals`
- Returns `{ followUp, delta }` for narrative generation

**`calculateBehaviorDelta(baseline, current)`**
- Helper: computes delta for a single dimension
- Returns: delta (change) + percentage improvement

**`generateDay30Narrative(followUp, delta)`**
- Creates user-facing narrative for Day 30 results
- Pattern: "Your [dimension] improved by [%]. [emoji reaction]. Next: [suggestion]"
- Returns narrative string for display in Day30DeltaReport component

**`calculateFollowUpMetrics(userId)`**
- Aggregates all follow-ups for a user
- Returns:
  ```javascript
  {
    totalFollowUps,
    completedFollowUps,
    day7ResponseRate,      // % responded to Day 7
    day30ResponseRate,     // % responded to Day 30
    actionSustainmentRate, // % with day_30_action_sustained = true
    habitFormationRate,    // % with day_30_habit_formed = true
    averageHealthImprovement,  // avg of improvement_percentage across deltas
    averageProgressScore   // avg of progress scores
  }
  ```

**`getFollowUpHistory(userId, limit)`**
- Returns paginated list of past follow-ups (completed + pending)
- Used for analytics dashboards

**`getDeltaReports(userId, limit)`**
- Returns paginated list of delta reports
- Each delta shows the behavior change from a completed follow-up cycle

---

### 3. API Layer (actionFollowUpHandler.js)

REST endpoints that expose engine methods via HTTP.

#### Endpoint: `POST /api/follow-up/schedule`
```
Request Headers:
  Content-Type: application/json
  x-user-id: {userId}

Request Body:
  {
    insight: { id, category, headline },
    action: "Track purchases for 7 days",
    assessment: { behaviourScore, awarenessScore, ... }
  }

Response:
  {
    success: true,
    followUp: { id, day_7_reminder_date, day_30_reminder_date, ... },
    message: "Follow-up scheduled. You'll receive a Day 7 check-in on [date]."
  }
```

#### Endpoint: `GET /api/follow-up/pending?userId={userId}`
```
Response:
  {
    success: true,
    count: 2,
    followUps: [
      {
        id: "uuid",
        action_committed: "Track purchases for 7 days",
        day_7_reminder_date: "2024-12-28T09:00:00Z",
        day_7_status: "scheduled",
        ... (all Day 7 fields)
      },
      { ... Day 30 follow-up ... }
    ]
  }
```

#### Endpoint: `POST /api/follow-up/day-7/respond`
```
Request Body:
  {
    followUpId: "uuid",
    response: {
      actionCompleted: true,
      progressScore: 85,
      obstacles: "Forgot once but caught up"
    }
  }

Response:
  {
    success: true,
    followUp: { ... updated record ... },
    message: "Day 7 response recorded! Progress: 85%. Great job tracking your action!"
  }
```

#### Endpoint: `POST /api/follow-up/day-30/respond`
```
Request Body:
  {
    followUpId: "uuid",
    response: {
      actionSustained: true,
      progressScore: 70,
      habitFormed: false
    },
    currentAssessment: {
      behaviourScore: 65,
      awarenessScore: 75,
      stabilityScore: 50,
      healthScore: 70
    }
  }

Response:
  {
    success: true,
    followUp: { ... updated record ... },
    delta: {
      behavior_delta: 15,
      awareness_delta: 15,
      stability_delta: 10,
      health_delta: 20,
      improvement_percentage: 40
    },
    narrative: "Your health improved by 40%! 🎉 Your behaviour score improved (+15 pts). ...",
    message: "Day 30 assessment complete! Check your progress report."
  }
```

---

### 4. React UI Layer

#### ActionFollowUpPanel Component

**Props:**
```typescript
interface ActionFollowUpPanelProps {
  userId: string;
  followUps: Array<ActionFollowUp>;
}
```

**Features:**
- **Metrics Header** → Displays response rate %, action sustain rate %, avg improvement %
- **Follow-Up List** → Expandable items, one per pending follow-up
- **Day 7 Form:**
  - Progress slider (0-100%)
  - Action completed checkbox
  - Obstacles textarea
  - Submit button → calls `/api/follow-up/day-7/respond`
- **Day 30 Form:**
  - Progress slider (0-100%)
  - Action sustained checkbox
  - Habit formed checkbox
  - Reflection textarea
  - Submit button → calls `/api/follow-up/day-30/respond` + displays narrative

**Integration in SingleMostImportantInsight:**
```javascript
// When user clicks "I will do this this week"
const handleCommit = async () => {
  // ... localStorage update ...
  
  // Call follow-up API
  const res = await fetch('/api/follow-up/schedule', {
    method: 'POST',
    headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      insight: primaryInsight,
      action: primaryInsight.actionable,
      assessment: assessment
    })
  });
  
  // Scheduled! Day 7 reminder will appear on app reload
};
```

**Integration in App.jsx:**
```javascript
const [pendingFollowUps, setPendingFollowUps] = useState([]);

// Fetch on user auth
useEffect(() => {
  if (!isBrowser() || !currentUserId) return;
  fetch(`/api/follow-up/pending?userId=${currentUserId}`, {
    headers: { 'x-user-id': currentUserId }
  })
    .then(r => r.json())
    .then(data => setPendingFollowUps(data.followUps || []))
    .catch(e => console.error(e));
}, [currentUserId]);

// Render in reports flow
{showReportsSection && (
  <ActionFollowUpPanel userId={currentUserId} followUps={pendingFollowUps} />
)}
```

---

## 🔄 User Journey

### Timeline

**T = 0 (Day 0)**
- User takes assessment → sees reports
- Sees SingleMostImportantInsight with action recommendation
- Clicks "I will do this this week"
- → Calls `/api/follow-up/schedule`
- → Record created in `action_follow_ups` with:
  - `day_7_reminder_date = TODAY + 7 days`
  - `day_30_reminder_date = TODAY + 30 days`
  - `baseline_behaviour_score = 50` (from assessment)

**T + 7 days**
- User opens app
- ActionFollowUpPanel fetches pending follow-ups
- Day 7 reminder appears: "Did you track your purchases?"
- User expands form, submits:
  - Progress: 85%
  - Action completed: ✓
  - Obstacles: "Forgot once but caught up"
- → Calls `/api/follow-up/day-7/respond`
- → Record updated: `day_7_status='responded'`, `day_7_progress_score=85`
- → Signal logged in `behavior_signals`

**T + 30 days**
- Day 30 reminder appears: "30-day check-in: Is this a habit now?"
- User submits:
  - Progress: 70%
  - Action sustained: ✓
  - Habit formed: ✗ (not yet)
- User takes updated assessment:
  - New behaviour_score: 65 (up from baseline 50)
  - New awareness_score: 75
  - New stability_score: 50
  - New health_score: 70
- → Calls `/api/follow-up/day-30/respond` with new assessment
- → Deltas calculated:
  - `behavior_delta = 65 - 50 = +15`
  - `health_delta = 70 - 50 = +20`
  - `improvement_percentage = (20 / 50 * 100) = 40%`
- → Record created in `follow_up_delta_reports`
- → Narrative generated: "Your health improved by 40%! 🎉 Your behaviour improved (+15 pts). Keep going!"
- → User sees success message + narrative

---

## 📊 Metrics & Analytics

### Per-User Metrics (from `calculateFollowUpMetrics`)

After 5 completed follow-up cycles, a user's profile might show:

```javascript
{
  totalFollowUps: 5,
  completedFollowUps: 4,           // 80% completion
  day7ResponseRate: 0.80,          // 80% responded to Day 7
  day30ResponseRate: 0.60,         // 60% responded to Day 30 (harder to complete)
  actionSustainmentRate: 0.50,     // 50% sustained action at Day 30
  habitFormationRate: 0.25,        // 25% formed habit
  averageHealthImprovement: 0.15,  // +15% average improvement in health score
  averageProgressScore: 0.72       // 72% average progress
}
```

### Blueprint KPIs (Ch. 12)

The system tracks these metrics against targets:

| Metric | Target | Method |
|--------|--------|--------|
| Day 7 response rate | ≥60% | % of records with `day_7_status = 'responded'` |
| Day 30 response rate | ≥40% | % of records with `day_30_status = 'responded'` |
| Action sustainment rate | ≥50% | % of records with `day_30_action_sustained = true` |
| Habit formation rate | ≥30% | % of records with `day_30_habit_formed = true` |
| Average health improvement | +10% | Avg `improvement_percentage` from delta reports |

### Queries for Analytics

**Cohort Analysis: 7-day response rate**
```sql
SELECT 
  COUNT(*) as total_day_7_reminders,
  COUNT(CASE WHEN day_7_status = 'responded' THEN 1 END) as responded,
  (COUNT(CASE WHEN day_7_status = 'responded' THEN 1 END) * 100.0 / COUNT(*)) as response_rate
FROM action_follow_ups
WHERE day_7_reminder_date <= NOW()
AND day_7_reminder_date >= NOW() - INTERVAL '30 days';
```

**Habit Formation Rate (full cycle)**
```sql
SELECT 
  COUNT(*) as total_completed,
  COUNT(CASE WHEN day_30_habit_formed THEN 1 END) as habit_formed,
  (COUNT(CASE WHEN day_30_habit_formed THEN 1 END) * 100.0 / COUNT(*)) as habit_rate
FROM action_follow_ups
WHERE day_30_complete = true;
```

**Average Health Improvement**
```sql
SELECT AVG(improvement_percentage) as avg_improvement
FROM follow_up_delta_reports
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

## 🚨 Edge Cases & Considerations

### User Takes Reassessment After Day 7 but Before Day 30
- Current implementation: `recordDay30Response` uses the assessment passed in the API call
- Alternative: Could store most-recent assessment at time of Day 30 response
- Decision: MVP uses passed-in assessment (less data storage)

### User Never Responds to Day 7
- Follow-up remains in `day_7_status = 'scheduled'`
- Day 30 reminder still appears
- User can respond to Day 30 without Day 7 response
- Delta calculation still works (Day 0 vs Day 30)

### User Takes Multiple Assessments
- Each follow-up cycle tracks its own baseline
- Multiple follow-ups can run in parallel (different actions)
- No conflict: each `action_follow_ups` record is independent

### Notification Delivery
- **Current implementation:** Client-side fetch on app load
- **Limitation:** User must open app to see reminder
- **Future:** Server-side notifications (email, SMS, push) via Edge Functions or cron job

---

## 🔐 Security

### Row-Level Security (RLS)
All tables enforce RLS via Supabase JWT:
```sql
CREATE POLICY "Users can view their own action follow-ups"
  ON action_follow_ups
  FOR SELECT
  USING (auth.uid() = user_id);
```

This ensures:
- User can only see their own follow-ups
- User can only insert with their own `user_id`
- No cross-user data leakage

### API Authentication
- API handler checks `x-user-id` header
- Supabase service role used for writes (trusted backend)
- RLS enforces final security boundary

---

## 🚀 Future Enhancements

1. **Multi-action tracking** → User commits to multiple actions simultaneously
2. **Social sharing** → "I improved by 40%! #BehaviorChange" tweet
3. **Coach interventions** → AI coach suggests adjustments based on Day 7 response
4. **A/B testing** → Test different action recommendations vs. control
5. **Longitudinal studies** → Track 90-day, 1-year improvement trends
6. **Gamification** → Badges for sustained habits, streaks, milestones
7. **Predictive models** → ML model predicts Day 30 success based on Day 7 response
8. **Cohort analysis** → Compare improvement rates across demographics/behavior types

---

## 📝 Testing Checklist

- [ ] V10 migration creates tables with correct schema
- [ ] RLS policies allow authenticated users to read/write own records
- [ ] `scheduleFollowUp` creates record with correct Day 7 & Day 30 dates
- [ ] `getPendingFollowUps` filters correctly (scheduled status + due date)
- [ ] `recordDay7Response` updates record + creates signal
- [ ] `recordDay30Response` calculates delta correctly
- [ ] Delta calculation handles negative health changes (improvement_percentage < 0)
- [ ] `calculateFollowUpMetrics` aggregates correctly across multiple follow-ups
- [ ] API endpoints return correct HTTP status codes (201 for create, 200 for reads, 400 for validation errors)
- [ ] React component renders pending follow-ups
- [ ] Submit forms call correct API endpoints
- [ ] Error handling displays user-friendly messages

---

## 📚 Related Documentation

- Blueprint Ch. 12: User Journey, validation metrics
- `actionFollowUpEngine.js`: Full implementation
- `actionFollowUpHandler.js`: API endpoints
- `ActionFollowUpPanel.jsx`: React UI
- `G4_DEPLOYMENT_CHECKLIST.md`: Deployment steps
