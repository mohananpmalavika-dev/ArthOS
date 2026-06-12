# Longitudinal Learning System Implementation Guide

## Overview

The Longitudinal Learning System is ARTH.OS's moat for tracking user financial evolution over time. It transforms transaction history into actionable behavioral insights through four interconnected engines:

1. **Behavior Evolution Engine** - Creates monthly/quarterly behavioral snapshots
2. **Pattern Learning Engine** - Detects recurring patterns and trends
3. **Lifecycle Scoring System** - Tracks user progression through financial maturity stages
4. **API & Frontend Layer** - Provides insights to users and partners

**Impact**: Users see their financial journey visualized. Banks/lenders access behavioral data via B2B API.

---

## Architecture

### Database Schema (V6 Migration)

**8 core tables:**

```
behavior_snapshots          → Monthly financial behavior profiles
behavior_patterns          → Detected recurring patterns
user_lifecycle_stages      → User's progression & maturity score
behavioral_scores          → Multi-dimensional behavioral profiles
financial_trends           → Time-series metric tracking
behavior_anomalies         → Unusual behaviors detected
predictive_insights        → AI-generated recommendations
user_evolution_journal     → Narrative of financial journey
```

All tables use **Row-Level Security (RLS)** to ensure users only see their data.

### Key Design Decisions

1. **Snapshot-Based Analysis**: Monthly snapshots rather than real-time calculations for performance
2. **Pattern Confidence Scoring**: 0-100 confidence score for each pattern (not just binary)
3. **Multi-Stage Lifecycle**: 7 stages (Discovery → Onboarding → Establishment → Optimization → Acceleration → Maturity → Planning)
4. **Component-Based Maturity**: Score broken into 5 weighted components (Savings, Investment, Debt, Risk, Planning)

---

## Module Documentation

### 1. Behavior Evolution Engine

**File**: `api_src/longitudinal/behavior-evolution-engine.js`

Analyzes transaction data and creates comprehensive behavioral profiles.

#### Core Functions

**`generateBehaviorSnapshot(userId, snapshotDate, periodType)`**
- Analyzes all transactions for a period (monthly/quarterly/annual)
- Calculates income, spending, savings metrics
- Generates behavioral indicators
- Returns comprehensive snapshot

**Example**:
```javascript
const result = await BehaviorEvolutionEngine.generateBehaviorSnapshot(
  userId,
  '2026-06-12',
  'monthly'
);
// Returns: {
//   success: true,
//   snapshot: { ...all metrics },
//   metrics: { income, expense, savings, spending, behavioral, risk, stability, trajectory }
// }
```

**Metrics Calculated**:
- **Income Analysis**: Total income, avg/txn, variance, frequency, consistency
- **Expense Analysis**: Total expense, avg/txn, variance, control score
- **Savings**: Amount saved, savings rate %, investment allocation
- **Spending Patterns**: Top category, discretionary ratio
- **Behavioral Indicators**: Payment discipline, impulse tendency, planning score
- **Risk Profile**: Risk tolerance level, comfort score
- **Stability Index**: 0-100 measure of behavioral consistency
- **Health Trajectory**: Improving/Declining/Stable

**Process**:
1. Fetch transactions for period
2. Calculate income/expense metrics
3. Analyze spending by category
4. Calculate behavioral indicators (payment history, impulse spending)
5. Assess risk profile
6. Measure stability (coefficient of variation)
7. Determine trajectory by comparing to previous snapshots
8. Create database record
9. Update digital twin

#### Other Functions

**`analyzeIncomeMetrics(transactions)`**
- Returns totalIncome, avgPerTransaction, variance, frequency, consistency

**`analyzeExpenseMetrics(transactions)`**
- Returns totalExpense, avgPerTransaction, variance, frequency, controlScore

**`calculateSavingsMetrics(userId, incomeMetrics, expenseMetrics)`**
- Calculates amountSaved, savingsRate, investment breakdown

**`analyzeSpendingPatterns(transactions)`**
- Returns top category, discretionary ratio, category breakdown

**`calculateBehavioralIndicators(userId, transactions, startDate, endDate)`**
- On-time payment percentage, impulse spending tendency, planning score

**`assessRiskProfile(userId, transactions)`**
- Returns risk tolerance level (conservative/moderate/aggressive)

