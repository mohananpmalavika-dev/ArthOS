# L09 Prediction Engine - Quick Reference Guide

**For:** Developers, DevOps, QA  
**Time to Read:** 5 minutes  
**Purpose:** Know what exists, where it is, and how it works

---

## 🗂️ File Inventory

### Backend Forecasting Engine

**File:** `api_src/longitudinal/prediction-engine.js` (800 lines)

**What:** Core forecasting logic with all mathematical models

**Key Methods:**
```javascript
// Main entry point
PredictionEngine.generateFinancialForecast(userId)
  → Runs all 4 models, returns ensemble forecast with 30/90/180 days

// Individual models
PredictionEngine.arimaForecast(timeSeries, forecastDays)
  → AR(1) autoregressive model, 50% weight in ensemble

PredictionEngine.exponentialSmoothingForecast(timeSeries, forecastDays)
  → Holt-Winters smoothing, 30% weight in ensemble

PredictionEngine.linearTrendForecast(timeSeries, forecastDays)
  → OLS regression on time, 20% weight in ensemble

PredictionEngine.ensembleForecasts(forecasts)
  → Weighted average: 50% ARIMA + 30% Exp + 20% Linear

// Simulation & Analysis
PredictionEngine.simulateScenario(userId, scenario)
  → Compares baseline vs modified parameter forecast

PredictionEngine.identifyRisksFromForecasts(userId, forecasts)
  → Detects critical/high/medium/low risks

PredictionEngine.identifyOpportunitiesFromForecasts(userId, forecasts)
  → Detects improvement opportunities

PredictionEngine.gatherHistoricalData(userId)
  → 180-day lookback on assessments and transactions
```

**Dependencies:**
- `@supabase/supabase-js` (database)
- Node.js (async/await)

**Testing:**
```javascript
// Get all methods
const methods = Object.getOwnPropertyNames(PredictionEngine)
  .filter(name => typeof PredictionEngine[name] === 'function')
console.log(methods) // Shows all available methods
```

---

### REST API Handler

**File:** `api_src/longitudinal/prediction-engine-handler.js` (300+ lines)

**What:** Vercel serverless handler for 12 REST endpoints

**Pattern:** All endpoints follow same validation → database → response pattern

**Example Endpoint:**
```javascript
// POST /api/prediction/forecasts
// Validates userId → calls PredictionEngine.generateFinancialForecast()
// → stores in database → returns 201 Created

if (pathname === '/api/prediction/forecasts' && req.method === 'POST') {
  const result = await PredictionEngine.generateFinancialForecast(userId);
  return res.status(201).json({ success: true, ...result });
}
```

