# ARTH.OS — Financial Health Score Framework (v1)

## 1) Objective
Help a user understand:
1. **How financially healthy they are today**
2. **How long they can survive if income stops**
3. **Which behaviors drive their score**
4. **A single highest-impact action** they should take next

The framework intentionally avoids bank integrations/AI complexity in v1.

---

## 2) Health Score (0–100)

**Health Score = Behaviour (40) + Awareness (30) + Stability (30)**

Where each component is computed from question answers and normalized to its range.

---

## 3) Scoring Model

### 3.1 Behaviour Score (0–40) — Financial Psychology & Habits
**What it measures:** spending triggers, impulse control, social influence, emotional attachment to money, and regret frequency.

#### Inputs (example question categories)
- Emotional spending (how strongly emotions drive spending)
- Impulse purchases (how often)
- Social influence on spending
- Regret frequency after impulse spending
- Future vs present mindset (enjoy today vs secure future)
- Avoiding checking balance during stress (avoidance vs awareness)

#### Scoring approach
Each answer maps to a numeric value. Sum and normalize to **0–40**.

A simple template mapping you can implement:
- Convert each question to a subscore in **0–10**
- Average 4 sub-questions → **0–10**
- Scale to **0–40**

**Behaviour Score banding (used by recommendations):**
- 0–13: Critical behaviour risk
- 14–26: Needs behaviour correction
- 27–34: Mostly controlled
- 35–40: Strong financial discipline

---

### 3.2 Awareness Score (0–30) — Financial Knowledge & Monitoring
**What it measures:** planning, tracking, knowledge of expenses/debt, and ability to estimate survival.

#### Inputs
- Do they know monthly expenses?
- Do they track spending?
- Do they have a plan?
- Do they know total debt?
- Do they avoid checking balance during stress (this can be a reverse factor or separate)

#### Scoring approach
- Each correct/active behavior earns points.
- Convert to **0–30** by summing weighted answers.

**Awareness Score banding:**
- 0–9: Low visibility
- 10–19: Basic awareness
- 20–24: Solid tracking
- 25–30: High clarity

---

### 3.3 Stability Score (0–30) — Financial Resilience
**What it measures:** emergency savings, debt burden, income consistency, dependents, and liabilities.

#### Inputs
- Emergency savings amount
- Total debt amount (and optional: monthly debt repayment)
- Income stability (consistent vs variable)
- Dependents / dependents count
- Existing liabilities

#### Scoring approach
Compute a few normalized indicators and combine:
- Emergency coverage: savings ÷ monthly expenses (capped)
- Debt pressure: debt burden relative to income (or expense proxy)
- Income stability factor

Normalize final to **0–30**.

**Stability Score banding:**
- 0–9: Fragile stability
- 10–19: Some cushion
- 20–24: Resilient
- 25–30: Very stable

---

## 4) Questionnaire (Starter Set)
This is a v1 question bank based on the kinds of questions you shared.

> Implementation note: Use 1–5 or categorical options; map them to scores.

### 4.1 Behaviour Questions
1. **How emotionally connected are you to money?** (1–4)
   - Extremely emotional
   - Somewhat emotional
   - Mostly practical
   - Fully logical

2. **Do social environments influence your spending decisions?**
   - Heavily
   - Sometimes
   - Rarely
   - Never

3. **How often do you make unplanned purchases?**
   - Very frequently
   - Sometimes
   - Rarely
   - Never

4. **How often do you regret impulse spending?**
   - Almost every time
   - Sometimes
   - Rarely
   - Never

5. **Would you rather enjoy today or aggressively secure your future?**
   - Enjoy today fully
   - Balance both
   - Secure future first
   - Extreme financial discipline

6. **Do you avoid checking your balance during stressful periods?**
   - Almost always
   - Sometimes
   - Rarely
   - Never

### 4.2 Awareness Questions
7. **Do you compare your lifestyle with people around you?**
   - Constantly
   - Occasionally
   - Rarely
   - Never

8. **Would you say you have a financial plan?**
   - Yes, clear plan
   - Some plan
   - No plan
   - Not sure

9. **Do you track your monthly expenses?**
   - Regularly (weekly/monthly)
   - Sometimes
   - Rarely
   - Never

