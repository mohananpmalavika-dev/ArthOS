# Deployment Checklist

## Purpose
This checklist captures the minimal steps needed to deploy ArthOS in development and production, including Docker, Vercel, and environment configuration.

## Local Docker Deployment
- [ ] Ensure `docker` and `docker-compose` are installed.
- [ ] Run `docker-compose up` from the repository root.
  - The `api` service now starts by default alongside `app`.
- [ ] Verify the frontend at `http://localhost:3000` and API at `http://localhost:5000`.
- [ ] Use `docker-compose ps` to confirm both containers are healthy.
- [ ] Check API logs with `docker-compose logs -f api` for startup errors.

## Environment Variables
Configure the following values in `.env.local` or the deployment environment:
- `DATABASE_URL` - backend database connection string
- `JWT_SECRET` - JWT signing secret for API auth
- `VITE_SENTRY_DSN` - optional Sentry DSN for browser error monitoring
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - if Supabase-backed routes are enabled
- `OPENAI_API_KEY` - if AI Coach or prediction features require OpenAI

## Vercel Deployment
- [ ] Confirm the repo is linked to the correct Vercel project.
- [ ] Confirm `vercel.json` is present and routes `/api/*` to `api/index.js`.
- [ ] Set required production environment variables in Vercel.
- [ ] Deploy with `vercel --prod`.
- [ ] Verify the site URL and test critical API endpoints:
  - `/api/config/capabilities`
  - `/api/background/health`
  - `/api/coach/health`
  - `/api/longitudinal/lifecycle`

## Post-Deployment Validation
- [ ] Confirm frontend loads in production.
- [ ] Confirm API endpoints return `200` or expected fallback errors.
- [ ] Check Vercel deployment logs for build or runtime errors.
- [ ] Validate that environment variables are available in the deployed runtime.
