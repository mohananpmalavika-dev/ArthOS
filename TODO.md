# TODO — Move frontend business logic to server APIs (Priority: Very High)

## Step 0: Repo reconnaissance
- [x] Identify frontend engines under `src/engines/*`
- [x] Identify existing server API structure under `api/` and `api_src/`

## Step 1: Define API contracts + server service modules (Phase 1: start engines)
- [x] Create server-side service module for Prediction Engine (`predictionEngine.js` logic)
- [x] Create server-side service module for Decision Intelligence (`decisionIntelligence.js` logic)
- [x] Create server-side service module for Cognition (`cognitionEngine.js` logic, remove `window.localStorage` usage)
- [x] Create server-side service module for Loan Health (`LoanHealthEngine.ts`)

## Step 2: Add endpoints (Phase 1)
- [ ] POST `/api/prediction/forecast`
- [ ] POST `/api/prediction/scenario`
- [ ] POST `/api/decision/score`
- [ ] POST `/api/decision/outcome/record`
- [ ] POST `/api/cognition/build-profile`
- [ ] POST `/api/cognition/beliefs/analyze`
- [ ] POST `/api/loan-health/calculate`

## Step 3: Refactor frontend to call APIs instead of importing engines
- [ ] Find React components importing each engine and replace with API calls
- [ ] Ensure UI loading/error states

## Step 4: Persistence strategy for calibration/outcomes
- [ ] Start with server-side file/in-memory persistence (no DB yet)
- [ ] Later: migrate persistence to DB and add SQL migrations

## Step 5: Tests and verification
- [ ] Unit tests for deterministic engines (Loan Health, parts of cognition/decision)
- [ ] Contract tests for API schemas
- [ ] Run build + smoke tests

