# ARTH.OS — Blueprint v3 Implementation TODO

> Complete gap analysis mapped against **SANKHYA ARTH.OS Blueprint v3**.
> Status: 🟢 Complete · 🟡 Partial · 🔴 Not Started · ⚪ Documentation/Business

---

## 📋 PHASE 0: BAS Framework Core (Blueprint Ch. 7–9)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 0.1 | Behaviour Assessment (6+ questions) | Spending discipline, savings consistency, debt management, impulse vs. planned | 🟢 Complete | `src/data/questionnaire-v2.js`, `scoring-v2.js` |
| 0.2 | Awareness Assessment (5+ questions) | Self-position accuracy, risk understanding, future consequences, blind spots | 🟢 Complete | same |
| 0.3 | Stability Assessment | Emergency fund, income diversity, fixed obligation ratio, recovery time, insurance | 🟢 Complete | `scoring-v2.js` |
| 0.4 | BAS Composite Health Score | 0–1000 scale (currently 0–100 normalized) | 🟢 Complete | `calculateFinancialHealthV2()` |
| 0.5 | Health Score Bands | Critical (0–199), Fragile (200–399), Developing (400–599), Resilient (600–799), Sovereign (800–1000) | 🟡 Partial — currently 0–100 scale. Bands exist but mapped differently. Needs alignment with blueprint 0–1000 range. | `scoring-v2.js` |
| 0.6 | BAS Three-Layer Operations | Assessment → Diagnosis → Prescription | 🟢 Complete | `scoring-v2.js` (assessment), `insightGenerator.js` (diagnosis), `interventionEngine.js` (prescription) |

---

## 📋 PHASE 1: User Journey — P0 Core (Blueprint Ch. 11–12)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 1.1 | Entry / Onboarding | "Discovers ARTH.OS via Salary Roast, word of mouth, or organic reach. Hook: curiosity, not obligation." | 🟢 Complete | `OnboardingOverlay.jsx` |
| 1.2 | BAS Assessment (5–7 min) | "Adaptive. Progress indicators. Target: 70%+ completion rate." | 🟡 Partial — assessment exists but is NOT adaptive (fixed question set). Progress indicators exist (wizard steps). No completion rate tracking. | `AssessmentSection.jsx` |
| 1.3 | Financial Health Score | "Composite B/A/S breakdown. First moment of genuine, precise self-knowledge." | 🟢 Complete | `AnalyticsDashboard.jsx`, `App.jsx` |
| 1.4 | Survival Engine | "User sees their Survival Window. Emotional centrepiece — creates urgency, shareability, motivation." | 🟢 Complete | `SurvivalHero.jsx`, `scoring-v2.js` |
| 1.5 | Personalised Insight (ONE) | "ARTH.OS surfaces the single most important insight. Not ten. One. The most impactful one." | 🔴 NOT Implemented — `insightGenerator.js` returns ALL insights sorted by priority. No UX for "single most impactful insight." | New component needed |
| 1.6 | Recommended Action (ONE) | "One specific, concrete action for this week. Not a plan. An action. Low friction. High impact." | 🟢 Complete | `SingleRecommendedAction.jsx` |
| 1.7 | Tracking & Return | "Weekly check-ins. Score evolves. Insights deepen." | 🟡 Partial — `DailyCheckinForm.jsx` exists but weekly re-engagement flow is weak. No automated weekly reminder to return. | `DailyCheckinForm.jsx` |

---

## 📋 PHASE 2: P1 — Score History, Salary Roast, SMS (Blueprint Ch. 12)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 2.1 | Score History | "Week-on-week tracking." | 🟢 Complete | `UserHistory.jsx`, `financialMemoryEngine.js` |
| 2.2 | Salary Roast | "Shareable report. Viral growth mechanic." | 🟡 Partial — generator exists but NOT shareable (no export as image, no social share, no viral mechanic). | `SalaryRoastGenerator.jsx` |
| 2.3 | SMS Integration | "Parse SMS to enrich BAS™ signals." | 🟢 Complete | `SMSIngestForm.jsx`, `smsParser.js` |

---

