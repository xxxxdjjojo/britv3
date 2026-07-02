-- Seed the portal_cost_calculator feature flag (Influence Strategy Phase 1,
-- item 1.2 / Decision Gate 4). The tool page at /tools/portal-cost-calculator
-- is gated on this flag and 404s while it is off. Seeded DISABLED — launch is
-- an explicit admin toggle at /admin/feature-flags, not a deploy side effect.
-- Idempotent: re-running (or an admin having already created the key) is a no-op.

insert into feature_flags (key, enabled, rollout_pct, allowed_roles, description)
values (
  'portal_cost_calculator',
  false,
  0,
  null,
  'Portal Cost Calculator tool (/tools/portal-cost-calculator). Off = page returns 404. Decision Gate 4 surface — enable deliberately.'
)
on conflict (key) do nothing;
