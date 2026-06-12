# L09 Prediction Engine - Deployment Guide

**Status:** Ready for Production  
**Created:** 2026-06-12  
**Components:** 5 Database Tables + API Handler + React UI

---

## 📋 Pre-Deployment Checklist

- [x] Database migrations created (V7, V8, V9)
- [x] Forecasting engine implemented (ARIMA, Exponential Smoothing, Linear Trend, Ensemble)
- [x] API handler with 12 endpoints created
- [x] React dashboard component created
- [x] API router updated to include prediction endpoints
- [ ] Database migrations deployed to Supabase
- [ ] npm packages installed (openai)
- [ ] Environment variables configured
- [ ] Integration tests passed
- [ ] Frontend components integrated into main UI

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Migrations (MUST BE IN ORDER)

The prediction engine requires three database migrations deployed in strict order:

#### V7: Cognition Graph System (Foundation)
**Purpose:** Stores beliefs, biases, decisions, and cognition data  
**Tables:** 8 (money_beliefs, cognitive_biases, financial_decisions, etc.)  
**Dependencies:** None (PostgreSQL auth.users)

1. Open Supabase SQL Editor: https://app.supabase.com/project/[YOUR-PROJECT-ID]/sql/new
2. Copy the entire contents of `migrations/V7__cognition_graph_system.sql`
3. Execute the migration
4. Verify all 8 tables are created:
   - `money_beliefs`
   - `cognitive_biases`
   - `risk_perception_profiles`
   - `financial_emotional_triggers`
   - `financial_decisions`
   - `decision_outcomes`
   - `belief_evolution_timeline`
   - `cognition_graph_cache`

**Expected Output:** "CREATE TABLE" messages for all 8 tables with indexes

---

#### V8: AI Coach System (Depends on V7)
**Purpose:** Stores conversational coaching, memory, and recommendations  
**Tables:** 5 (coach_conversations, coach_memory_profiles, etc.)  
**Dependencies:** V7 tables (money_beliefs, cognitive_biases, financial_decisions)

1. Copy the entire contents of `migrations/V8__ai_coach_system.sql`
2. Execute the migration
3. Verify all 5 tables are created:
   - `coach_conversations`
   - `coach_session_context`
   - `coach_recommendations`
   - `coach_memory_profiles`
   - `coach_performance_metrics`

**Key Fix Applied:** `update_timestamp()` function moved to top of file (must precede triggers)

**Expected Output:** "CREATE TABLE" messages for all 5 tables with RLS policies

---

#### V9: Prediction Engine System (Depends on V7/V8 - Optional)
**Purpose:** Stores forecasts, scenarios, risks, and opportunities  
**Tables:** 5 (financial_forecasts, scenario_simulations, risk_forecasts, etc.)  
**Dependencies:** None (can deploy independently, but same architecture as V7/V8)

1. Copy the entire contents of `migrations/V9__prediction_engine_system.sql`
2. Execute the migration
3. Verify all 5 tables are created:
   - `financial_forecasts` (30/90/180 day predictions)
   - `scenario_simulations` (what-if parameter testing)
   - `risk_forecasts` (identified risks with mitigation)
   - `opportunity_forecasts` (identified opportunities with actions)
   - `forecast_accuracy_log` (tracking model accuracy)

**Expected Output:** "CREATE TABLE" messages for all 5 tables with RLS policies and 15+ indexes

---

### Step 2: Install Required npm Packages

```bash
cd c:\ArthOS
npm install openai
```

**Why?** The AI Coach system uses OpenAI API for generating coaching messages and recommendations.

**Verify Installation:**
```bash
npm list openai
```

Should show: `openai@version`

---

### Step 3: Configure Environment Variables

Update your `.env.local` or deployment environment with:

```env
# Existing (already configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NEW (required for AI Coach)
OPENAI_API_KEY=sk-your-api-key-here
```

**How to get OpenAI API Key:**
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste into .env.local
4. Never commit this to version control

---

### Step 4: Deploy to Vercel (If Using Vercel)

```bash
# From project root
vercel deploy --prod
```

**What deploys:**
- Updated API router (api/index.js) with prediction endpoints
- PredictionEngine.js logic and models
- Prediction-engine-handler.js endpoints
- React components

**Endpoints Available After Deploy:**
- POST `/api/prediction/forecasts` - Generate new forecasts
- GET `/api/prediction/forecasts` - List all forecasts
- GET `/api/prediction/forecasts/:period` - Get specific period forecast
- POST `/api/prediction/scenarios` - Create scenario simulation
- GET `/api/prediction/scenarios` - List scenarios
- GET `/api/prediction/risks` - List identified risks
- GET `/api/prediction/opportunities` - List opportunities
- GET `/api/prediction/summary` - Comprehensive summary
- GET `/api/prediction/accuracy` - Forecast accuracy metrics
- GET `/api/prediction/health` - Service health check

---

## ✅ Post-Deployment Validation