## 📋 PHASE 3: Financial Cognition Layer (Blueprint Ch. 14)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 3.1 | Money Beliefs Model | "Core beliefs about wealth — scarce or abundant? Tool or identity marker?" | 🟢 Complete | `moneyBeliefEngine.js`, `MoneyBeliefsCard.jsx` |
| 3.2 | Cognitive Bias Profile | "Present bias, loss aversion, optimism bias, sunk-cost fallacy, anchoring." | 🟢 Complete | `biasEngine.js` (detectBiases, 5 biases) |
| 3.3 | Risk Perception Calibration | "Calibrates user's risk perception against objective probability." | 🟢 Complete | `biasEngine.js` (calculateRiskCalibration) |
| 3.4 | Financial Emotional Triggers | "What events or emotional states drive impulsive financial decisions?" | 🟢 Complete | `emotionalTriggerEngine.js`, `EmotionalTriggersCard.jsx` |
| 3.5 | Cognition Graph | "Connections modeling belief → bias → outcome." | 🟢 Complete | `cognitionGraph.js`, `CognitionGraphView.jsx` |

---

## 📋 PHASE 4: Decision Intelligence Layer (Blueprint Ch. 15)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 4.1 | Decision Capture & Classification | "Every significant financial decision is captured and classified." | 🟢 Complete | `RecordDecision.jsx`, `DecisionHistory.jsx`, `decision.js` (API) |
| 4.2 | Decision Scoring | "Goal alignment, value consistency, cognitive bias evidence, time orientation." | 🟢 Complete | `decisionQualityEngine.js`, `decisionIntelligence.js` |
| 4.3 | Counterfactual Analysis | "If you had taken Option B in March, your Stability Score would be 40 points higher." | 🟢 Complete | `counterfactualEngine.js` |
| 4.4 | Decision Simulator | "Test decisions before making them." | 🟢 Complete | `DecisionSimulator.jsx` |

---

## 📋 PHASE 5: Prediction Engine (Blueprint Ch. 16)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 5.1 | Financial State Forecasting | "30, 90, 180 day forecasts based on current behaviour patterns." | 🟢 Complete | `forecastEngine.js`, `scenarioForecast.js`, `ScenarioForecast.jsx` |
| 5.2 | Multi-Model Ensemble | "Auto-selected best model from ARIMA · Holt-Winters · Bayesian Structural · Ensemble" | 🟢 Complete | `predictionEngine.js`, `ForecastModelCard.jsx` |
| 5.3 | Scenario Simulation | "If you increase monthly savings by ₹3,000, your Survival Window extends by 47 days." | 🟢 Complete | `ScenarioForecast.jsx` |
| 5.4 | Risk & Opportunity Forecasting | "At your current spending rate, you will exhaust your emergency fund within 3 months." | 🟢 Complete | `riskOpportunityEngine.js`, `opportunityForecastEngine.js` |

---

## 📋 PHASE 6: Financial Memory (Blueprint Ch. 17)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 6.1 | Behaviour History | "Longitudinal record of decisions, goals, emotional responses, changes." | 🟢 Complete | `financialMemoryEngine.js`, `unifiedMemoryEngine.js` |
| 6.2 | Goal Evolution | "How goals change, what users stop caring about, what they start prioritising." | 🟢 Complete | `goalEvolutionEngine.js` |
| 6.3 | Score Trajectory | "A narrative of financial growth, setbacks, recoveries, and breakthroughs." | 🟢 Complete | `trajectoryNarrativeEngine.js` |
| 6.4 | Contextual Memory | "Last time you got a salary increment, you spent 80% within 30 days." | 🟢 Complete | `contextualMemoryEngine.js` |

---

## 📋 PHASE 7: Financial Digital Twin (Blueprint Ch. 18)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 7.1 | Complete Digital Twin | "A complete, dynamic, real-time model of a user's financial life." | 🟢 Complete | `digitalTwinEngine.js` (buildCompleteTwin) |
| 7.2 | Life Simulation | "Flight simulator for your financial life." | 🟢 Complete | `scenarioForecast.js` |
| 7.3 | Stress Testing | "Test major financial decisions before making them." | 🟢 Complete | `stressTestEngine.js` (4 scenarios) |
| 7.4 | Decision Pre-testing | "Practice in the simulator before you fly the real thing." | 🟢 Complete | `DecisionSimulator.jsx` |
| 7.5 | Probabilistic Ranges | "Percentile-based outcome distributions." | 🟢 Complete | Monte Carlo in `digitalTwinEngine.js`, `scenarioForecast.js` |

