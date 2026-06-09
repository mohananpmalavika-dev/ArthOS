# ARTH.OS — Technical Documentation v1.0

> **Product:** ARTH.OS Financial Health Assessment  
> **Codebase:** `arth-os` (React 18 + Vite)  
> **Last Updated:** June 2026  
> **Status:** Production Ready

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Core Engine: Scoring System (v2)](#4-core-engine-scoring-system-v2)
5. [Data Model & Questionnaire](#5-data-model--questionnaire)
6. [API Routes (Serverless)](#6-api-routes-serverless)
7. [Telemetry & Privacy](#7-telemetry--privacy)
8. [Database Schema](#8-database-schema)
9. [Component Architecture](#9-component-architecture)
10. [Build & Deployment](#10-build--deployment)
11. [Configuration Reference](#11-configuration-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                   │
│  React 18 SPA  │  Vite Bundler  │  localStorage       │
│  ┌───────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ App.jsx   │  │ Scoring     │  │ State Persistence│ │
│  │ Assessment│──│ Engine (v2) │  │ (wizard step,    │ │
│  │ Wizard    │  │             │  │  score history)  │ │
│  └───────────┘  └────────────┘  └──────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │ HTTPS (fetch + keepalive)
                       ▼
┌─────────────────────────────────────────────────────┐
│              VERCEL (Serverless Edge)                │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ Static Assets   │  │ API Routes (Node.js)     │  │
│  │ index.html      │  │ /api/telemetry.js        │  │
│  │ JS/CSS bundles  │  │ /api/feedback.js         │  │
│  │                 │  │ /api/saveAssessment.js    │  │
│  └─────────────────┘  └──────────┬───────────────┘  │
└──────────────────────────────────┼──────────────────┘
                                   │ Service Role Key
                                   ▼
┌─────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                   │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ anonymous_       │  │ tester_feedback           │ │
│  │ telemetry        │  │                           │ │
│  └──────────────────┘  └──────────────────────────┘ │
│  ┌──────────────────┐                               │
│  │ assessments      │                               │
│  └──────────────────┘                               │
│  RLS Policies: INSERT=public, SELECT=denied          │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. User fills multi-step wizard (Psychology → Clarity → Resilience → Habits)
2. On each change, `calculateFinancialHealthV2()` recomputes all scores
3. Results rendered in real-time in the right-side `result-stack`
4. On final step: telemetry payload built → POST to `/api/telemetry`
5. Feedback form shown → POST to `/api/feedback`
6. All backend writes use service_role key; RLS denies public reads
7. Assessment state persisted to `localStorage` with key `arth-os-assessment`

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js (Vercel Edge) | 18.x |
| Frontend Framework | React | 18.3.1 |
| Bundler | Vite | 6.0.3 |
| Styling | CSS (custom, no framework) | — |
| Icons | Lucide React | 0.468.0 |
| Database | Supabase (PostgreSQL) | — |
| DB Client | @supabase/supabase-js | 2.35.0 |
| Deployment | Vercel | — |
| State Persistence | localStorage | Browser native |

---

## 3. Project Structure

```
c:/ArthOS/
├── index.html                         # Vite entry HTML
├── package.json                       # Dependencies & scripts
├── vite.config.js                     # Vite configuration
├── vercel.json                        # Vercel deployment config
│
├── api/                               # Serverless API routes
│   ├── telemetry.js                   # POST /api/telemetry
│   ├── feedback.js                    # POST /api/feedback
│   └── saveAssessment.js              # POST /api/saveAssessment
│
├── src/
│   ├── main.jsx                       # React entry point
│   ├── App.jsx                        # Root component, all sections
│   ├── styles.css                     # Global styles (~2300 lines)
│   │
│   ├── lib/
│   │   ├── scoring-v2.js             # Core scoring engine (primary)
│   │   └── scoring.js                # Legacy v1 scoring engine
│   │
│   ├── engines/
│   │   └── behaviorCorrelation.js    # Behavioral correlation analysis
│   │
│   ├── data/
│   │   ├── questionnaire-v2.js       # v2 question bank & defaults
│   │   └── questionnaire.js          # Legacy v1 question bank
│   │
│   └── components/
│       ├── AssessmentSection.jsx      # Multi-step wizard container
│       ├── InsightNarrative.jsx       # Personalized insight display
│       ├── DecisionSimulator.jsx      # Purchase impact simulator
│       ├── FinancialTwin.jsx          # Personality archetype card
│       ├── AnalyticsDashboard.jsx     # Blind spot & risk analytics
│       ├── UserHistory.jsx            # Score progression tracker
│       └── ValidationFeedbackForm.jsx # Post-assessment feedback
│
├── SQL_SCHEMA.sql                     # Database DDL
│
└── docs/
    ├── ARTH.OS_Financial_Health_Score_Framework_v1.md
    ├── DEPLOYMENT_GUIDE.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── QUICK_START.md
    ├── COMPLETION_REPORT.md
    └── TODO.md
```

---

## 4. Core Engine: Scoring System (v2)

### 4.1 Scoring Formula

```
Health Score (0–100) = Behaviour (0–45) + Awareness (0–30) + Stability (0–25)
```

Each component is computed independently from questionnaire answers and profile data, then summed.

### 4.2 Behaviour Score (0–45)

**File:** `src/lib/scoring-v2.js` → `getBehaviourScore()`

**Inputs:** 12 categorical questions covering emotional spending, impulse control, social influence, stress spending, subscription discipline, and impulse waiting rules.

**Algorithm:**
1. Each question answer maps to a 0–10 sub-score via `behaviourScoreMaps`
2. All 12 sub-scores averaged
3. Scaled to 0–45 range: `(average / 10) × 45`
4. Rounded to 1 decimal place

**Band thresholds:**
| Score Range | Label |
|-------------|-------|
| 0–15 | Critical behaviour risk |
| 16–27 | Needs behaviour correction |
| 28–35 | Mostly controlled |
| 36–45 | Strong financial discipline |

### 4.3 Awareness Score (0–30)

**File:** `src/lib/scoring-v2.js` → `getAwarenessScore()`

**Inputs:** 8 categorical questions covering lifestyle comparison, financial planning, expense tracking, debt knowledge, savings rate awareness, budget cycle, and top-expense awareness.

**Algorithm:**
1. Each question answer maps to a 0–6 sub-score via `awarenessScoreMaps`
2. Raw total summed
3. Normalized against max possible (48): `(total / 48) × 30`
4. Clamped to 0–30, rounded

**Band thresholds:**
| Score Range | Label |
|-------------|-------|
| 0–9 | Low visibility |
| 10–18 | Basic awareness |
| 19–24 | Solid tracking |
| 25–30 | High clarity |

### 4.4 Stability Score (0–25)

**File:** `src/lib/scoring-v2.js` → `getStabilityScore()`

**Inputs:** Monthly expenses, emergency savings (fixed + discretionary split), total debt, monthly income, income stability, dependents, monthly liabilities.

**Sub-components:**
- **Emergency score:** `min(survivalMonths, 6) × 1.5`
- **Debt score:** Based on debt-to-income ratio (monthly)
- **Income stability score:** 0–6 mapped from categorical answer
- **Dependents score:** 0–3 based on dependents bucket
- **Liability pressure score:** Based on liabilities ÷ income ratio

**Formula:** Sum all sub-components → normalize: `(raw / 20) × 25` → clamp to 0–25

**Band thresholds:**
| Score Range | Label |
|-------------|-------|
| 0–8 | Fragile stability |
| 9–16 | Some cushion |
| 17–20 | Resilient |
| 21–25 | Very stable |

### 4.5 Survival Engine

**Survival Months = (FixedSavings + DiscretionarySavings) ÷ MonthlyExpenses**

**Crisis-Optimized Survival:**
Uses `CRISIS_ELASTICITY_FACTOR = 0.4` — assumes 40% of variable lifestyle costs can be frozen.
```
BareMinimumBurn = MonthlyLiabilities + VariableExpenses × (1 - 0.4)
CrisisSurvivalMonths = TotalSavings / BareMinimumBurn
```

**Awareness Gap (Blind Spot):**
```
PerceptionBias = 1 + 0.35 × (1 - AwarenessScore/30)
PerceivedSurvival = ActualSurvival × PerceptionBias
Gap = PerceivedSurvival - ActualSurvival
```

### 4.6 Personality Archetypes

**File:** `src/lib/scoring-v2.js` → `getPersonalityType()`

Trait-scoring system across 8 behavioural dimensions selects one of four archetypes:

| Archetype | Key Traits | Danger Zone |
|-----------|-----------|-------------|
| **Reactor** | Acts quickly, emotional spending | Stress periods |
| **Survivor** | Stays cautious, protects safety | Sudden income shock |
| **Planner** | Plans ahead, tracks commitments | Unexpected shocks |
| **Builder** | Disciplined, growth-focused | Burnout from rigid budgets |

### 4.7 Decision Simulator

**File:** `src/lib/scoring-v2.js` → `calculateDecisionSimulatorV2()`

Computes runway impact of a hypothetical purchase:
1. `CurrentRunway = TotalSavings / MonthlyExpenses`
2. `RemainingSavings = TotalSavings - PurchaseCost`
3. `ForecastRunway = RemainingSavings / MonthlyExpenses`
4. `RunwayDelta = CurrentRunway - ForecastRunway`
5. Risk band comparison + recommendation

### 4.8 Habits Metrics

**File:** `src/lib/scoring-v2.js` → `getHabitsMetrics()`

Two inputs:
- **Check-ins per week** (0, 1, 2–3, 4+)
- **Debt payment reliability** (rarely/sometimes/often/always)

Outputs: `habitScore` (0–100), `estimatedStreakDays`, `weeklyAdherencePct`

---

## 5. Data Model & Questionnaire

### 5.1 Assessment Shape (v2)

```javascript
{
  mode: "v2",
  behaviour: {                          // 12 categorical keys
    emotionalMoneyLevel, socialInfluenceLevel, unplannedPurchaseFreq,
    regretImpulseFreq, presentFutureMindset, avoidBalanceDuringStress,
    spendWhenBored, spendWhenStressed, plannedPurchasesOnly,
    cashflowAwareness, subscriptionControl, impulseWaitRule
  },
  awareness: {                          // 8 categorical keys
    comparesLifestyleFreq, hasFinancialPlan, tracksExpenses,
    knowsTotalDebt, knowsMonthlyExpenses, tracksSavingsRate,
    budgetCycle, knowsTop3Expenses
  },
  profile: {                            // Numeric + categorical
    monthlyExpenses, emergencySavingsFixed, emergencySavingsDiscretionary,
    totalDebt, monthlyIncome, monthlyLiabilities,
    incomeStability, dependentsBucket,
    debtRepaymentRatePctOfIncome, averageInterestRatePct
  },
  habits: {                             // 2 categorical keys
    habitCheckInsPerWeek, debtPaymentDiscipline
  },
  participant: {                        // Optional PII (not sent in telemetry)
    name, age, email
  }
}
```

### 5.2 Question Banks

Located in `src/data/questionnaire-v2.js`:

| Module | Count | Keys |
|--------|-------|------|
| `v2BehaviourQuestions` | 12 | emotionalMoneyLevel through impulseWaitRule |
| `v2AwarenessQuestions` | 8 | comparesLifestyleFreq through knowsTop3Expenses |
| `v2StabilityQuestions` | 2 | incomeStability, dependentsBucket |
| `v2HabitsQuestions` | 2 | habitCheckInsPerWeek, debtPaymentDiscipline |
| `v2ProfileQuestions` | 2 | monthlyLiabilities, monthlyIncome |

### 5.3 Answer Value Sets

All categorical answers use snake_case values. Reference the `*ScoreMaps` objects in `scoring-v2.js` for the complete enumeration.

---

## 6. API Routes (Serverless)

### 6.1 POST /api/telemetry

**File:** `api/telemetry.js`

**Purpose:** Accept anonymous financial health telemetry from completed assessments.

**Request:**
```json
{
  "telemetry_metadata": { "schema_version": "2.0.0", "mode_executed": "v2" },
  "scores": {
    "financial_health_score": 65,
    "behaviour_score": 28.5,
    "awareness_score": 18.0,
    "stability_score": 18.5,
    "habits_score": 55
  },
  "predictive_analytics": {
    "personality_type": "Planner",
    "future_risk_label": "Moderate Risk",
    "future_risk_score": 55,
    "awareness_gap_months": 1.5
  },
  "runway_metrics": {
    "nominal_survival_months": 3.2,
    "crisis_optimized_survival_months": 5.1,
    "perceived_survival_months": 4.7
  },
  "financial_ratios": {
    "savings_rate_proxied": 0.15,
    "debt_to_income_months": 0.35,
    "fixed_liability_pressure": 0.20
  },
  "lowest_performing_driver": "awareness"
}
```

**Responses:**
- `200`: `{ "status": "success", "recorded": true }`
- `400`: `{ "error": "Incomplete payload telemetry data structure" }`
- `405`: `{ "error": "Method Not Allowed" }`
- `500`: `{ "status": "deferred", "reason": "Internal Processing Queue" }`

### 6.2 POST /api/feedback

**File:** `api/feedback.js`

**Purpose:** Capture post-assessment user feedback on value drivers.

**Request:**
```json
{
  "score_context": { "health_score": 65 },
  "primary_value_driver": "survival_months",
  "user_feedback_notes": "The survival estimate was eye-opening."
}
```

**Valid `primary_value_driver` values:** `survival_months`, `recommended_action`, `awareness_gap`, `personality_archetype`

**Responses:**
- `200`: `{ "status": "success", "recorded": true }`
- `400`: `{ "error": "Incomplete feedback payload structure" }`
- `405`: `{ "error": "Method Not Allowed" }`
- `500`: `{ "status": "deferred", "reason": "Internal Processing Queue" }`

### 6.3 POST /api/saveAssessment

**File:** `api/saveAssessment.js`

**Purpose:** Persist full assessment + results (with optional PII for registered users).

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables.

**Note:** This route stores participant PII (name, email). Use only for authenticated/consented flows.

---

## 7. Telemetry & Privacy

### 7.1 Privacy Architecture

**Zero PII approach:**
- No names, emails, phone numbers
- No IP addresses or geolocation
- No precise timestamps (date-only: `YYYY-MM-DD`)
- No session identifiers or cookies
- Only numeric scores and categorical types

### 7.2 Telemetry Payload Builder

**File:** `src/lib/scoring-v2.js` → `buildAnonymousTelemetryPayload()`

Assembles a structured payload from the assessment result and core assessment data. Computes financial ratios from profile data (savings rate, debt-to-income, liability pressure).

### 7.3 Dispatch Mechanism

**File:** `src/lib/scoring-v2.js` → `dispatchAnonymousTelemetry()`

- Uses `fetch()` with `keepalive: true` to ensure transmission during navigation
- Endpoint configurable via `VITE_TELEMETRY_ENDPOINT` env var or falls back to hardcoded URL
- Fails silently — never interrupts user experience
- Console warns on failure but does not throw

### 7.4 Trigger Flow

1. User clicks "Finish & Review Score" on last wizard step
2. `AssessmentSection.handleNext()` calls `buildAnonymousTelemetryPayload(result, assessment)`
3. Dispatches via `dispatchAnonymousTelemetry(payload)`
4. `setShowFeedback(true)` — feedback form renders
5. On feedback submit → `dispatchAnonymousFeedbackEvent()` → POST to `/api/feedback`

---

## 8. Database Schema

### 8.1 Table: `anonymous_telemetry`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `schema_version` | VARCHAR(12) | Telemetry schema version |
| `mode_executed` | VARCHAR(6) | "v1" or "v2" |
| `health_score` | NUMERIC(5,2) | 0–100 overall score |
| `behaviour_score` | NUMERIC(5,2) | Behaviour component |
| `awareness_score` | NUMERIC(5,2) | Awareness component |
| `stability_score` | NUMERIC(5,2) | Stability component |
| `habits_score` | NUMERIC(5,2) | Habits component |
| `personality_type` | VARCHAR(32) | Archetype label |
| `future_risk_label` | VARCHAR(32) | Risk category |
| `future_risk_score` | NUMERIC(5,2) | Risk index score |
| `awareness_gap_months` | NUMERIC(5,2) | Perception gap |
| `nominal_survival_months` | NUMERIC(8,1) | Standard runway |
| `crisis_survival_months` | NUMERIC(8,1) | Crisis-optimized runway |
| `perceived_survival_months` | NUMERIC(8,1) | User-perceived runway |
| `savings_rate_proxied` | NUMERIC(5,2) | Proxy savings rate |
| `debt_to_income_months` | NUMERIC(8,1) | Debt burden ratio |
| `fixed_liability_pressure` | NUMERIC(5,2) | Liability/income ratio |
| `lowest_driver` | VARCHAR(16) | Weakest component |
| `created_at` | DATE | Date-only timestamp |

**Indexes:** `health_score`, `lowest_driver`, `created_at`, `personality_type`

### 8.2 Table: `tester_feedback`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `health_score` | NUMERIC(5,2) | Context score |
| `primary_driver` | VARCHAR(32) | Selected value driver |
| `feedback_text` | TEXT | Optional notes (≤1000 chars) |
| `created_at` | DATE | Date-only timestamp |

### 8.3 Table: `assessments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `assessment` | JSONB | Full assessment input |
| `result` | JSONB | Full computed result |
| `participant_name` | VARCHAR(255) | Optional name |
| `participant_age` | VARCHAR(32) | Optional age |
| `participant_email` | VARCHAR(255) | Optional email |
| `created_at` | TIMESTAMPTZ | Precise timestamp |

### 8.4 RLS Policies

- `allow_telemetry_collection`: INSERT allowed for public
- `deny_telemetry_read`: SELECT denied for public
- `allow_feedback_collection`: INSERT allowed for public
- `deny_feedback_read`: SELECT denied for public
- Service role has INSERT grant for API routes

### 8.5 Analytics View: `telemetry_summary`

Aggregated view by date and personality type: average health score, awareness gap, savings rate, sample size.

---

## 9. Component Architecture

### 9.1 Component Tree

```
App
├── Header (brand, nav, save/export/reset)
├── HeroSection (landing hero + engine card)
├── IntelligenceSection (AI feature highlights)
├── BusinessSection (business value props)
├── FounderSection (founder quote + stats)
└── AssessmentSection (main assessment workspace)
    ├── WizardProgressTrack (step indicators)
    ├── ParticipantSection (name/age/email)
    ├── QuestionSection × 3 (Psychology, Clarity, Habits)
    ├── ProfileSection (Resilience — numeric inputs)
    ├── WizardNavFooter (Prev/Continue buttons)
    ├── ValidationFeedbackForm (post-assessment)
    └── Result Stack (right sidebar)
        ├── InsightNarrative
        │   └── behaviorCorrelation.js (engine)
        └── DecisionSimulator
```

### 9.2 Key Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `AssessmentSection` | `src/components/AssessmentSection.jsx` | Multi-step wizard container, telemetry dispatch, feedback integration |
| `QuestionSection` | Internal to AssessmentSection | Renders a group of questions with SegmentedControl |
| `ProfileSection` | Internal to AssessmentSection | Numeric inputs for stability profile |
| `SegmentedControl` | Internal to AssessmentSection | Accessible radio group for categorical answers |
| `MoneyInput` | Internal to AssessmentSection | INR-formatted numeric input |
| `InsightNarrative` | `src/components/InsightNarrative.jsx` | Personalized insight with behavioral correlations |
| `DecisionSimulator` | `src/components/DecisionSimulator.jsx` | Purchase impact simulator |
| `ValidationFeedbackForm` | `src/components/ValidationFeedbackForm.jsx` | Post-assessment feedback collection |

### 9.3 State Management

- **Assessment state:** `useState` in `App.jsx`, passed down via props
- **Persistence:** `localStorage` key `arth-os-assessment`; wizard step under `arth-os-wizard-step`
- **Memoization:** `useMemo` for scoring results; `React.memo` on selected sub-components (ScoreOverview, ScoreDial, ComponentBreakdown, SurvivalBlock, ActionBlock, BlindSpotPanel, DiagnosisPanel)
- **History:** `UserHistory.jsx` independently reads/writes `arth-os-score-history` from localStorage

### 9.4 Wizard Step Flow

```
Step 0: Psychology  → Behaviour questions (12 items)
Step 1: Clarity     → Awareness questions (8 items)
Step 2: Resilience  → Profile inputs (numeric + categorical)
Step 3: Habits      → Habit questions (2 items) [v2 only]
Final: Telemetry dispatch → Feedback form → Redirect to #home
```

Step state persists to localStorage. On page load, restores last step. Fallback to step 0 if unavailable.

---

## 10. Build & Deployment

### 10.1 Local Development

```bash
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173
```

### 10.2 Production Build

```bash
npm run build        # Outputs to dist/
```

**Build output (last measured):**
| File | Size | Gzipped |
|------|------|---------|
| `index.html` | 1.82 kB | 0.91 kB |
| CSS | 31.35 kB | 6.66 kB |
| JS | 206.75 kB | 63.08 kB |
| **Total** | ~240 kB | ~70 kB |

### 10.3 Vercel Deployment

**Configuration:** `vercel.json`
```json
{ "name": "arth-os-financial-health" }
```

**Environment Variables (Vercel Dashboard):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

**Deploy:**
```bash
vercel --prod
```

### 10.4 Supabase Setup

1. Go to Supabase SQL Editor
2. Copy `SQL_SCHEMA.sql` contents
3. Run to create tables, indexes, RLS policies
4. Verify: `SELECT * FROM information_schema.tables;`

---

## 11. Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | For saveAssessment | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For saveAssessment | Service role API key |
| `VITE_TELEMETRY_ENDPOINT` | Optional | Override telemetry endpoint |
| `REACT_APP_TELEMETRY_ENDPOINT` | Optional | Legacy telemetry endpoint |
| `REACT_APP_FEEDBACK_ENDPOINT` | Optional | Legacy feedback endpoint |
| `SUPABASE_ASSESSMENTS_TABLE` | Optional | Override table name (default: "assessments") |

### localStorage Keys

| Key | Purpose |
|-----|---------|
| `arth-os-assessment` | Full assessment state (v2 unified) |
| `arth-os-assessment-v2` | Legacy v2 assessment state |
| `arth-os-assessment-v1` | Legacy v1 assessment state |
| `arth-os-wizard-step` | Current wizard step index |
| `arth-os-score-history` | Score progression history array |

### CSS Custom Properties

Defined in `:root` in `src/styles.css`:
- `--bg`, `--bg-2` — Background colors
- `--surface`, `--surface-2`, `--surface-3` — Card/panel surfaces
- `--text`, `--text-2` — Primary text colors
- `--muted`, `--muted-2` — Secondary text colors
- `--border`, `--border-strong` — Border colors
- `--purple`, `--purple-2`, `--violet` — Brand purples
- `--cyan`, `--amber`, `--coral`, `--green` — Semantic accent colors
- `--display`, `--body` — Font stacks

---

## 12. Troubleshooting

### Build fails with missing component
- Verify `src/components/ValidationFeedbackForm.jsx` exists
- Check import paths in `AssessmentSection.jsx`
- Run `npm install` to ensure all dependencies

### Telemetry not appearing in database
- Verify Vercel deployment: `vercel list`
- Check endpoint URL matches deployed domain
- Verify Supabase connection string in Vercel env vars
- Check RLS policies allow INSERT
- Query: `SELECT COUNT(*) FROM anonymous_telemetry;`

### Feedback form not showing
- Check `ValidationFeedbackForm.jsx` import in `AssessmentSection.jsx`
- Verify `showFeedback` state is `true` after telemetry dispatch
- Check browser console for React errors

### Step state not persisting
- Browser privacy mode may block localStorage
- localStorage quota may be exceeded
- Fallback to in-memory state (already implemented)

### Mobile layout broken
- Check media query breakpoint: `@media (max-width: 820px)`
- Verify CSS custom properties defined in `:root`
- Test on actual device, not just browser resize

### Scoring returning unexpected values
- Ensure all answer values match exactly the keys in `*ScoreMaps`
- Check for empty strings (treated as 0 score)
- Verify assessment object has expected structure (no missing keys)

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Maintainer:** Sankhya / ARTH.OS Engineering
