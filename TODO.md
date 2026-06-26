# TODO - Enterprise Production Readiness

## Step 1: EnterpriseAuthContext validation
- [x] Review `src/context/EnterpriseAuthContext.jsx` for `hasPermission`, token refresh, loading behavior.

## Step 2: Gate enterprise navigation
- [x] Update `src/components/EnterpriseFlowNavigation.jsx` to hide/disable tabs based on `hasPermission`.
- [ ] Ensure activeTab routing/hash sync + access denied UX.



## Step 3: Productionize ComplianceReports
- [x] Replace mock data in `src/components/ComplianceReports.jsx` with API calls (reports list, compliance metrics, audit trail).
- [x] Implement “Generate Report (API)” flow: call backend, show progress, handle status, update list.
- [x] Implement action buttons: Download / Print / Email.
- [x] Add loading, error, retry, and empty-state UI.



## Step 4: Add/verify enterprise API integration
- [ ] Verify `src/lib/apiClient.js` usage pattern for enterprise endpoints + auth.
- [ ] Ensure standard error handling + telemetry/captureException usage.

## Step 5: Frontend production checks
- [ ] Run `npm test`, `npm run lint`, `npm run build`.
- [ ] Smoke-test enterprise routes: `/enterprise` and tab gating.
- [ ] Smoke-test compliance page: fetch + generate + download/print/email.

