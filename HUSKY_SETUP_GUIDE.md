# Husky Pre-commit Hooks Setup Guide

## Overview
This project now includes **Husky** for Git pre-commit hooks that enforce code quality on every commit. This ensures consistent code style, type safety, and prevents broken code from being committed.

## Installation

### Prerequisites
- Node.js 16+ (already installed)
- Git repository initialized (already done)
- npm 7+ (already installed)

### Install Husky

```bash
npm install husky --save-dev
npx husky install
```

The `npx husky install` command sets up Git hooks in the `.husky` directory.

## How It Works

### Pre-commit Hook
When you run `git commit`, the `.husky/pre-commit` hook automatically runs:

1. **ESLint** (`npm run lint --fix`) - Fixes code style issues on staged files
2. **Type Check** (`npm run type-check`) - Ensures TypeScript type safety
3. **Optional**: Tests can be uncommented to run on every commit

### Available npm Scripts

```bash
# Lint and automatically fix issues
npm run lint
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking (no emit)
npm run type-check

# Run tests
npm test

# Install Husky (needed after fresh clone)
npm run prepare
```

## Usage

### Normal Workflow
```bash
# Make changes to files
git add src/components/MyComponent.jsx

# Commit - pre-commit hook runs automatically
git commit -m "Add MyComponent"

# If lint/type-check fails:
# - Fix the issues shown in console
# - Re-run: git commit -m "Add MyComponent"
```

### Bypass Hooks (Only in Emergencies)
```bash
# Skip all pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "Emergency fix"
```

### Manual Hook Execution
```bash
# Run hook manually anytime
npm run lint
npm run type-check
```

## Configuration Files

### ESLint (.eslintrc.json)
- Enforces code style (indentation, quotes, semicolons)
- Rules for React, TypeScript, best practices
- Warnings on unused variables, console.log, var declarations

### Prettier (.prettierrc.json)
- Code formatter with consistent style
- 2-space indentation, double quotes, trailing commas

### Git Hooks (.husky/pre-commit)
- Shell script that runs lint & type-check
- Runs on staged files only

## Fresh Clone Setup

When cloning the repo on a new machine:

```bash
git clone <repo-url>
cd arth-os
npm install
npm run prepare   # Initializes Husky hooks
```

## Troubleshooting

### Issue: "command not found: husky"
```bash
# Solution: Reinstall dependencies
npm install
npm run prepare
```

### Issue: Pre-commit hook not running
```bash
# Solution: Check if hooks are installed
ls -la .husky/

# Reinstall if needed
npx husky install
chmod +x .husky/pre-commit
```

### Issue: ESLint errors on commit
```bash
# Fix automatically
npm run lint:fix

# Then recommit
git commit -m "message"
```

### Issue: TypeScript errors on commit
```bash
# Review type errors
npm run type-check

# Fix in your code, then recommit
git commit -m "message"
```

## CI/CD Integration

The `.github/workflows/test-and-build.yml` GitHub Actions workflow also runs:
- `npm run lint` - Code style check
- `npm test` - Unit tests
- `npm run build` - Production build
- `npm audit` - Security check

This provides a second validation layer on pull requests.

## Disabling Hooks (Not Recommended)

If you need to temporarily disable Husky:

```bash
# Disable Husky
npm uninstall husky
```

To re-enable:

```bash
npm install husky --save-dev
npm run prepare
```

## Best Practices

1. **Commit Often**: Small commits are easier to debug if hooks fail
2. **Fix Issues Immediately**: Don't commit broken code
3. **Run Locally First**: `npm run lint && npm run type-check` before committing
4. **Keep Hooks Fast**: Current setup runs in ~2-3 seconds
5. **Never Use `--no-verify`**: Breaks the quality gate

## Testing the Setup

```bash
# 1. Make a change with lint error
echo "console.log('test')" >> src/test.js
git add src/test.js

# 2. Commit - should fail with ESLint error
git commit -m "test"

# 3. Hook should show: "console" usage not allowed
# 4. Fix: Remove console.log line
git add src/test.js
git commit -m "test"  # Should succeed now
```

## Additional Resources

- [Husky Official Docs](https://typicode.github.io/husky/)
- [ESLint Configuration](../.eslintrc.json)
- [Prettier Configuration](../.prettierrc.json)
- [CI/CD Workflow](../.github/workflows/test-and-build.yml)