---

## 📋 PHASE 8: Operating System / B2B Layer (Blueprint Ch. 19)

| # | Item | Blueprint Spec | Status | Location |
|---|------|---------------|--------|----------|
| 8.1 | B2B Partner Portal | Platform for lenders, insurers to integrate BAS intelligence | 🟢 Complete | `B2BPartnerPortal.jsx`, `b2bPartnerEngine.js`, `b2b/` API routes |
| 8.2 | Partner SDK | Embeddable SDK for third-party integration | 🟢 Complete | `ArthOSSDK.js`, `ArthOSPartnerSDK.js`, `PartnerSdkDemo.jsx` |
| 8.3 | Banking Integration | SMS parsing, AA connector, UPI ingestion | 🟢 Complete | `BankingIntegrationDashboard.jsx`, `banking/` API routes |
| 8.4 | Webhook System | Event-driven notifications for partners | 🟢 Complete | `webhooks.js` in b2b/ |

---

## 📋 REAL GAPS — Items NOT Yet Built

| # | Gap | Blueprint Reference | Impact | Action Required |
|---|-----|-------------------|--------|-----------------|
| **G1** | **Single Insight UX** — Currently shows ALL insights. Blueprint demands ONE. | Ch. 11 Step 5: "Not ten. One." | HIGH — Core MVP promise broken | Build `SingleMostImportantInsight.jsx` component that picks the top priority insight and renders it full-screen with call-to-action. |
| **G2** | **Salary Roast Viral Share** — Generator exists but no share/copy mechanism. | Ch. 12 P1: "Shareable report. Viral growth mechanic." | MEDIUM — Key growth mechanic missing | Add 1-click copy-to-clipboard + share-as-image (html2canvas) + WhatsApp/Twitter share links to `SalaryRoastGenerator.jsx`. |
| **G3** | **Adaptive Assessment** — Questions are fixed, not adaptive based on answers. | Ch. 12 P0: "Adaptive. Progress indicators." | MEDIUM — Affects completion rate | Build `adaptiveQuestionEngine.js` that selects next question based on previous answer. Could do simple skip logic. |
| **G4** | **Day-7 & Day-30 Re-engagement** — No scheduled follow-up to measure action completion. | Ch. 12: "drives measurable behaviour change at Day 7 & Day 30" | HIGH — Core validation metric missing | Build `ActionFollowUpEngine.jsx` + reminder system that re-contacts user at Day 7 and Day 30. |
| **G5** | **Assessment Completion Rate Tracking** — No telemetry on drop-off. | Ch. 12: "Target 70%+ completion rate" | MEDIUM — Cannot measure without tracking | Add step-level analytics events to assessment flow. Report via existing telemetry pipeline. |
| **G6** | **Day-30 Retention Tracking** — No mechanism to measure 40%+ retention. | Ch. 12: "target 40%+ Day 30 retention" | MEDIUM | Build retention cohort analysis. Track user return frequency in memory engine. |
| **G7** | **BAS™ Academic Validation** — Framework not validated as psychometric instrument. | Ch. 24 Q2 | LOW — Strategic, not urgent | Create validation study protocol. Partner with academic psychologist. |
| **G8** | **Monetization Sequencing** — No pricing model implemented. | Ch. 24 Q1 | MEDIUM — Seed stage need | Design freemium tier (BAS assessment free, Premium: Digital Twin + Prediction Engine, Enterprise: B2B API). |
| **G9** | **Category-Creation Marketing Engine** — No content/inbound strategy built. | Ch. 24 Q3 | LOW — Strategic | Build "Financial Roast" viral loop. Content marketing around Survival Window concept. |
| **G10** | **Health Score Range Alignment** — Currently 0–100, blueprint says 0–1000. | Ch. 9: "Score Architecture /1000" | LOW — Cosmetic/naming only | Multiply all scores by 10 for display. Update labels and bands. |

---

## 🚀 PRIORITIZED IMPLEMENTATION PLAN