**`calculateBehavioralStability(userId, transactions)`**
- Returns 0-100 stability index based on variance

**`determineHealthTrajectory(userId, currentDate)`**
- Compares to previous snapshots, returns improving/declining/stable

**`generateSnapshotsForAllUsers(periodType)`**
- Batch operation to generate snapshots for all active users
- Run as monthly/quarterly scheduled job

---

### 2. Pattern Learning Engine

**File**: `api_src/longitudinal/pattern-learning-engine.js`

Detects 5 types of financial patterns from transaction history.

#### Pattern Types

**1. Recurring Patterns** (daily/weekly/bi-weekly/monthly)
- Same merchant + consistent amount + regular intervals
- Example: "Gym subscription - ₹500 every Monday"
- Confidence: Based on interval and amount consistency

**2. Seasonal Patterns** (annual)
- Same spending month across multiple years
- Example: "Travel in December"
- Confidence: Increases with # of years observed

**3. Frequency Patterns** (daily/weekly habits)
- Peak activity on specific day of week or time of day
- Example: "Friday spending spikes" or "Morning coffee purchases"

**4. Trend Patterns** (long-term changes)
- Spending increasing/decreasing over time
- Uses linear regression to detect trend direction
- Example: "Savings rate improving 2% per month"

**5. Anomaly Patterns** (unusual behaviors)
- Outlier transactions (>2 std dev from mean)
- Spending spikes in specific months
- Example: "3 unusual large purchases detected"

#### Core Functions

**`detectAllPatterns(userId, analysisMonths = 12)`**
- Runs all 5 pattern detections
- Stores high-confidence patterns
- Returns breakdown by type

**Example**:
```javascript
const result = await PatternLearningEngine.detectAllPatterns(userId, 12);
// Returns: {
//   success: true,
//   patternsDetected: 8,
//   breakdown: { recurring: 3, seasonal: 2, frequency: 2, trend: 1, anomaly: 0 },
//   patterns: [ ...all patterns with confidence scores ]
// }
```

**Individual Detection Functions**:

**`detectRecurringPatterns(userId, transactions)`**
- Groups transactions by merchant + category
- Calculates interval and amount consistency
- Returns strong recurring patterns

**`detectSeasonalPatterns(userId, transactions)`**
- Groups by month across years
- Requires 2+ years of data to detect
- Returns seasonal spending patterns

**`detectFrequencyPatterns(userId, transactions)`**
- Analyzes day of week and time of day distribution
- Returns peak activity times

**`detectTrendPatterns(userId, transactions)`**
- Performs linear regression on monthly totals
- Returns significant trends (slope > 100)

**`detectAnomalyPatterns(userId, transactions)`**
- Statistical outlier detection (>2 sigma)
- Spending spike detection
- Returns unusual behavior patterns

#### Pattern Storage

All patterns stored with:
- **confidence_score** (0-100): How sure we are
- **pattern_strength** (strong/moderate/weak): Overall reliability
- **predicted_next_occurrence**: When to expect next
- **active** flag: Currently valid or not

---

### 3. Lifecycle Scoring System

**File**: `api_src/longitudinal/lifecycle-scoring-system.js`

Tracks user progression through 7 financial maturity stages.

#### Lifecycle Stages

| Stage | Order | Duration | Focus | Indicators |
|-------|-------|----------|-------|-----------|
| **Discovery** | 0 | - | Learn platform | Just joined |
| **Onboarding** | 1 | 2-4 weeks | Engage features | 1+ assessment, 10+ txns |
| **Establishment** | 2 | 1-3 months | Build habits | 50+ txns, engagement 50+ |
| **Optimization** | 3 | 1-6 months | Optimize strategy | 150+ txns, savings 15%+ |
| **Acceleration** | 4 | 3-12 months | Accelerate wealth | 300+ txns, savings 25%+, investing |
| **Maturity** | 5 | 1+ years | Disciplined investor | 500+ txns, 30%+ savings, ₹5L+ net worth |
| **Planning** | 6 | 2+ years | Long-term planning | 800+ txns, 35%+ savings, retirement ready |

#### Financial Maturity Score

**Composite 0-100 score** with 5 weighted components:

