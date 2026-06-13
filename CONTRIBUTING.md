# Contributing to ARTH.OS

Thank you for considering contributing to ARTH.OS! This document outlines the process for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a **code of conduct** that all contributors must follow. Be respectful, constructive, and inclusive. Harassment, discrimination, or other inappropriate behavior will not be tolerated.

**Key principles:**

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community and users
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/ArthOS.git
   cd ArthOS
   ```
3. **Run the setup script:**
   ```bash
   chmod +x setup.sh && ./setup.sh
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

```
main ──●────────────────────────●────
        \                      /
feature  └──●──●──●──●──●─────┘
```

1. **Branch from `main`** for all work
2. **Keep branches focused** — one feature/fix per branch
3. **Rebase on `main`** before opening a PR to keep history linear
4. **Squash commits** where appropriate before merging

### Branch naming conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/stripe-webhooks` |
| `fix/` | Bug fixes | `fix/assessment-null-pointer` |
| `chore/` | Maintenance | `chore/update-deps` |
| `docs/` | Documentation | `docs/api-ref` |
| `refactor/` | Code refactoring | `refactor/scoring-engine` |

## Pull Request Guidelines

1. **PR title** should be descriptive: `feat: add Stripe webhook signature verification`
2. **Description** should explain:
   - What the change does
   - Why it's needed (link to issue if applicable)
   - How it was tested
   - Any migration steps or config changes required
3. **Keep PRs small** — under 400 lines is ideal. Split large changes into multiple PRs.
4. **All checks must pass** — CI runs linting, type-checking, tests, and builds
5. **Request review** from at least one maintainer
6. **Do not force-push** after a review has started unless requested

### PR checklist

Before submitting, ensure:

- [ ] Code follows the project's coding standards
- [ ] Tests are added/updated for all new logic
- [ ] All existing tests pass (`npm test`)
- [ ] TypeScript type-check passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated if needed
- [ ] No new warnings in browser console
- [ ] Edge cases are handled (empty states, errors, loading)

## Coding Standards

### General

- **Language:** JavaScript (ES2022+) with TypeScript for type definitions
- **Formatting:** Prettier with project config (single quotes, no trailing commas)
- **Linting:** ESLint with React + Prettier plugins
- **No `any` types** in TypeScript — use proper types or `unknown`

### Naming

| Concept | Convention | Example |
|---------|-----------|---------|
| Variables/functions | `camelCase` | `fetchUserData()` |
| Components/classes | `PascalCase` | `AssessmentSection` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Files | `kebab-case` | `scoring-engine.js` |
| Types/interfaces | `PascalCase` | `HealthScore` |
| Boolean variables | prefix with `is`, `has`, `should` | `isLoading` |

### React conventions

- Use **functional components** with hooks (no class components)
- Keep components under 200 lines — extract sub-components
- One component per file
- Use `React.memo` only when profiling shows a need
- Prefer `useCallback`/`useMemo` for expensive computations only

### Imports order

1. Node built-ins (`crypto`, `fs`)
2. Third-party packages (`react`, `stripe`)
3. Internal modules (`../lib/scoring-v2`)
4. Relative siblings (`./SubComponent`)
5. CSS/styles (last)

## Testing

We use **Vitest** for unit testing. All new code must include tests.

### Test structure

```
test/
├── scoringEngine.test.js     # Business logic tests
├── components/
│   └── AssessmentSection.test.jsx
├── fixtures/
│   └── assessment-inputs.js  # Test data factories
└── setup.js                  # Global test setup
```

### What to test

- **Business logic** — scoring calculations, data transformations, API handlers
- **Edge cases** — empty inputs, extreme values, missing data, error states
- **Component rendering** — key states (loading, empty, error, populated)
- **User interactions** — form submissions, button clicks, navigation

### Running tests

```bash
# All tests
npm test

# Single file
npx vitest test/scoringEngine.test.js

# Watch mode
npx vitest --watch

# Coverage
npm run test:coverage
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, tooling, deps |
| `docs` | Documentation only |
| `refactor` | Code change that fixes no bug, adds no feature |
| `test` | Adding or updating tests |
| `style` | Formatting, missing semicolons (not CSS) |
| `perf` | Performance improvement |

### Examples

```
feat(scoring): add BAST component weight calculation

Implement weight distribution for Behaviour (40%), Awareness (30%),
and Stability (30%) with normalization to 0-1000 scale.

Closes #42
```

```
fix(api): handle null body in decision webhook

Empty POST bodies now return 400 instead of crashing.
Fixes #87
```

## Issue Reporting

### Bug reports

Include:

- **Description** — what happened vs. what should have happened
- **Steps to reproduce** — minimal, complete, verifiable example
- **Environment** — OS, browser, Node version, commit hash
- **Screenshots** — if applicable
- **Console errors** — paste full error stack

### Feature requests

Include:

- **Use case** — what problem does this solve?
- **Proposed behavior** — how should it work?
- **Alternatives considered** — what else did you think of?
- **Success criteria** — how would we know it's done?

---

Thank you for contributing! 🚀
