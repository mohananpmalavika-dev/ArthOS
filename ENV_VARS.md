Required environment variables

- `DATABASE_URL` — PostgreSQL connection string used by `scripts/run_migrations.js` and server-side code. Example: `postgres://user:pass@host:5432/dbname`
- `SUPABASE_URL` — Supabase project URL (optional if using `DATABASE_URL` directly)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (optional if using `DATABASE_URL`)
- `REACT_APP_VAPID_PUBLIC_KEY` — VAPID public key used by the client for Web Push
- `PG_SSL` — set to `true` to enable SSL for `DATABASE_URL` when required

Quick actions

- Run migrations (uses `DATABASE_URL`):

```bash
npm run migrate
```

- If you prefer Supabase SQL editor, paste the files in `db/migrations/*.sql` into the editor.