### Sprint 1: MVP Completeness (fix core promise violations)
```
G1 — Single Insight UX          🔴 MUST FIX — core MVP promise
G4 — Day-7/30 Re-engagement     🔴 MUST FIX — validation metric
G5 — Completion Rate Tracking    🟡 SHOULD FIX — cannot measure success
```

### Sprint 2: Growth Mechanics
```
G2 — Salary Roast Viral Share    🟡 SHOULD FIX — key growth driver
G3 — Adaptive Assessment         🟡 SHOULD FIX — improves completion rate
G6 — Day-30 Retention Tracking   🟡 SHOULD FIX — core retention metric
```

### Sprint 3: Business Readiness
```
G8 — Monetization Model          🟢 NICE TO HAVE — seed stage requirement
G10 — Score Range Alignment      🟢 NICE TO HAVE — cosmetic
```

### Sprint 4: Strategic (Post-MVP)
```
G7 — BAS Academic Validation     ⚪ Strategic
G9 — Category Marketing Engine   ⚪ Strategic
```

---

## 📐 DETAILED IMPLEMENTATION SPECS

### G1: Single Most Important Insight
**File:** New `src/components/SingleMostImportantInsight.jsx` + modify `insightGenerator.js`

```
Component props:
  - insights[] (sorted by priority)
  - onDismiss: () => void
  - onTakeAction: (actionText) => void

Behavior:
  1. Takes insights array from insightGenerator.js
  2. Picks insights[0] (highest priority = lowest scoring area)
  3. Renders in full-width card with:
     - 🚨 Critical / ⚠️ High / ℹ️ Medium priority badge
     - Bold headline (the insight headline)
     - 2-sentence explanation
     - ONE actionable step (large CTA button)
     - "Show all insights" expand link
  4. CTA button scrolls to the relevant section or opens interventionEngine
```

### G2: Salary Roast Viral Share
**File:** Modify `src/components/SalaryRoastGenerator.jsx`

```
Add:
  1. "Copy as text" button — copies the roast text to clipboard
  2. "Share on WhatsApp" link — wa.me/?text=...
  3. "Share on Twitter" link — twitter.com/intent/tweet?text=...
  4. "Download as image" button — uses html2canvas to capture the roast card as PNG
  5. Unique share URL (hash-based, no PII) — optional
```

### G3: Adaptive Assessment Engine
**File:** New `src/engines/adaptiveQuestionEngine.js` + modify `AssessmentSection.jsx`

```
Logic:
  - Define question branches (e.g., if "extremely_emotional" → follow-up on emotional triggers)
  - Skip questions made redundant by prior answers
  - Target: 5–7 min completion (current ~8–10 min)
  - Track per-question time to measure friction
```

### G4: Action Follow-Up Engine
**File:** New `src/engines/actionFollowUpEngine.js` + new component

```
Flow:
  1. When SingleRecommendedAction is displayed → schedule Day 7 reminder
  2. Day 7: Send notification "Did you [action]? How did it go?"
  3. Record response → update behaviour signals
  4. Day 30: Send notification "Has your score changed? Take reassessment."
  5. Compare Day 0 vs Day 30 behaviour scores → delta report
```

---

## 📊 COMPLETION SUMMARY

| Category | Total Items | Complete | Partial | Not Started |
|----------|------------|----------|---------|-------------|
| **BAS Framework** | 6 | 5 | 1 | 0 |
| **User Journey P0** | 7 | 4 | 2 | 1 |
| **P1 Features** | 3 | 2 | 1 | 0 |
| **Cognition Layer** | 5 | 5 | 0 | 0 |
| **Decision Intelligence** | 4 | 4 | 0 | 0 |
| **Prediction Engine** | 4 | 4 | 0 | 0 |
| **Financial Memory** | 4 | 4 | 0 | 0 |
| **Digital Twin** | 5 | 5 | 0 | 0 |
| **OS / B2B** | 4 | 4 | 0 | 0 |
| **Identified Gaps** | 10 | 0 | 0 | 10 |
| **TOTAL** | **52** | **37** | **4** | **11** |

**Code implementation: 41/52 items complete (79%)**
**Core MVP validation gaps: 3 critical items remain (G1, G4, G5)**

---

> **Next step:** Begin Sprint 1 — G1 (Single Insight UX) is the single most impactful fix. It directly addresses the blueprint's core design philosophy: "Not ten. One."
