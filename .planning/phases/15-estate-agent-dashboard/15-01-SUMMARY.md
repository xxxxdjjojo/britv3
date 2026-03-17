# 15-01 Summary: DB Migration + TypeScript Types

**Status:** Complete

**Files created:**
- `supabase/migrations/20260313_agent_dashboard.sql` (15 tables, RLS, KPI RPC)
- `britv3.0/src/types/agent.ts` (all agent domain types, Zod schemas)

**Verification:**
- Table count: 15 (`grep -c "CREATE TABLE" ...` = 15)
- RLS count: 15 (`grep -c "ENABLE ROW LEVEL SECURITY" ...` = 15)
- TypeScript compile: clean (0 errors after Zod v4 fixes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 `z.record()` requires two arguments**
- **Found during:** TypeScript verification
- **Issue:** Zod v4 (^4.3.6) changed `z.record(valueSchema)` to require explicit key schema: `z.record(keySchema, valueSchema)`
- **Fix:** Replaced all `z.record(z.unknown())` with `z.record(z.string(), z.unknown())`
- **Files modified:** `britv3.0/src/types/agent.ts`

**2. [Rule 1 - Bug] Zod v4 `.or()` removed**
- **Found during:** TypeScript verification
- **Issue:** Zod v4 removed the `.or()` chained method on optional schemas
- **Fix:** Replaced `z.string().url().optional().or(z.literal(""))` with `z.union([z.string().url(), z.literal("")]).optional()`
- **Files modified:** `britv3.0/src/types/agent.ts`

**3. [Rule 3 - Blocking] `listings.agent_id` column does not exist**
- **Found during:** Migration authoring
- **Issue:** The `listings` table uses `user_id` not `agent_id` for the owner; the KPI RPC's `active_listings_count` query was adjusted to use `user_id = p_agent_id`
- **Fix:** RPC query uses `WHERE user_id = p_agent_id AND status = 'active'`
- **Files modified:** `supabase/migrations/20260313_agent_dashboard.sql`

## Migration Notes

- Trigger function `update_updated_at_column()` uses `CREATE OR REPLACE` to avoid conflicts with earlier migrations (landlord dashboard defines the same function)
- `agent_team_members.branch_id` FK is added via `ALTER TABLE` after `agent_branches` is created, matching the plan's dependency note
- All 15 tables use `IF NOT EXISTS` for idempotent re-runs
- KPI RPC uses `SECURITY DEFINER` for cross-table aggregation
