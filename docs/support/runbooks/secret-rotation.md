---
title: Secret rotation
area: infra
severity_default: P2
code_paths:
  - src/env.ts
  - .env.example
  - src/lib/email/resend-webhook-verifier.ts
  - supabase/migrations/README.md
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Secret rotation

## Summary
Rotate a credential (leaked, staff change, or scheduled hygiene) without causing an
outage. The failure mode is rotating one side without the other — a webhook signing
secret, provider key, or DB credential changed in the vendor but not in the app (or
vice-versa) takes that integration down. This runbook sequences rotation safely.

## Symptoms
- (Proactive) a key was exposed in logs/a repo/a screenshot and must be revoked.
- (Reactive) an integration started failing right after a credential change —
  webhook signature rejections, 401s, DB auth errors.

## Customer impact
Zero if done cleanly; a botched rotation can break auth, payments webhooks, email,
or the DB connection. P2 (P1 if a live secret is actively exposed).

## Severity
P2; treat an actively-exposed live secret as P1 and revoke first.

## Detection
- The exposure itself (log/repo/screenshot review), or
- Integration failures immediately following a credential change (Sentry, webhook
  dashboards, `/admin/system-health`).

## Diagnosis
1. Which secret, and where is it consumed? `src/env.ts` is the validated inventory;
   `.env.example` documents every variable.
2. Does it have *two* sides that must match? e.g. the Resend webhook signing secret
   (`resend-webhook-verifier.ts` ↔ Resend dashboard), Stripe/Inngest signing keys.
3. Is it live-exposed (revoke immediately) or a scheduled rotation (stage it)?

## Remediation
1. Generate the new secret in the vendor.
2. Update it in the app's environment (Vercel/GitHub Actions secrets) — **never**
   commit it or paste it into logs, tickets, or the AI packet.
3. For two-sided secrets, update both sides in the correct order so there's no gap
   (add-new-then-cut-over where the provider allows overlapping keys).
4. Redeploy; verify the integration; then revoke the old secret.
5. If a secret was exposed, revoke the old one promptly and review for misuse.

## Verification
The affected integration works end-to-end with the new secret (a real webhook
verifies, a real email sends, auth works), the old secret is revoked, and
`/admin/system-health` is green. Confirm the old secret no longer works.

## Escalation
Exposed secret with signs of misuse → security incident (see
`docs/incidents/incident-response-plan.md` and the breach procedure in the
legal-compliance internal policies); DB/provider owner for credential resets.

## Follow-up
Post-incident note on how it leaked; confirm no secret is logged or echoed anywhere;
document per-secret rotation steps if this one was fiddly.
