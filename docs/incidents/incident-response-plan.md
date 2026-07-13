# Incident Response Plan (Operational Companion)

**Owner:** [INFORMATION REQUIRED] · **Assessed as at:** 13 July 2026 · **Review:** quarterly

This is the *operational* incident plan for engineering and support: how we detect, run, and
close an incident day-to-day. It is deliberately thin on legal/statutory detail because that
already lives in the compliance pack, which is the **source of truth** for breach obligations:

- **`legal-compliance/06-internal-policies/03-incident-response-and-bcdr-plan.md`** — the full
  incident + business-continuity/DR plan (SEV classification, security runbooks for
  service-role key compromise, ICO 72-hour clock, PITR posture). *Maintained in the
  compliance pack (not tracked on `main`); keep contact details outside the production stack.*
- **`legal-compliance/03-data-protection/09-personal-data-breach-procedure.md`** — the
  personal-data breach procedure (Arts 33/34, ICO notification).

> If an incident involves personal data, a leaked secret, or suspected unauthorised access,
> STOP and follow the compliance breach procedure **in parallel** with this plan. Preserve
> evidence — never "auto-fix" a security incident in a way that destroys the trail.

## 1. Roles

One person may hold several roles at current headcount — name them anyway so each
responsibility has an owner.

| Role | Responsibility |
|---|---|
| **Incident Commander** | Declares the incident, owns coordination and decisions, sets severity |
| **Technical Lead** | Contains and fixes; owns the technical timeline |
| **Communications Lead** | Customer + status-page updates using `comms-templates.md` |
| **Security / Privacy Lead** | Data-impact assessment; drives the compliance breach procedure |
| **Customer-Support Lead** | Ticket triage, customer-specific follow-up, collects impact evidence |
| **Business Decision-Maker** | Approves refunds above threshold, disclosures, and other business calls |
| **Scribe / Timeline Owner** | Keeps the timestamped incident log (the evidence record) |

## 2. Severity (P0–P4, cross-mapped to compliance SEV)

| P | Definition | Compliance SEV | Response |
|---|---|---|---|
| **P0** | Security, personal-data, data-integrity, or platform-wide outage | SEV-1 | Immediate, all-hands, start incident log; run breach procedure if data/security |
| **P1** | Core service or payments down for many customers | SEV-1 / SEV-2 | Same hour |
| **P2** | Significant feature degraded or individual customer blocked | SEV-2 | Same day |
| **P3** | Minor issue, workaround exists | SEV-3 | Within 2 business days |
| **P4** | Cosmetic / informational | SEV-3 | Backlog |

Personal-data or security incidents are **always P0 / SEV-1** regardless of the P-level of the
underlying journey.

## 3. Lifecycle (12 steps)

1. **Detect** — alert email (PR 5), uptime dead-man switch, Sentry, `/status`, or a customer
   ticket. Anyone may raise; the Incident Commander confirms.
2. **Confirm** — reproduce or corroborate. Rule out false positive (e.g. a noisy threshold).
3. **Classify** — assign P-level; if data/security, flag SEV-1 and page the Security/Privacy Lead.
4. **Contain** — apply the relevant runbook (`docs/support/runbooks/`). Stop the bleeding
   before fixing root cause (e.g. roll back a bad deploy, freeze auto-collection).
5. **Communicate** — publish a status incident (PR 3) + send the initial acknowledgement from
   `comms-templates.md`. Do not speculate on cause or ETA.
6. **Mitigate** — reduce customer impact (feature flag off, rate-limit, failover where possible).
7. **Recover** — restore normal service; for data issues, restore from PITR per
   `docs/production-support/12-dr-and-backups.md`.
8. **Verify** — confirm **customer impact is actually resolved**, not just that the system is
   green. Check the affected journey end-to-end. Never declare resolved on system metrics alone.
9. **Monitor** — watch for recurrence for a defined window before closing.
10. **Close** — resolve the status incident; send the resolved comms.
11. **Post-incident review** — within 5 business days, blameless, using
    `post-incident-template.md`.
12. **Update playbook & tests** — every incident must leave behind a new/updated runbook,
    alert threshold, or automated test so the same failure is caught next time.

## 4. Declaring an incident

- **Trigger Tier 3 / formal incident** when: several customers affected; a core service is
  down; payment/entitlement data may be wrong; data integrity threatened; unauthorised access
  suspected; personal data may be exposed; fraud suspected; a third-party provider causes
  widespread failure; or recovery needs rollback/failover/production migration.
- Start the **incident log** immediately (Scribe). It is the evidence for the ICO
  "without undue delay" standard.

## 5. What "done" means

- The affected journey works for a real customer (verified in step 8).
- The status incident is resolved and customers were told.
- A post-incident review is scheduled or complete.
- At least one durable improvement (test/alert/runbook) is committed.

Anything less is still an open incident.