### 1. Database Connectivity Test
```bash
curl https://your-vercel-domain.com/api/prediction/health?userId=test-user-id
```

Expected Response:
```json
{
  "success": true,
  "service": "prediction-engine",
  "status": "operational",
  "capabilities": [
    "financial_state_forecasting",
    "scenario_simulation",
    "risk_forecasting",
    "opportunity_identification",
    "forecast_accuracy_tracking"
  ]
}
```

### 2. Generate Test Forecast
```bash
curl -X POST https://your-vercel-domain.com/api/prediction/forecasts \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-uuid"}'
```

**Note:** Will fail if no historical data exists for user. That's expected - forecasting requires 3+ months of historical data.

### 3. Verify API Endpoints
```bash
# List all forecasts (should be empty initially)
curl https://your-vercel-domain.com/api/prediction/forecasts?userId=test-user-uuid

# Get risks (should be empty initially)
curl https://your-vercel-domain.com/api/prediction/risks?userId=test-user-uuid

# Get opportunities (should be empty initially)
curl https://your-vercel-domain.com/api/prediction/opportunities?userId=test-user-uuid
```

### 4. Verify Frontend Components
```bash
# In React app, import the dashboard:
import PredictionEngineDashboard from './components/PredictionEngineDashboard';

// Use in your page:
<PredictionEngineDashboard userId={currentUserId} />
```

---

## 🔧 Troubleshooting

### Error: "relation 'financial_forecasts' does not exist"
**Cause:** V9 migration was not deployed  
**Solution:** Run V9 migration in Supabase SQL Editor

### Error: "ERROR: 42883: function update_timestamp() does not exist"
**Cause:** Function defined after trigger (wrong order)  
**Solution:** Ensure V8 has `update_timestamp()` function defined at TOP of file (lines 10-17)

### Error: "ERROR: 42P01: relation 'money_beliefs' does not exist"
**Cause:** V7 was not deployed before V8  
**Solution:** Deploy V7 first, then V8, then V9 in order

### Error: "OPENAI_API_KEY not found"
**Cause:** Environment variable not set  
**Solution:** Add OPENAI_API_KEY to .env.local or Vercel environment settings

### Forecasts generate but with low confidence
**Cause:** Not enough historical data (need 3+ months)  
**Solution:** This is normal behavior. Forecasting accuracy improves as historical data accumulates

---

## 📊 Forecasting Algorithm Reference

### ARIMA (AutoRegressive)
- Uses AR(1) autocorrelation coefficient
- Formula: `forecast = ar1 * lastValue + (1 - ar1) * mean + trend * timeIndex`
- Best for: Trending data with cyclical patterns

### Exponential Smoothing (Holt-Winters)
- Parameters: alpha=0.3 (level), beta=0.1 (trend)
- Iteratively smooths level and trend components
- Best for: Data with clear trend component

### Linear Trend
- Ordinary least squares regression on time indices
- Formula: `forecast = slope * time + intercept`
- Best for: Simple linear patterns

### Ensemble
- Weighted average of all three models: 50% ARIMA, 30% Exp, 20% Linear
- Most robust and recommended
- Used in production forecasts

### Confidence Intervals
- 95% CI: ±1.96 * standard_deviation
- Confidence Score: 100 - CV (coefficient of variation)
- Decreases over longer periods (more uncertainty)

---

## 🔐 Security Notes

- ✅ All tables use Row-Level Security (RLS)
- ✅ Policies check `auth.uid() = user_id`
- ✅ API validates userId on every request
- ✅ OpenAI API key never exposed to frontend
- ✅ All endpoints require valid authentication token

---

## 📈 Performance Optimization

- 15+ indexes on all tables for fast queries
- Partitioning opportunity for large-scale deployment
- Forecast caching at 24-hour TTL
- Batch scenario simulations during off-peak hours
- Archive old accuracy logs monthly

---

## 🎯 Next Steps

1. **Integrate into User Dashboard**
   - Add `PredictionEngineDashboard` component to main app
   - Add navigation link to access predictions

2. **Set Up Automated Forecasting**
   - Create scheduled task (daily at 2 AM) to generate new forecasts
   - Archive old forecasts to historical table

3. **Implement Risk Alerts**
   - Email/SMS alerts when critical risks identified
   - In-app notifications with snooze options

4. **Monitor Model Accuracy**
   - Weekly review of forecast accuracy metrics
   - Retrain models if MAPE > 25%

5. **User Education**
   - Show how scenarios impact health score
   - Explain confidence intervals and how they work
   - Guide through adoption of beneficial scenarios

---

## 📞 Support

For issues:
1. Check Supabase logs: https://app.supabase.com/project/[YOUR-PROJECT-ID]/logs
2. Check Vercel logs: https://vercel.com/project/[YOUR-PROJECT]/deployments
3. Check browser console for frontend errors
4. Review API response payloads for validation errors

---

**Deployment Date:** [Fill in when deployed]  
**Deployed By:** [Your name]  
**Status:** ⏳ Pending Deployment