```
Overall Score = (
  25% × Savings Discipline +
  20% × Investment Sophistication +
  20% × Debt Management +
  20% × Risk Awareness +
  15% × Planning Capability
)
```

**Component Scoring**:
- **Savings Discipline** (0-100): Savings rate × 2.5 (0-40% = 0-100)
- **Investment Sophistication** (0-100): 25 points per linked account
- **Debt Management** (0-100): 100 minus (debt/1M) × 100
- **Risk Awareness** (0-100): From behavioral snapshot
- **Planning** (0-100): Engagement score

#### Core Functions

**`calculateUserLifecycle(userId)`**
- Comprehensive lifecycle calculation
- Fetches all metrics, determines stage
- Calculates maturity score & velocity
- Generates recommendations
- Upserts lifecycle record

**Returns**:
```javascript
{
  success: true,
  lifecycle: { 
    current_stage: 'acceleration',
    financial_maturity_score: 72,
    progression_velocity: 'fast',
    months_on_platform: 18,
    // ... all component scores
  },
  recommendations: { goals: [...], products: [...] }
}
```

**Helper Functions**:

**`calculateAccountMetrics(userId)`**
- Assessment count, transaction count, linked accounts
- Total savings, savings rate, net worth
- Emergency fund status, debt level

**`calculateEngagementScore(userId)`**
- Days active (0-20 pts)
- Last login recency (0-20 pts)
- Profile completeness (0-30 pts)
- Features used (0-20 pts)
- Transaction recency (0-10 pts)

**`calculateBehavioralMetrics(userId)`**
- From most recent snapshot
- Payment discipline, impulse tendency, planning, stability

**`determineLifecycleStage(accountMetrics, engagementScore, behavioralMetrics)`**
- Evaluates all indicators against stage requirements
- Returns current stage + confidence score

**`calculateFinancialMaturityScore(...)`**
- Weighted combination of components
- Returns overall + component breakdown

**`determineProgressionVelocity(userId, currentStage)`**
- Calculates months between stage transitions
- Returns velocity (fast/steady/slow)

**`generateRecommendations(stage, maturityScore, accountMetrics)`**
- Stage-specific goals and product recommendations
- Priority actions for next milestone

---

### 4. API Router

**File**: `api_src/longitudinal/index.js`

18 REST endpoints for all longitudinal operations.

#### Behavior Evolution Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/longitudinal/behavior/snapshot` | GET | Get specific snapshot |
| `/api/longitudinal/behavior/snapshot/generate` | POST | Generate new snapshot |
| `/api/longitudinal/behavior/history` | GET | Get evolution history |
| `/api/longitudinal/behavior/indicators` | GET | Get behavioral indicators |

**Example Usage**:
```bash
# Get all behavior snapshots for past 12 months
GET /api/longitudinal/behavior/history?userId=123&months=12&limit=12

# Generate snapshot for this month
POST /api/longitudinal/behavior/snapshot/generate
{ "userId": "123", "snapshotDate": "2026-06-12", "periodType": "monthly" }

# Get latest behavioral indicators
GET /api/longitudinal/behavior/indicators?userId=123
```

#### Pattern Learning Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/longitudinal/patterns/detect` | POST | Detect new patterns |
| `/api/longitudinal/patterns` | GET | Get all patterns |
| `/api/longitudinal/patterns/:patternId` | GET | Get pattern details |
| `/api/longitudinal/patterns/:patternId` | PUT | Update pattern |

**Example Usage**:
```bash
# Detect all patterns
POST /api/longitudinal/patterns/detect
{ "userId": "123", "analysisMonths": 12 }

# Get recurring patterns only
GET /api/longitudinal/patterns?userId=123&type=recurring&active=true
```

#### Lifecycle Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/longitudinal/lifecycle` | GET | Get lifecycle info |
| `/api/longitudinal/lifecycle/calculate` | POST | Calculate/recalculate |
| `/api/longitudinal/lifecycle/recommendations` | GET | Get recommendations |

**Example Usage**:
```bash
# Get user's lifecycle stage
GET /api/longitudinal/lifecycle?userId=123

# Recalculate lifecycle (after new data)
POST /api/longitudinal/lifecycle/calculate
{ "userId": "123" }

# Get personalized recommendations
GET /api/longitudinal/lifecycle/recommendations?userId=123
```

