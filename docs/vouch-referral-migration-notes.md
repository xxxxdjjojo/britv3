# Vouch/Referral Migration Notes

The migrations are additive and must be applied in timestamp order:

1. `20260716181259_vouch_referral_canonical_schema.sql`
2. `20260716181540_vouch_acceptance_transitions.sql`
3. `20260716181830_referral_credit_transactions.sql`
4. `20260716182336_vouch_referral_contract_corrections.sql`
5. `20260716184302_attribute_referral_signup.sql`
6. `20260716184719_durable_referral_credit_application.sql`
7. `20260716191351_referral_credit_billing_snapshot.sql`

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
