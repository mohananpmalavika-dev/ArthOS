# TODO - ARTH.OS Financial Health Score Framework

## Phase 1: Correctness + Stability (approved)
- [x] Fix amortization edge case in `src/lib/scoring-v2.js` (debt payoff months formula).
- [x] Fix scalability/robustness in `src/lib/scoring-v2.js` (remove `Object.keys()` from score averaging; use explicit key lists).
- [x] Fix `MoneyInput` numeric parsing + empty string handling in `src/App.jsx`.
- [x] Fix v2 numeric input parsing in `src/App.jsx` (debtRepaymentRatePctOfIncome, averageInterestRatePct).
- [x] Improve accessibility/semantics of `SegmentedControl` in `src/App.jsx` (remove invalid `name` on buttons; add keyboard handling).
- [x] Improve responsive layout for `.numeric-grid` (and safe layout adjustments) in `src/styles.css` using `auto-fit`.


## Phase 2: Performance (in progress)
- [x] Refactor `src/lib/scoring-v2.js` to expose smaller scoring helpers (behaviour/awareness/stability/debt/habits).

- [x] Update `src/App.jsx` to memoize per assessment slice instead of running full engine on every change.

- [x] Wrap selected result subcomponents with `React.memo` to reduce rerenders.


## Phase 3: v2 Milestone (later)
- [x] Split survival metric into Fixed vs Discretionary buffers (update questionnaire v2 schema, scoring engine, and UI).

