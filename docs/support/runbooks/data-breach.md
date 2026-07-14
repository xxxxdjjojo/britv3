---
title: Data breach (pointer)
area: security
severity_default: P1
code_paths:
  - docs/incidents/incident-response-plan.md
  - docs/incidents/comms-templates.md
  - docs/runbooks/gdpr-purge-fk-blocked.md
tables: []
admin_surfaces:
  - /admin/system-health
tier1_actions: []
alert_rules: []
last_verified_commit: ebb22d7b
---

# Data breach (pointer)

## Summary
Suspected or confirmed exposure of personal data. This is a **thin operational
pointer** — it does not restate the breach procedure. The authoritative,
legally-reviewed process (UK GDPR 72-hour ICO notification, containment, data-subject
comms) lives in the legal-compliance internal policies. This page exists so an
on-call engineer lands in the right place fast and doesn't improvise.

**Do not follow ad-hoc breach steps from memory.** Use the authoritative plan.

## Symptoms
- Evidence of unauthorised access to personal data (leaked credential with DB
  access, a cross-tenant data-exposure bug, an exfiltration signal).
- A report (internal or external) that customer data was exposed.

## Customer impact
Potentially severe — regulatory, legal, and trust. Treated as P1 by default until
scoped otherwise.

## Severity
P1.

## Detection
- Security signals (anomalous access, leaked-secret discovery), a cross-tenant RLS
  exposure found while investigating another issue, or an external report.

## Diagnosis
1. **Contain first** — if a credential is exposed, revoke it now
   (`secret-rotation.md`); if it's a data-exposure bug, take the affected surface
   offline or roll back.
2. Scope: what data, whose, how much, over what window.
3. Immediately engage the authoritative breach process (below) — this is not an
   engineer-solo decision.

## Remediation
- Follow the breach procedure in the **legal-compliance internal policies**
  (`legal-compliance/06-internal-policies/` — the incident-response-and-BCDR plan and
  breach procedure). It governs ICO notification timing, DPO involvement, and
  data-subject communication.
- Use `docs/incidents/incident-response-plan.md` for the operational incident
  lifecycle and `docs/incidents/comms-templates.md` for the security comms template.
- Preserve evidence; do not destroy logs while scoping.
- Fix the root cause through the normal PR + CI flow; if it was an RLS gap, add an
  RLS db-test so it can't recur.

## Verification
The exposure is contained (access revoked / surface fixed), scope is documented,
the legal/DPO process is engaged within its statutory clock, and the root cause has
a regression guard. Confirm no ongoing access.

## Escalation
This IS the escalation path — engage the DPO/legal owner and incident commander
immediately per the legal-compliance plan. Never sit on a suspected breach.

## Follow-up
Blameless post-incident review (`docs/incidents/post-incident-template.md`);
regulatory follow-through per the legal-compliance plan; add the specific guard that
would have caught it.