#### Trend & Insight Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/longitudinal/trends` | GET | Get financial trends |
| `/api/longitudinal/anomalies` | GET | Get anomalies |
| `/api/longitudinal/anomalies/:id/acknowledge` | PUT | Mark as seen |
| `/api/longitudinal/insights` | GET | Get predictions |
| `/api/longitudinal/journal` | GET | Get journal entries |
| `/api/longitudinal/journal` | POST | Create entry |

---

### 5. Frontend Component

**File**: `src/components/LongitudinalLearningDashboard.jsx`

React component displaying all longitudinal insights to users.

#### Tabs

1. **Overview**: Key metrics, quick stats, latest insights preview
2. **Patterns**: All detected patterns with confidence, frequency, impact
3. **Trends**: Financial trends with direction, change %, projections
4. **Insights**: AI recommendations with impact level and actions
5. **Journal**: Timeline of financial milestones and achievements

#### Key Features

- **Lifecycle Stage Card**: Shows current stage, maturity score breakdown, progression velocity
- **Pattern Cards**: Displays each pattern with confidence gauge, cycle/frequency, impact
- **Trend Cards**: Shows direction (up/down), percentage change, confidence
- **Insight Cards**: Color-coded by impact level, includes recommended action
- **Journal Timeline**: Visual timeline of user's financial journey
- **Anomalies Alert**: Highlights unreviewed unusual behaviors

#### Real-time Interaction

- Pattern acknowledgment
- Anomaly marking as explained
- Insight feedback (helpful/not_helpful)
- Journal entry creation

---

## Deployment

### 1. Database Migration

Run V6 migration in Supabase:

```bash
# Using Vercel CLI
vercel env pull

# Connect to Supabase
psql postgres://[user]:[password]@db.supabase.co/postgres

# Run migration
\i migrations/V6__longitudinal_learning_system.sql
```

**Verify**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'behavior%';

-- Should show: behavior_snapshots, behavior_patterns, etc.
```

### 2. Deploy API Modules

Copy to Vercel API routes:

```bash
# Create function directory
mkdir api/longitudinal