10. **Do you know your total debt?**
   - Yes, fully
   - Partially
   - Not sure
   - No

11. **Do you know your monthly expenses?**
   - Yes, exact
   - Approximate
   - Not really
   - No

### 4.3 Stability Inputs (numeric)
12. **Monthly expenses (₹)**
13. **Emergency savings (₹)**
14. **Total debt (₹)**
15. **Monthly income (₹)**
16. **Income stability**
   - Very consistent
   - Mostly consistent
   - Somewhat variable
   - Highly variable

17. **Dependents**
   - 0–1
   - 2–3
   - 4–5
   - 6+

18. **Major liabilities / fixed commitments (₹/month)** (optional but recommended)

---

## 5) Health Score Bands
Use these to trigger the tone of guidance.

- **0–25 = Critical**
- **26–50 = Vulnerable**
- **51–75 = Stable**
- **76–100 = Healthy**

---

## 6) Survival Engine (Income Stop Calculator)

### 6.1 Survival Months
**Survival Months = Emergency Savings ÷ Monthly Expenses**

Edge cases:
- If monthly expenses = 0 → set survival months to 0 (or show validation error)
- If emergency savings = 0 → survival months = 0
- Cap display at e.g. 36+ months for UI simplicity

### 6.2 Survival interpretation bands
- **0–1 month:** Immediate risk
- **2–3 months:** Fragile cushion
- **4–6 months:** Improving stability
- **7–12 months:** Strong buffer
- **12+ months:** Highly resilient

---

## 7) Personalized Insights v1
Generate:
1. **One-line summary** of Health Score
2. **Strength + Risk** using highest/lowest component
3. **Survival months**
4. **One Recommended Action**

### 7.1 Summary template
- Health Score: **{score}/100**
- Category: **{band}**
- Survival if income stops: **{survivalMonths} months**

### 7.2 Identify key driver
- If Behaviour is lowest → focus on impulse/emotional/social drivers
- If Awareness is lowest → focus on tracking/planning visibility
- If Stability is lowest → focus on savings/debt resilience

### 7.3 Recommended action (ONE only)
Rules:
- Choose the action that is most likely to improve the lowest component within 30–60 days.

Action examples:
- **Behaviour low:** “Reduce unplanned purchases by 20% this month.”
- **Awareness low:** “Track every expense for the next 14 days and record total.”
- **Stability low:** “Build emergency savings of ₹{target} within 60 days.”

Compute a target:
- If survival months < 2: target = ₹ (0.75–1.0) * monthly expenses
- If survival months between 2–6: target = ₹ 0.5 * monthly expenses
- Otherwise: focus on maintenance or debt reduction micro-goal

---

## 8) MVP Implementation Notes (recommended)
For v1 MVP, compute only from:
- Survey answers
- Simple numeric inputs (expenses, savings, debt, income)

Defer:
- bank transaction ingestion
- AI/NLP insights
- complex debt amortization models

---

## 9) API / Data Model (minimal v1 schema)
### 9.1 Tables/Entities
- **UserFinancialProfile**
  - userId
  - monthlyExpenses
  - emergencySavings
  - totalDebt
  - monthlyIncome
  - dependentsBucket
  - incomeStability

- **UserBehaviourAnswers**
  - emotionalMoneyLevel
  - socialInfluenceLevel
  - unplannedPurchaseFreq
  - regretImpulseFreq
  - presentFutureMindset
  - avoidBalanceDuringStress

- **UserAwarenessAnswers**
  - comparesLifestyleFreq
  - hasFinancialPlan
  - tracksExpenses
  - knowsTotalDebt
  - knowsMonthlyExpenses

- **FinancialHealthResult**
  - behaviourScore
  - awarenessScore
  - stabilityScore
  - healthScore
  - survivalMonths
  - categoryBand
  - recommendedActionText
  - createdAt

---

## 10) v1 Output Contract (what UI displays)
- Health score number + band label
- Breakdown (Behaviour/Awareness/Stability)
- Survival months + survival band
- One recommended action

---

## 11) Next steps for v2 (future)
- Add 50+ question bank and calibrate weights
- Add debt repayment schedule estimates
- Add habit streaks and progress tracking
- Add more personalized action plans (still ONE primary action per cycle)

