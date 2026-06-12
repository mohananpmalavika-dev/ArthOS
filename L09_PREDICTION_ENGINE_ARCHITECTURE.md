# L09 Prediction Engine - Technical Architecture

**System Version:** 1.0  
**Created:** 2026-06-12  
**Language:** Node.js + React + PostgreSQL  
**Status:** Production-Ready

---

## 🏗️ System Overview

The Prediction Engine is a sophisticated financial forecasting system that:
- Generates 30, 90, and 180-day health score forecasts
- Predicts survival window duration with confidence intervals
- Simulates user scenarios with parameter modifications
- Identifies emerging risks and opportunities
- Tracks forecast accuracy for continuous model improvement

**Core Philosophy:** Make predictions based on historical patterns, not assumptions. Confidence scores decrease with longer forecast periods.

---

## 📊 Forecasting Models

### Model 1: ARIMA (AutoRegressive Integrated Moving Average)

**What it does:** Captures autoregressive patterns in historical data

**Algorithm:**
```
1. Calculate autocorrelation coefficient (ar1) from time series
2. For each forecast day i:
   - forecast[i] = ar1 * value[i-1] + (1 - ar1) * mean(historical) + trend_component
   - Add random noise proportional to historical variance
3. Return forecasts with confidence intervals
```

**When to use:** Trending data with cyclical patterns (debt reduction, savings accumulation)

**Strengths:**
- Captures momentum and trend direction
- Good with volatile data
- Statistically sound for trending sequences

**Weaknesses:**
- Assumes past patterns repeat
- Can miss structural breaks
- Requires longer history (prefer 6+ months)

**Example Output:**
```json
{
  "method": "arima",
  "forecasts": [
    { "day": 1, "value": 55.2, "ci_lower": 53.1, "ci_upper": 57.3 },
    { "day": 30, "value": 62.1, "ci_lower": 58.4, "ci_upper": 65.8 }
  ],
  "rmse": 2.3,
  "ar1_coefficient": 0.78
}
```

---

### Model 2: Exponential Smoothing (Holt-Winters)

**What it does:** Smooths level and trend components separately

**Algorithm:**
```
Parameters: alpha = 0.3 (level smoothing), beta = 0.1 (trend smoothing)

For each value in history:
  1. level[t] = alpha * value[t] + (1 - alpha) * (level[t-1] + trend[t-1])
  2. trend[t] = beta * (level[t] - level[t-1]) + (1 - beta) * trend[t-1]

For forecast day i:
  forecast[i] = level[T] + (i * trend[T])
  where T = last historical period
```

**When to use:** Data with clear, consistent trends (improving behavior scores)

**Strengths:**
- Separates trend from noise
- Adapts to recent changes quickly (alpha=0.3)
- Good for smooth trends

**Weaknesses:**
- Cannot handle sudden breaks
- Assumes constant trend
- Less sensitive to recent spikes

**Example Output:**
```json
{
  "method": "exponential_smoothing",
  "final_level": 58.4,
  "final_trend": 0.52,
  "forecasts": [
    { "day": 1, "value": 58.9, "ci_lower": 57.2, "ci_upper": 60.6 },
    { "day": 30, "value": 74.0, "ci_lower": 70.1, "ci_upper": 77.9 }
  ]
}
```

---

### Model 3: Linear Trend

**What it does:** Simple least-squares regression on time indices

**Algorithm:**
```
1. Fit linear model: value = slope * time_index + intercept
2. Using Ordinary Least Squares (OLS):
   - slope = Σ((t - mean_t) * (v - mean_v)) / Σ((t - mean_t)²)
   - intercept = mean_v - slope * mean_t

3. For forecast day i:
   forecast[i] = slope * (current_day + i) + intercept
```

**When to use:** Linear patterns without volatility (predictable income)

**Strengths:**
- Simplest model
- Interpretable (easy to explain to users)
- Good for educational purposes

**Weaknesses:**
- Ignores cyclical patterns
- Can extrapolate unrealistically
- Assumes constant rate of change

