-- Seed the portal_cost_passthrough feature flag (Influence Strategy Phase 3,
-- item 3.1a / Campaign 2). The report at /reports/portal-cost-passthrough
-- (and its /methodology sub-page) is gated on this flag and 404s while it is
-- off. Seeded DISABLED — this is the highest legal-care surface of the phase:
-- launch is an explicit admin toggle at /admin/feature-flags after legal
-- Gate 4 sign-off, never a deploy side effect.
-- Idempotent: re-running (or an admin having already created the key) is a no-op.

insert into feature_flags (key, enabled, rollout_pct, allowed_roles, description)
values (
  'portal_cost_passthrough',
  false,
  0,
  null,
  'Portal Cost Passthrough Study report (/reports/portal-cost-passthrough). Off = page returns 404. Legal Gate 4 surface — enable deliberately after sign-off.'
)
on conflict (key) do nothing;