# Copy files
cp api_src/longitudinal/* api/

# Or create wrapper in api/longitudinal/index.js
```

### 3. Configure Environment Variables

```env
# Existing - ensure these are set
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# New - optional for advanced features
PATTERN_CONFIDENCE_THRESHOLD=0.5
ANOMALY_DETECTION_ENABLED=true
PREDICTIVE_INSIGHTS_ENABLED=true
```

### 4. Deploy Frontend Component

Add to main app:

```javascript
// src/App.jsx
import LongitudinalLearningDashboard from './components/LongitudinalLearningDashboard';

// In routing
<Route path="/insights" element={<LongitudinalLearningDashboard userId={currentUser.id} />} />
```

### 5. Schedule Snapshot Generation

Create cron job (Vercel):

```javascript
// api/cron/generate-snapshots.js
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  const BehaviorEvolutionEngine = require('../../api_src/longitudinal/behavior-evolution-engine');
  const result = await BehaviorEvolutionEngine.generateSnapshotsForAllUsers('monthly');
  
  return res.status(200).json(result);
}
```

Deploy in vercel.json:

```json
{
  "crons": [{
    "path": "/api/cron/generate-snapshots",
    "schedule": "0 0 1 * *"
  }]
}
```

### 6. Schedule Pattern Detection

```javascript
// api/cron/detect-patterns.js
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const PatternLearningEngine = require('../../api_src/longitudinal/pattern-learning-engine');

  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_active', true);

  let detected = 0;
  for (const user of users) {
    const result = await PatternLearningEngine.detectAllPatterns(user.id, 12);
    if (result.success) detected += result.patternsDetected;
  }

  return res.status(200).json({ success: true, patternsDetected: detected });
}
```

Deploy:
```json
{
  "crons": [{
    "path": "/api/cron/detect-patterns",
    "schedule": "0 1 1 * *"
  }]
}
```

---

## Integration Points

### With Digital Twin Engine

```javascript
// After generating snapshot
await updateDigitalTwinFromSnapshot(userId, snapshot);

// Digital twin now has:
// - behavioral_stability (from snapshot.behavioral_stability_index)
// - health_trajectory (from snapshot.financial_health_trajectory)
// - last_behavior_analysis (timestamp)
// - metadata.latest_savings_rate, etc.
```

### With Banking Integration

```javascript
// In UPI transaction handler
await BehaviorEvolutionEngine.updateDigitalTwinFromSnapshot(userId, snapshot);

// Real-time transactions feed behavior snapshots
```

### With Assessment Engine

```javascript
// Lifecycle stage influences assessment recommendations
const lifecycle = await LifecycleScoringSystem.calculateUserLifecycle(userId);

// Show different assessments based on stage
if (lifecycle.current_stage === 'acceleration') {
  // Offer investment-focused assessments
}
```

---

## B2B Partner Integration

Partners can access longitudinal data via B2B SDK:

```javascript
// In banking-sdk.js
async getFinancialBehavior(userId) {
  const { data: lifecycle } = await supabase
    .from('user_lifecycle_stages')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: latestSnapshot } = await supabase
    .from('behavior_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  return {
    lifecycle,
    latestSnapshot,
    // ... other behavioral metrics
  };
}
```

---

## Monitoring & Optimization

### Key Metrics to Track

```javascript
{
  "snapshots_generated_daily": 0,
  "patterns_detected_total": 0,
  "avg_pattern_confidence": 0,
  "lifecycle_stage_distribution": {},
  "avg_maturity_score": 0,
  "anomalies_detected_daily": 0
}
```

### Performance Optimization

1. **Snapshot Generation**
   - Batch process users in groups of 100
   - Cache transaction data during analysis
   - Use materialized views for aggregate calculations

2. **Pattern Detection**
   - Run incrementally (weekly for new patterns)
   - Cache pattern results (valid for 30 days)
   - Use partition pruning on transaction queries

3. **Lifecycle Calculation**
   - Cache for 24 hours unless new data
   - Pre-calculate component scores separately
   - Use async calculations

### Database Indexes

```sql
-- Already created in migration, but verify:
CREATE INDEX idx_behavior_snapshots_user_date ON behavior_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_behavior_patterns_confidence ON behavior_patterns(user_id, confidence_score DESC);
CREATE INDEX idx_financial_trends_user_metric ON financial_trends(user_id, metric_name);
CREATE INDEX idx_behavior_anomalies_user_date ON behavior_anomalies(user_id, anomaly_date DESC);
```

---

## Troubleshooting

### No Patterns Detected

- **Cause**: Less than 3 transactions for group
- **Solution**: Wait for more transaction history
- **Check**: `SELECT COUNT(*) FROM financial_transactions WHERE user_id = ?`

### Low Lifecycle Scores

- **Cause**: Insufficient transaction history or recent user
- **Solution**: More data improves scores over time
- **Check**: `SELECT months_on_platform FROM user_lifecycle_stages WHERE user_id = ?`

### Snapshot Generation Failing

- **Cause**: Missing transactions or API issues
- **Solution**: Ensure banking integration is synced
- **Check**: Review migration status: `SELECT * FROM banking_sync_status`

### Pattern Confidence Too Low

- **Cause**: Inconsistent behavior or insufficient occurrences
- **Solution**: Patterns improve as more data accumulates
- **Check**: `SELECT occurrences_detected, confidence_score FROM behavior_patterns`

---

## Future Enhancements

1. **ML-Based Forecasting**
   - ARIMA models for spending forecasts
   - Neural networks for anomaly detection

2. **Comparative Analytics**
   - Benchmark user against cohort
   - Percentile rankings

3. **Goal Tracking**
   - User-defined savings/investment goals
   - Progress visualization

4. **Behavioral Recommendations**
   - Personalized nudges based on patterns
   - Habit formation suggestions

5. **Integration with Financial Advisors**
   - Share insights with robo-advisors
   - Advisor dashboard

---

## Summary

**Longitudinal Learning System** transforms ARTH.OS from a point-in-time assessment tool to a continuous behavioral learning platform.

**Impact**:
- 📈 Users see their financial journey visualized
- 🔍 Patterns reveal hidden behaviors
- 🎯 Lifecycle tracking provides milestones
- 💰 Banks/lenders get behavioral risk scoring
- 🚀 Competitive moat for ARTH.OS

**Deployment**: 1 database migration + 3 Node.js modules + 1 React component + 2 cron jobs = Complete longitudinal intelligence layer.