**Example Output:**
```json
{
  "method": "linear_trend",
  "slope": 0.32,
  "intercept": 42.1,
  "r_squared": 0.71,
  "forecasts": [
    { "day": 1, "value": 42.42 },
    { "day": 30, "value": 51.7 }
  ]
}
```

---

### Model 4: Ensemble (Production Default)

**What it does:** Combines all three models with weighted voting

**Algorithm:**
```
Weights:
- ARIMA: 50% (captures complex patterns)
- Exponential Smoothing: 30% (captures trends)
- Linear Trend: 20% (provides stability)

For each day i:
  forecast[i] = 0.5 * arima[i] 
              + 0.3 * exp_smooth[i] 
              + 0.2 * linear[i]

Confidence = 100 - CV (coefficient of variation across models)
  - If all models agree: confidence ≈ 95%
  - If models diverge: confidence ≈ 60%
```

**Why Ensemble?**
- No single model is best for all patterns
- Ensemble reduces overfitting risk
- More robust to model assumptions
- Confidence score reflects model agreement

**Example Output:**
```json
{
  "method": "ensemble",
  "confidence": 87.3,
  "forecasts": [
    {
      "day": 1,
      "value": 56.8,
      "ci_lower": 54.2,
      "ci_upper": 59.4,
      "component_arima": 57.1,
      "component_exp_smooth": 56.4,
      "component_linear": 56.8
    }
  ],
  "model_agreement": 0.89
}
```

---

## 📈 Confidence Intervals

**Method:** 95% Confidence Interval using empirical variance

```
For each model:
  - Calculate residuals (actual - predicted) from training data
  - Compute standard deviation of residuals
  - CI = prediction ± (1.96 * std_dev)
  
Ensemble CI:
  - Aggregate CIs from all models
  - Use weighted average of standard deviations
  - Report as min (conservative) and max (optimistic)
```

**Interpretation:**
- Green zone (min to predicted): Conservative estimate, likely to achieve
- Orange zone (predicted to max): Optimistic estimate, possible but less likely
- Width increases with forecast period (more uncertainty)

**Example:**
```
30-day forecast:  Health Score 62.1 ± 3.7 (58.4 to 65.8)  confidence: 92%
90-day forecast:  Health Score 78.3 ± 8.2 (70.1 to 86.5)  confidence: 81%
180-day forecast: Health Score 94.6 ± 15.4 (79.2 to 109.9) confidence: 68%
```

---

## 🎯 Scenario Simulation

**Purpose:** Test "what if" parameter changes without actually making them

**How it works:**

```
1. USER SPECIFIES CHANGE:
   - Parameter: "monthly_spending"
   - Change type: "absolute"
   - Change value: -5000 (reduce by ₹5,000/month)
   - Period: 90 days

2. SYSTEM CALCULATES BASELINE:
   - Current trajectory forecast
   - 30/90/180 day health scores
   - Survival window

3. SYSTEM APPLIES CHANGE:
   - Modify historical data with parameter change
   - Run forecast with modified data
   - Calculate new trajectory

4. COMPARE & REPORT:
   - Health score delta: new - baseline
   - Survival days delta: new - baseline
   - Feasibility score: how realistic?
   - Time to benefit: when does impact show?

5. STORE FOR TRACKING:
   - Mark as "simulated"
   - User can later mark as "adopted" or "abandoned"
   - Track actual vs predicted impact over time
```

**Example Scenario:**

```json
{
  "id": "scenario-001",
  "scenarioName": "Save ₹5,000 extra per month",
  "modifiedParameter": "monthly_spending",
  "parameterChangeValue": -5000,
  "comparisonPeriodDays": 90,
  
  "baselineHealthScoreAtEnd": 72.4,
  "scenarioHealthScoreAtEnd": 81.6,
  "healthScoreDelta": 9.2,
  
  "baselineSurvivalDaysAtEnd": 245,
  "scenarioSurvivalDaysAtEnd": 412,
  "survivalDaysDelta": 167,
  
  "totalAmountSavedInPeriod": 15000,
  "emergencyFundGrowth": 12000,
  
  "feasibilityScore": 78.5,
  "impactMagnitude": "high",
  "timeToSeeBenefitDays": 21,
  
  "scenarioStatus": "simulated"
}
```

