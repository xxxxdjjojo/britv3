# Vouch/Referral Rollback

Trigger rollback for redirect loops, unexpected provider access, elevated 5xx
rates, duplicate credits, stuck/invalid webhook transitions, or any PII leak.

1. Set the server-only production variable `VOUCH_GATE_BYPASS=true`.
2. Re-run public and provider smoke tests to confirm the new vouch condition is
   bypassed while authentication, verification, billing, and role checks remain.
3. If application faults continue, restore the recorded last-good Vercel
   deployment.
4. Leave all additive schema, vouch, fraud, referral, and credit ledger records
   intact. Never down-migrate or delete evidence.
5. Confirm Stripe webhook idempotency and Inngest retries before re-enabling the
   new artifact.
6. Document the incident, deployment IDs, migration versions, affected cohort,
   and smoke evidence in `IMPLEMENTATION_REPORT.md`.

Set `VOUCH_GATE_BYPASS=false` only after the exact promoted artifact passes
production link health and the authenticated provider cohort smoke.
