# Troubleshooting Guide

## Starting the Application
- Run `docker-compose up` from the repository root.
- Confirm both `app` and `api` containers are running.
- If the API does not start, check `docker-compose logs -f api`.

## Common Docker Issues
- `Address already in use` on port `3000` or `5000`: stop the conflicting service and retry.
- `DATABASE_URL` missing or invalid: verify the value in `.env.local`.
- `api` service not starting: confirm the `profiles` block was removed from `docker-compose.yml`.

## API Routing Issues
- Frontend requests to `/api/*` should be proxied by `vercel.json` in production.
- In local Docker mode, the API is exposed on `http://localhost:5000`.
- Use `/api/config/capabilities` and `/api/background/health` for smoke checks.

## Vercel Deployment Issues
- Check `vercel.json` syntax and rewrite rules.
- Ensure required environment variables are set in Vercel.
- Use `vercel logs --prod` to inspect runtime errors.

## Monitoring & Error Tracking Issues
- If Sentry is not capturing errors, ensure `VITE_SENTRY_DSN` is present.
- If errors are not visible in Sentry, verify the DSN and project settings.
- If Sentry cannot be loaded, the app should still fall back to local `localStorage` capture.

## Next Steps When Something Fails
1. Re-run the same request in local development.
2. Check the browser console for JS errors.
3. Check backend logs for stack traces.
4. Confirm environment variables are available in the target environment.
5. Ensure `api/index.js` routes include the requested path.
