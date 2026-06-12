# TODO

- [x] Inspect SQL migrations to confirm DB dialect expectations.
- [ ] Create and review an edit plan for fixing `migrations/V11__subscription_management_schema.sql` for PostgreSQL compatibility.
- [ ] Update V11 migration DDL: remove `AUTO_INCREMENT`, `ON UPDATE`, and inline `COMMENT`, replace with Postgres equivalents.
- [x] Run migrations via `npm run migrate` (or `node scripts/run_migrations.js`) and verify no syntax errors.