---

## ⚠️ Risk Forecasting

**Risk Categories:**

| Category | Trigger | Days Until | Example |
|----------|---------|-----------|---------|
| **Critical** | Survival window < 30 days | 1-30 | Emergency fund depleted |
| **High** | Health score drops > 5 points | 30-60 | Income drops 20% |
| **Medium** | Behavior score declines | 60-120 | Spending pattern changes |
| **Low** | Awareness score drops | 120+ | Minor deviation patterns |

**Risk Identification Algorithm:**

```
For each forecasted period:
  1. Compare predicted values to thresholds
  2. Calculate rate of change
  3. Identify crossing points (when threshold violated)
  4. Assess contributing factors:
     - Spending spike
     - Income drop
     - Debt increase
     - Savings depletion
  5. Generate mitigation strategies
  6. Assign effort level (low/medium/high)
  
Store risk with:
  - Category (critical/high/medium/low)
  - Days until onset
  - Suggested action
  - Effort required
```

**Example Risk Output:**

```json
{
  "id": "risk-001",
  "riskType": "emergency_fund_depletion",
  "riskCategory": "critical",
  "riskDescription": "Emergency fund will be depleted in 28 days at current spending rate",
  "predictedOnsetDate": "2026-07-10",
  "daysUntilRisk": 28,
  "projectedImpact": -100,
  "impactArea": "survival_window",
  "primaryDriver": "Unexpected medical expenses ₹35,000",
  "suggestedMitigation": "Reduce discretionary spending by 30% OR accelerate income growth",
  "effortRequired": "high"
}
```

---

## 💡 Opportunity Forecasting

**Opportunity Categories:**

| Category | Trigger | Example |
|----------|---------|---------|
| **High** | Behavior improvement trajectory | 3+ months of improving scores |
| **Medium** | Behavior stable + capacity exists | Savings rate enables debt payoff |
| **Low** | Incremental improvement possible | Small adjustment could help |

**Algorithm:**

```
For each forecasted period:
  1. Identify positive trends
  2. Check for acceleration windows
  3. Calculate projected benefits
  4. Assess effort/reward ratio
  5. Suggest specific actions
  
Score opportunities by:
  - Potential benefit magnitude
  - Effort required
  - Timeline to benefit
  - User capacity (time, money, skill)
```

**Example Opportunity:**

```json
{
  "id": "opp-001",
  "opportunityType": "debt_elimination",
  "opportunityCategory": "high",
  "opportunityDescription": "Can eliminate personal loan (₹50,000) in 6 months with adjusted spending",
  "predictedAvailableDate": "2026-12-12",
  "daysUntilOpportunity": 184,
  "projectedBenefit": 42.3,
  "benefitArea": "health_score",
  "primaryEnabler": "Improved spending discipline over past 90 days",
  "suggestedAction": "Allocate ₹10,000/month to loan payoff",
  "effortRequired": "medium",
  "timeToSeeBenefitDays": 60
}
```

---

## 🗄️ Database Schema

### financial_forecasts table

```sql
-- Core forecasting table
Columns:
  id (UUID) - Unique forecast ID
  user_id (UUID) - User this forecast is for
  forecast_generated_date (TIMESTAMP) - When was this generated?
  forecast_period_days (INT) - 30, 90, or 180 days
  
  -- Predicted values
  predicted_health_score (DECIMAL) - Main metric
  predicted_health_score_min/max - Conservative/optimistic bounds
  health_score_trend (VARCHAR) - 'improving', 'declining', 'stable'
  
  -- BAS Components
  predicted_behaviour_score (DECIMAL)
  predicted_awareness_score (DECIMAL)
  predicted_stability_score (DECIMAL)
  
  -- Survival window
  predicted_survival_days (INT) - Days until financial crisis
  
  -- Model metadata
  forecast_method (VARCHAR) - 'arima', 'exponential_smoothing', 'linear_trend', 'ensemble'
  confidence_level (DECIMAL) - 0-100 confidence score
  rmse (DECIMAL) - Model error metric
  mape (DECIMAL) - Percentage error metric

Index: (user_id, forecast_period_days, confidence_level)
RLS: SELECT ONLY if auth.uid() = user_id
```

