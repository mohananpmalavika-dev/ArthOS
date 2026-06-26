# TODO — Production hardening (remove mockdata + real APIs)

- [x] Remove dev-only JWT bypass (`dev-token`) from AuthContext and require real `/api/auth/me` validation in all modes

- [ ] Remove fallback dev JWT secret in `api_src/auth/jwt.js`; fail fast when `JWT_SECRET` missing
- [ ] Fail fast in `api_src/dbClient.js` when DB env vars are placeholders/missing; avoid silent empty results
- [ ] Fail fast / return 503 in `api_src/longitudinal/ai-coach-handler.js` when no AI provider configured (no echo/limited mode)
- [ ] Audit all route handlers referenced in `api_src/api/index.js` to ensure they’re wired to real DB/real external services (no mock endpoints)
- [ ] Validate reminders/banking/stripe endpoints for mock implementations and replace/remove them
- [ ] Add startup env validation module (optional but recommended) and use in server entrypoints
- [ ] Run: `npm run lint`, `npm run type-check`, `npm test`
- [ ] Smoke test key endpoints: `/api/auth/me`, `/api/user/assessments`, `/api/coach/health`

