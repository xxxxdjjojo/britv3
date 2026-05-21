# GDPR Purge — FK Violation Operator Runbook

## Symptom

`kernel_deleted_users.status = 'failed'`, `last_error` mentions a foreign-key
constraint, Sentry alert tagged `module: "gdpr", feature: "purge"`.

## Cause

The user has rows in a table not yet in `PURGE_TABLES` (in
`src/inngest/functions/gdpr-user-purge.ts`). The `auth.admin.deleteUser` call
fails because the table's FK is `ON DELETE RESTRICT` (or default `NO ACTION`).

## Investigate

1. Read `kernel_deleted_users.last_error` — the constraint name identifies
   the blocking table.
2. Look up the constraint in `pg_constraint` to find the table and column.
3. Decide policy:
   - Pure user-owned data → delete: add `{ table, column }` to PURGE_TABLES.
   - Audit / business record → anonymise: change column nullable, set to NULL
     or a sentinel UUID, then add a migration to convert FK to `ON DELETE SET NULL`.

## Recover for the affected user

After updating PURGE_TABLES (or anonymising blocking rows manually):

```sql
-- Reset the purge so the worker retries
UPDATE public.kernel_deleted_users
  SET status = 'pending', last_error = NULL, failed_at = NULL
  WHERE user_id = '<UUID>';
```

Then emit the event again:

```bash
inngest event send gdpr/user.deletion-requested \
  --data '{"userId":"<UUID>","reason":"user_request"}'
```

## Follow-up

Open an issue tagged `gdpr` with the constraint and policy decision so PURGE_TABLES
or the FK schema is updated permanently.
