# Monitoring and Error Tracking

## Purpose
This document describes how to configure and verify monitoring for ArthOS, including browser error tracking and runtime observability.

## Error Tracking
The application uses `src/lib/errorMonitoring.ts` for optional Sentry integration.

### Enable Sentry
1. Create a Sentry project.
2. Set `VITE_SENTRY_DSN` in `.env.local` for local development.
3. Set `VITE_SENTRY_DSN` in production environment variables (Vercel / Docker).

Example:
```env
VITE_SENTRY_DSN=https://<public_key>@sentry.io/<project_id>
```

### What Happens When Sentry is Disabled
- The app falls back to local logging.
- Errors are stored in browser `localStorage` for debugging.
- The app continues to function without Sentry.

## Recommended Monitoring Signals
- Browser JavaScript errors and unhandled promise rejections
- API 5xx error rates
- API latency for `/api/*` requests
- Health check responses from `/api/background/health`
- Service availability for Supabase and OpenAI integrations

## Verifying Monitoring
- Confirm `initializeErrorMonitoring()` is called from `src/main.jsx`.
- Deploy with `VITE_SENTRY_DSN` set and trigger a test error.
- Verify the error appears in the Sentry dashboard.
- If Sentry is unavailable, check browser `localStorage` for `arth-os-errors`.

## Logging and Alerts
If using a hosted monitoring platform, configure alerts for:
- error volume spikes
- repeated 5xx responses
- failed background job processing
- Supabase connectivity failures

## Notes
- `@sentry/react` is optional and only loaded when `VITE_SENTRY_DSN` is configured.
- The application supports both Sentry integration and a local fallback.
