# Vouch/Referral Migration Notes

The migrations are additive and must be applied in timestamp order (11 total):

1. `20260716181259_vouch_referral_canonical_schema.sql`
2. `20260716181540_vouch_acceptance_transitions.sql`
3. `20260716181830_referral_credit_transactions.sql`
4. `20260716182336_vouch_referral_contract_corrections.sql`
5. `20260716184302_attribute_referral_signup.sql`
6. `20260716184719_durable_referral_credit_application.sql`
7. `20260716191351_referral_credit_billing_snapshot.sql`
8. `20260716193403_referral_ambassador_badge.sql`
9. `20260716194134_provider_vouch_request_summaries.sql`
10. `20260716203000_referral_attribution_and_pending_vouch_revoke.sql`
11. `20260717090000_referral_badge_fk_guard_and_cleanup.sql`

## Isolated-branch validation runbook (run on the TrueDeed account)

The Supabase MCP available in the build workspace is a different account
(`Gallerie Minuit`), so branch validation must be run by an operator
authenticated to the TrueDeed project (`ynkqzzpcbpphjczmrfva`). Steps:

```bash
# 1. Create an isolated branch off prod (forks the real schema).
supabase branches create vouch-referral-validate --project-ref ynkqzzpcbpphjczmrfva

# 2. Record authoritative counts on the branch BEFORE applying (grandfathering
#    + reward forecast — local counts are NOT a production forecast):
#      select count(*) from service_provider_details
#        where provider_verification_status = 'verified';
#      select count(*) from referrals;   -- and existing reward rows

# 3. Push the 11 migrations to the branch, then run advisors + the DB suite:
supabase db push --branch vouch-referral-validate
supabase db lint --branch vouch-referral-validate         # + review get_advisors (security/perf)
RUN_DB_TESTS=1 pnpm exec vitest run --config vitest.db.config.ts db-tests

# 4. Regenerate types against the branch and confirm the exact prod build.
# 5. Only after the branch is clean: apply to prod with the bypass ON (below).
```

## Production rollout order (avoids the provider-dashboard 503)

Migrations are applied MANUALLY (migrate.yml retired). Because merging `main`
triggers a Vercel production deploy of migration-dependent code, migrations MUST
land on prod BEFORE the new code deploys:

1. Set `VOUCH_GATE_BYPASS=true` in the prod environment.
2. `supabase db push` the 11 migrations to prod (`ynkqzzpcbpphjczmrfva`),
   reconciling the migration ledger per `supabase/migrations/README.md`.
3. Merge PR #188 → `main` → Vercel prod deploy. Run the smoke suite
   (provider dashboard loads, `/vouched/<VOUCH_PUBLIC_SLUG>` renders, a vouch
   request round-trips, a test referral attributes).
4. Configure the `VOUCH_PUBLIC_SLUG` repo variable to a genuine consented 3+3
   provider so the hard-gate public smoke cannot silently skip.
5. Set `VOUCH_GATE_BYPASS=false` to enforce the gate.

Rollback: flip `VOUCH_GATE_BYPASS=true` first, then restore the last-good Vercel
deployment if faults persist. The additive tables/ledger are safe to leave in
place. See `docs/vouch-referral-rollback.md`.

Grandfathering is evaluated at migration execution time and only marks providers
already carrying canonical `provider_verification_status = 'verified'` in that
target database. Therefore local counts are not a production forecast. Query
and record authoritative verified-provider and historical-referral counts on
the isolated branch before applying production migrations.

Do not backfill `provider_references` into `vouches`: legacy rows lack a trusted
voucher identity and fraud checks. Do not delete historical referee rewards;
they remain legacy read-only evidence. Only unambiguous referrer rewards may be
migrated.

Before preview, prove the Supabase project/branch identifier is isolated, run
the real DB suite and advisors, regenerate types, then validate the exact
production build against that branch. No linked TrueDeed branch is currently
present in this workspace, so remote application is blocked.