**All 12 Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/prediction/forecasts` | Generate new forecast |
| GET | `/api/prediction/forecasts` | List all forecasts |
| GET | `/api/prediction/forecasts/:period` | Get 30/90/180 day forecast |
| POST | `/api/prediction/scenarios` | Create what-if scenario |
| GET | `/api/prediction/scenarios` | List scenarios |
| PUT | `/api/prediction/scenarios/:id` | Update scenario status |
| GET | `/api/prediction/risks` | List identified risks |
| POST | `/api/prediction/risks` | Mark risk acknowledged |
| GET | `/api/prediction/opportunities` | List opportunities |
| POST | `/api/prediction/opportunities` | Mark opportunity interested |
| GET | `/api/prediction/summary` | Comprehensive dashboard |
| GET | `/api/prediction/accuracy` | Forecast accuracy metrics |
| GET | `/api/prediction/health` | Service health check |

**Error Handling:**
- All endpoints return `{ success: false, error: "message" }` on error
- Status codes: 201 (create), 200 (ok), 400 (bad request), 404 (not found), 500 (error)

**Dependencies:**
- `PredictionEngine` (the forecasting logic)
- `@supabase/supabase-js` (database)
- Vercel runtime

---

### API Router Integration

**File:** `api/index.js` (lines 20-21, ~100 lines)

**What:** Routes all `/api/prediction/*` requests to the handler

**Added Lines:**
```javascript
// Line 20 - Import
import predictionEngineHandler from '../api_src/longitudinal/prediction-engine-handler.js';

// Line 43 (in routeDefinitions array)
{ match: (pathname) => pathname.startsWith('/api/prediction'), handler: predictionEngineHandler },
```

**How It Works:**
```
1. Request comes to /api/prediction/forecasts
2. Router checks all route definitions
3. Finds matching pattern: pathname.startsWith('/api/prediction')
4. Routes to predictionEngineHandler
5. Handler processes and responds
```

**Testing:**
```bash
# These all hit the prediction engine handler now:
curl http://localhost/api/prediction/health
curl http://localhost/api/prediction/forecasts?userId=test
curl -X POST http://localhost/api/prediction/forecasts -d '{"userId":"test"}'
```

---

### React Dashboard Component

**File:** `src/components/PredictionEngineDashboard.jsx` (400+ lines)

**What:** React component for visualizing forecasts and managing scenarios

**Component Props:**
```jsx
<PredictionEngineDashboard userId={userId} />
```

**Features:**
- 📊 Forecast charts (30/90/180 days)
- 🎯 Scenario simulator ("what if" testing)
- ⚠️ Risk alerts with severity colors
- 💡 Opportunity cards
- 📈 Accuracy metrics

**Internal Tabs:**
1. **Forecasts Tab** - View predictions with confidence intervals
2. **Scenarios Tab** - Create and test scenarios
3. **Risks Tab** - See identified risks with mitigation suggestions
4. **Opportunities Tab** - Capture identified opportunities

**API Calls Made:**
```javascript
// On mount:
GET /api/prediction/forecasts           // Load forecasts
GET /api/prediction/scenarios           // Load scenarios
GET /api/prediction/risks               // Load risks
GET /api/prediction/opportunities       // Load opportunities

// User actions:
POST /api/prediction/forecasts          // Generate new forecast
POST /api/prediction/scenarios          // Create scenario
POST /api/prediction/risks              // Acknowledge risk
POST /api/prediction/opportunities      // Mark interested
```

**Dependencies:**
- React 18+
- Recharts (charting)
- Lucide React (icons)
- Tailwind CSS (styling)

**Usage:**
```jsx
import PredictionEngineDashboard from './components/PredictionEngineDashboard';

export default function Dashboard() {
  return (
    <PredictionEngineDashboard userId={currentUser.id} />
  );
}
```

---

### Database Migrations

**File:** `migrations/V9__prediction_engine_system.sql` (350 lines)

**What:** Creates 5 tables + RLS policies + triggers + indexes

**Tables Created:**
1. `financial_forecasts` - Predictions (30/90/180 days)
2. `scenario_simulations` - What-if scenarios with results
3. `risk_forecasts` - Identified risks
4. `opportunity_forecasts` - Identified opportunities
5. `forecast_accuracy_log` - Model accuracy tracking

**Key Features:**
- Row-Level Security (RLS) - Users see only their data
- Foreign keys to `auth.users`
- JSONB columns for complex data
- 15+ indexes for fast queries
- Timestamp triggers (auto-update `updated_at`)

**Deployment:**
```sql
-- Copy entire file contents
-- Paste into Supabase SQL Editor
-- Execute
-- Verify 5 tables created
```

**Verification Query:**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN (
  'financial_forecasts', 'scenario_simulations', 
  'risk_forecasts', 'opportunity_forecasts', 
  'forecast_accuracy_log'
);
-- Should return 5 rows
```

---

### Documentation Files

**File:** `PREDICTION_ENGINE_DEPLOYMENT.md` (200 lines)
- How to deploy all components
- Step-by-step instructions for Supabase
- Environment variable setup
- Post-deployment validation
- Troubleshooting guide

**File:** `L09_PREDICTION_ENGINE_ARCHITECTURE.md` (400+ lines)
- How forecasting models work
- Algorithm explanations with examples
- Database schema deep dive
- API endpoint reference
- Testing scenarios
- Performance optimization

**File:** `L09_IMPLEMENTATION_STATUS.md` (300 lines)
- What's been completed
- What's pending
- Deployment checklist
- File inventory
- Next steps

---

## 🚀 Quick Start for Developers

### I need to...

**Understand how forecasting works**
→ Read `L09_PREDICTION_ENGINE_ARCHITECTURE.md` - Forecasting Models section

**Add a new forecast metric**
→ Edit `api_src/longitudinal/prediction-engine.js` + add API endpoint in handler

**Fix a bug in the UI**
→ Edit `src/components/PredictionEngineDashboard.jsx`

**Add a new API endpoint**
→ Add handler in `prediction-engine-handler.js` + add route in `api/index.js`

**Test the API locally**
→ Use curl with `?userId=test-id` parameter

**Check database schema**
→ Run migration file contents in Supabase SQL Editor

**Understand the data flow**
→ See "System Overview" diagram below

---

## 📊 Data Flow Diagram

```
User Activity
    ↓
Assessment Data
    ↓
gatherHistoricalData() [prediction-engine.js]
    ↓ (180-day historical data)
    ├─→ arimaForecast() [50% weight]
    ├─→ exponentialSmoothingForecast() [30% weight]
    ├─→ linearTrendForecast() [20% weight]
    ↓
ensembleForecasts() [weighted average]
    ↓
generateFinancialForecast() [main method]
    ├─→ POST /api/prediction/forecasts [handler]
    ├─→ Stores in financial_forecasts table
    ├─→ identifyRisksFromForecasts()
    │   ↓ Stores in risk_forecasts table
    ├─→ identifyOpportunitiesFromForecasts()
    │   ↓ Stores in opportunity_forecasts table
    ↓
React Component [PredictionEngineDashboard.jsx]
    ├─→ Displays forecasts with confidence
    ├─→ Shows risks with alerts
    ├─→ Lists opportunities
    ├─→ Scenario simulator
    ↓
User sees predictions + can take action
```

---

## 🧪 Testing Checklist

### Unit Tests (Per Model)
- [ ] ARIMA model with trending data
- [ ] Exponential Smoothing with stable data
- [ ] Linear Trend with simple slope
- [ ] Ensemble averaging

### Integration Tests
- [ ] API endpoint returns 200 for valid userId
- [ ] API endpoint returns 400 for missing userId
- [ ] Database stores forecast correctly
- [ ] React component loads data

### End-to-End Tests
- [ ] Generate forecast → See in dashboard
- [ ] Create scenario → See comparison results
- [ ] Identify risk → See in risk list
- [ ] Find opportunity → See in opportunity list

### Performance Tests
- [ ] Forecast generation < 5 seconds
- [ ] API response < 1 second
- [ ] Dashboard loads < 2 seconds

---

## 🔧 Common Tasks

### Deploy Changes
```bash
# Local testing first
npm install
npm run dev

# Then deploy
vercel deploy --prod
```

### Update Forecast Algorithm
```javascript
// In api_src/longitudinal/prediction-engine.js
static async arimaForecast(timeSeries, forecastDays) {
  // Change algorithm here
}

// Test:
PredictionEngine.arimaForecast([10, 12, 15, 18, 22], 5)
```

### Add New Risk Category
```javascript
// In api_src/longitudinal/prediction-engine.js
identifyRisksFromForecasts() {
  // Add new risk type logic
  // Make sure to insert into risk_forecasts table
}
```

### Monitor in Production
```bash
# Check Vercel logs
vercel logs --prod

# Check Supabase database
# https://app.supabase.com/project/[ID]/editor/

# Monitor API performance
# Check response times in Vercel Analytics
```

---

## 📞 Who to Contact

**Forecasting Algorithm Questions**
→ Architecture documentation + code comments

**Database Issues**
→ Supabase support + check migrations/V9 file

**API Endpoint Problems**
→ Check prediction-engine-handler.js

**React Component Issues**
→ Check PredictionEngineDashboard.jsx

**Deployment Help**
→ PREDICTION_ENGINE_DEPLOYMENT.md

---

## 🎓 Key Concepts

**Confidence Score:** 0-100, reflects how well models agree
- 90+: Very confident, models agree strongly
- 70-89: Moderately confident, some variance
- <70: Low confidence, models diverge

**Survival Days:** Days until "financial crisis" (emergency fund depleted)
- Predicted: Most likely value
- Min: Conservative (assuming worst case)
- Max: Optimistic (assuming best case)

**BAS Score:** Behaviour, Awareness, Stability composite
- Behaviour (0-40): Financial decision quality
- Awareness (0-30): Understanding of finances
- Stability (0-30): Consistency over time

**Scenario Delta:** Difference between baseline and modified forecast
- Health Score Delta: Points gained/lost
- Survival Days Delta: Days gained/lost
- Feasibility Score: How realistic is this scenario?

---

## ✅ Status Summary

| Item | Status | Location |
|------|--------|----------|
| Forecasting Engine | ✅ Ready | `api_src/longitudinal/prediction-engine.js` |
| API Handler | ✅ Ready | `api_src/longitudinal/prediction-engine-handler.js` |
| Router Integration | ✅ Ready | `api/index.js` (2 lines) |
| React Component | ✅ Ready | `src/components/PredictionEngineDashboard.jsx` |
| Database Schema | ✅ Ready | `migrations/V9__prediction_engine_system.sql` |
| Deployment Guide | ✅ Ready | `PREDICTION_ENGINE_DEPLOYMENT.md` |
| Architecture Docs | ✅ Ready | `L09_PREDICTION_ENGINE_ARCHITECTURE.md` |
| Environment Setup | ⏳ Pending | `.env.local` - Add OPENAI_API_KEY |
| Database Deploy | ⏳ Pending | Supabase - Run V7, V8, V9 |
| npm Install | ⏳ Pending | `npm install openai` |
| Vercel Deploy | ⏳ Pending | `vercel deploy --prod` |

---

**Last Updated:** 2026-06-12  
**Version:** 1.0  
**Status:** Ready for Production Deployment
