
### 🟡 HIGH PRIORITY GAPS (Missing features that users expect)





#### 14. **Missing endpoint: `saveAssessment` references `assessments` table but `api_src/user/assessment-detail.js` (which exists) depends on it without routing**
- `api/index.js` imports `userAssessmentDetailHandler` but the route for `/api/user/assessment-detail` may not match the handler's expectations

#### 15. **`api_src/longitudinal/` directory has several files but none are registered in `api/index.js` as root-level routes**
- `lifecycle-scoring-system.js`, `decision-outcome-mapper.js`, `cognition-graph-engine.js`, etc.
- These may be utility modules used by `ai-coach-handler.js` and `prediction-engine-handler.js`, but their standalone value is unreachable

---

### 🟡 MEDIUM PRIORITY GAPS (Missing but not blocking)

#### 16. **Test coverage gaps**
| Test File | Actual Coverage | Notes |
|-----------|----------------|-------|
| `scoring-v2.test.js` | ~80% | Good — covers core scoring |
| `digitalTwinEngine.test.js` | ~70% | 14 describe blocks |
| `emotionalTriggerEngine.test.js` | ~70% | 10 describe blocks |
| `moneyBeliefEngine.test.js` | ~75% | 12 describe blocks |
| `predictionEngine.test.js` | ~70% | 10 describe blocks (no `generatePrediction`, `simulateScenario`, `compareScenarios` tests — these functions are imported but never tested) |
| `habitEngine.test.js` | ~80% | Good |
| **Missing tests** | **0%** | `decisionQualityEngine`, `biasEngine`, `forecastEngine`, `notificationEngine`, `retentionEngine`, `insightGenerator`, `consequenceForecastEngine`, `cognitionEngine`, `counterfactualEngine`, `behaviourCorrelation`, `goalEvolutionEngine`, `interventionEngine`, `peerComparisonEngine`, `actionFollowUpEngine`, `adaptiveQuestionEngine`, `opportunityForecastEngine`, `scenarioForecast`, `trajectoryNarrativeEngine`, `singleInsightEngine`, `unifiedMemoryEngine`, `smsParser`, `moneyBeliefEngine` (no `deriveMoneyBeliefs` coverage), `financialTwinEngine`, `salaryRoast`, `stressTestEngine` |
| **Component tests** | **3/50+** | Only `BehaviourDrivers.test.jsx`, `DecisionSimulator.test.jsx`, `ValidationFeedbackForm.test.jsx` |
| **API tests** | **0** | No API integration tests for any endpoint |

#### 17. **Documentation gaps**
- `docs/openapi.yml` — incomplete: missing 30+ API endpoints (auth, user, b2b, banking, longitudinal, follow-up, subscriptions, reminders)
- No API endpoint documentation for: `/api/user/saveDraft`, `/api/user/loadDraft`, `/api/user/saveDecision`, `/api/user/savePreference`, `/api/user/saveTelemetry`, `/api/banking/*`, `/api/subscriptions/*`, `/api/follow-up/*`, `/api/coach/*`, `/api/prediction/*`, `/api/reminders/*`
- `FILE_MANIFEST.md` exists but the project has grown beyond it
- No JSDoc on most engine functions

#### 18. **`vercel.json` not read — check if API routing configuration exists for the catch-all `/api` handler**

---

### 🟢 LOWER PRIORITY GAPS (Quality-of-life improvements)

#### 19. **No service worker / PWA manifest**
- The app is a SPA but missing `manifest.json`, service worker, offline support beyond `localStorage`
- `isOnline` is tracked but offline mode only queues saves — no offline app shell

#### 20. **No end-to-end test**
- `test/arthos-flow-qa.spec.js` exists but likely uses Playwright (imported in package.json) with no CI integration

#### 21. **Environment variable documentation incomplete**
- `.env.example` exists but may be missing keys like: `SUPABASE_REMINDERS_TABLE`, `SUPABASE_ASSESSMENTS_TABLE`, `SUPABASE_TELEMETRY_TABLE`, `SUPABASE_FEEDBACK_TABLE`, `SUPABASE_ERROR_LOG_TABLE`, `SUPABASE_REMINDERS_TABLE`, `STRIPE_PRICE_PLUS_ID`, `STRIPE_WEBHOOK_SECRET`

#### 22. **Duplicate scoring logic**
- `src/lib/scoring-v2.js` and `src/lib/scoring-v2.ts` — both exist with different implementations
- One is TypeScript, one is JavaScript — but only `.js` is imported by `App.jsx`
- The `.ts` version may be stale

#### 23. **`src/lib/decisionLedger.js` and `decisionLedger.ts` — same duplicate pattern**
- Both files exist; only `.js` is used

#### 24. **Multiple copies of the same documentation**
- `IMPLEMENTATION_SUMMARY.md`, `SESSION_G4_COMPLETION_REPORT.md`, `G4_TECHNICAL_DEEP_DIVE.md`, `G4_DEPLOYMENT_CHECKLIST.md` — overlapping G4 content
- Same pattern for G5, G6, L01-L09 files — significant documentation bloat

#### 25. **`test/engines/predictionEngine.test.js` imports `generatePrediction`, `simulateScenario`, `compareScenarios` but never tests them**
- These imports are dead code in the test file

---

### RECOMMENDED ACTIONS (Priority order)

1. **Fix runtime errors**: Create `api_src/banking/vercel-handler.js`, fix `pgSql` typo in `dbClient.js`, register email-verify and subscription routes in `api/index.js`
2. **Deduplicate components**: Use `src/components/Header.jsx` and `src/components/AdminSection.jsx` instead of inline definitions in `App.jsx`
3. **Fix factory/test compatibility**: Update `test/fixtures/factories.js` to produce data matching v2 questionnaire keys
4. **Complete API surface**: Add missing password reset, subscription, and reminder routes
5. **Audit migration order**: Create `V1` migration file, ensure migration numbering is sequential
6. **Clean up documentation**: Consolidate the 50+ markdown files in the root — many are redundant
7. **Add critical test coverage**: At minimum for `biasEngine`, `forecastEngine`, `notificationEngine`, and `cognitionEngine`