### scenario_simulations table

```sql
-- Stores all scenarios the user tested
Columns:
  id (UUID)
  user_id (UUID)
  scenario_name (VARCHAR) - User-friendly name
  scenario_description (TEXT)
  
  -- Parameter change
  modified_parameter (VARCHAR) - What was changed?
  parameter_change_type (VARCHAR) - 'absolute' or 'percentage'
  parameter_change_value (DECIMAL) - How much?
  
  -- Comparison results
  baseline_health_score_at_end (DECIMAL)
  scenario_health_score_at_end (DECIMAL)
  health_score_delta (DECIMAL)
  
  baseline_survival_days_at_end (INT)
  scenario_survival_days_at_end (INT)
  survival_days_delta (INT)
  
  -- Impact assessment
  feasibility_score (DECIMAL)
  impact_magnitude (VARCHAR) - 'low', 'medium', 'high'
  time_to_see_benefit_days (INT)
  
  -- User action tracking
  scenario_status (VARCHAR) - 'simulated', 'adopted', 'completed', 'abandoned'
  adoption_date (TIMESTAMP) - When did user start this?

Index: (user_id, scenario_status), (user_id, impact_magnitude)
RLS: SELECT, INSERT WITH CHECK, UPDATE if auth.uid() = user_id
```

### risk_forecasts table

```sql
-- All identified risks
Columns:
  id (UUID)
  user_id (UUID)
  
  risk_type (VARCHAR) - 'emergency_fund_depletion', 'income_decline', etc.
  risk_category (VARCHAR) - 'critical', 'high', 'medium', 'low'
  risk_description (TEXT)
  
  predicted_onset_date (DATE) - When will risk manifest?
  days_until_risk (INT) - How many days away?
  
  impact_area (VARCHAR) - What does it impact?
  projected_impact (DECIMAL) - How much impact?
  
  contributing_factors (TEXT[]) - Array of factors
  primary_driver (VARCHAR) - Main cause
  
  suggested_mitigation (TEXT) - What to do
  effort_required (VARCHAR) - 'low', 'medium', 'high'
  
  user_acknowledged (BOOLEAN) - Did user see this?
  action_taken (BOOLEAN) - Did they act?

Index: (user_id, risk_category, days_until_risk)
RLS: SELECT if auth.uid() = user_id
```

### opportunity_forecasts table

```sql
-- All identified opportunities
Columns:
  id (UUID)
  user_id (UUID)
  
  opportunity_type (VARCHAR)
  opportunity_category (VARCHAR) - 'high', 'medium', 'low'
  opportunity_description (TEXT)
  
  predicted_available_date (DATE)
  days_until_opportunity (INT)
  
  benefit_area (VARCHAR)
  projected_benefit (DECIMAL)
  
  contributing_factors (TEXT[])
  primary_enabler (VARCHAR)
  
  suggested_action (TEXT)
  effort_required (VARCHAR)
  
  user_interested (BOOLEAN)
  action_taken (BOOLEAN)

Index: (user_id, opportunity_category, days_until_opportunity)
RLS: SELECT if auth.uid() = user_id
```

### forecast_accuracy_log table

```sql
-- Tracks forecast accuracy over time
Columns:
  id (UUID)
  user_id (UUID)
  forecast_id (UUID) - Links to original forecast
  
  forecast_date (DATE) - When was prediction made?
  original_forecast_value (DECIMAL) - What was predicted?
  original_confidence (DECIMAL)
  
  measurement_date (DATE) - When measured actual?
  actual_value (DECIMAL) - What really happened?
  metric_type (VARCHAR) - 'health_score', 'survival_days', etc.
  
  absolute_error (DECIMAL) - |predicted - actual|
  percentage_error (DECIMAL) - ((actual - predicted) / actual) * 100
  
  was_accurate (BOOLEAN) - Within 10% margin?
  forecast_method (VARCHAR) - Which model?

Index: (user_id, measurement_date), (user_id, forecast_method, percentage_error)
RLS: SELECT if auth.uid() = user_id
```

---

## 🔌 API Endpoints

