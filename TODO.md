# TODO

## Chart vendor crash (ReferenceError: Cannot access 'De' before initialization)

- [x] Confirm where charts from `recharts` are rendered on `/dashboard/home` (identified recharts usage in `src/App.jsx`).
- [ ] Implement mitigation to avoid recharts crashing:
  - [x] Disabled production minification in `vite.config.js` as a first mitigation.
  - [ ] Prefer pinning `recharts` to a stable version (edit `package.json` + lockfile).
  - [ ] Add a runtime guard to dynamically import recharts components only on the client.

- [ ] Run `npm run dev` to reproduce and verify the crash is gone.
- [ ] Run `npm run build` to ensure the production bundle is fixed.