### Generate Forecasts
```
POST /api/prediction/forecasts
Content-Type: application/json

Request:
{
  "userId": "user-uuid"
}

Response (201 Created):
{
  "success": true,
  "forecasts": [
    {
      "forecast_period_days": 30,
      "predicted_health_score": 62.1,
      "confidence_level": 92.3,
      "...": "..."
    }
  ],
  "generatedAt": "2026-06-12T10:30:00Z"
}
```

### List Scenarios
```
GET /api/prediction/scenarios?userId=user-uuid

Response (200 OK):
{
  "success": true,
  "scenarios": [...],
  "count": 5
}
```

### Create Scenario
```
POST /api/prediction/scenarios
{
  "userId": "user-uuid",
  "scenarioName": "Save ₹5,000/month",
  "modifiedParameter": "monthly_spending",
  "parameterChangeType": "absolute",
  "parameterChangeValue": -5000,
  "comparisonPeriodDays": 90
}

Response (201 Created):
{
  "success": true,
  "scenario": {
    "id": "scenario-001",
    "healthScoreDelta": 9.2,
    "survivalDaysDelta": 167
  }
}
```

**Full endpoint reference:** See PREDICTION_ENGINE_DEPLOYMENT.md

---

## 🧪 Testing Scenarios

### Scenario 1: No Historical Data
- **Setup:** New user with no financial history
- **Expected:** API returns error "Insufficient historical data (need 3+ data points)"
- **Fix:** User must complete 3+ assessments first

### Scenario 2: Trending Data
- **Setup:** User with 6+ months of improving health scores
- **Expected:** ARIMA model dominates (50%), forecasts show improvement
- **Verify:** confidence_level > 85%

### Scenario 3: Stable Data
- **Setup:** User with flat health scores (no trend)
- **Expected:** Linear model dominates (20%), Exp Smooth underweights
- **Verify:** Model agreement > 0.75

### Scenario 4: Volatile Data
- **Setup:** User with erratic behavior (spikes up and down)
- **Expected:** Ensemble model balances predictions
- **Verify:** confidence_level 65-75% (reflects uncertainty)

### Scenario 5: Scenario Adoption
- **Setup:** User creates "Save ₹5,000/month" scenario, then marks as "adopted"
- **Expected:** Can later mark as "completed" with actual results
- **Verify:** Accuracy log captures forecast vs actual delta

---

## 📉 Historical Data Requirements

| Model | Min Data | Recommended | Optimal |
|-------|----------|-------------|---------|
| ARIMA | 3 points | 6+ months | 12+ months |
| Exp Smooth | 3 points | 6 months | 12+ months |
| Linear | 2 points | 3 months | 6+ months |
| Ensemble | 3 points | 6+ months | 12+ months |

**Data Collection:**
- Assessment completion dates
- Financial transactions aggregated by month
- Income/expense records
- Debt levels over time
- Savings progression

---

## 🎓 User Education

### How to Interpret Confidence Scores
- **90-100%:** Very confident, models agree strongly → Trust this forecast
- **80-89%:** Confident, models agree well → Generally reliable
- **70-79%:** Moderately confident, some model variance → Watch for changes
- **Below 70%:** Low confidence, models diverge → Needs more data

### How to Read Confidence Intervals
- **Min (Conservative):** What you'll likely achieve if things go well
- **Predicted (Middle):** Most probable outcome
- **Max (Optimistic):** What's possible if everything goes perfectly

### Scenario Best Practices
- Test one parameter at a time (easier to interpret results)
- Compare scenarios to see which creates biggest impact
- Adopt scenarios incrementally (don't change everything at once)
- Review results 30/90 days later to measure accuracy

---

## 🚀 Performance Optimization

- **Forecast caching:** Cache for 24 hours (regenerate daily)
- **Batch processing:** Simulate scenarios during off-peak hours
- **Index strategy:** (user_id, period) for fast retrieval
- **Archive old data:** Move accuracy logs > 12 months to cold storage
- **Parallel model execution:** Run all 3 models simultaneously

---

**Document Status:** Complete  
**Last Updated:** 2026-06-12  
**Next Review:** After first 100 users complete forecasting
