# Status Page Operations

**Owner:** [INFORMATION REQUIRED]

How to run the public status page (`/status`) and its incident lifecycle. The guiding rule:
**the public never sees an internal error string, hostname, or env name** — the page renders
coarse labels only, and publishing an incident is a deliberate, audited act.

## What `/status` shows

`src/app/(main)/status/page.tsx` (route in `PUBLIC_ROUTES`) renders three things:

1. **Component states** — coarse, public-safe labels mapped from `health-service.ts` pings:
   Website, Payments, Email, Database. The `ServiceStatus.error` field is **dropped before
   render**; a leak test asserts no error strings/hostnames/env names reach the output.
   State copy: `operational` → "Operational", `degraded` → "Degraded", `down` → "Down".
2. **Incidents** — active, scheduled maintenance, and recent resolved, from `status_incidents`.
3. **90-day uptime** — from `uptime_checks`.

The error-boundary link that used to point at a non-existent `status.truedeed.co.uk` now
points at this in-app `/status` (fixed in PR 2). External DNS host is optional — OR-13.

## Incident lifecycle

Model: `status_incidents` + `status_incident_updates`. Service:
`src/services/admin/status-incident-service.ts`. Admin UI: `/admin/status-incidents`
(permission `manage_status_page`; super_admin + dev_admin). API mirrors the
`api/admin/feature-flags` pattern.

- **Severity:** `minor` / `major` / `critical` / `maintenance` (`classifyIncident`).
- **Status transitions** (`isValidStatusTransition`): `investigating` → `identified` →
  `monitoring` → `resolved`; `scheduled` for maintenance windows.
- **Draft-first:** rows are created unpublished. **Publishing is a separate, deliberate act**
  — nothing reaches the public until an admin sets `is_published`. RLS: anon/authenticated
  SELECT only `is_published` rows (mirrors `uptime_checks_public_read`); all writes are
  service-role only.
- **Audit:** every mutation calls `logAdminAction("status_incident.create|update|publish|resolve")`.

## Operating procedure

1. **Open** — create a draft incident, pick severity + affected components (public-safe
   names only), post the **investigating** message from `comms-templates.md`. Publish when
   you're ready for customers to see it.
2. **Update** — advance status (`identified` → `monitoring`) with each update; keep messages
   factual, numeric where possible, and free of internal detail.
3. **Scheduled maintenance** — create with status `scheduled` and the window; it renders in
   the "scheduled" section ahead of time.
4. **Resolve** — set `resolved`; it moves to recent-resolved history. Post the **resolved**
   template.
5. **Verify** — confirm the public `/status` reflects the change (publish→unpublish flips
   visibility) and that no internal string leaked.

## Guardrails

- Public-safe component names are a fixed vocabulary — do not surface raw service names.
- Draft-first + service-role-only writes mean a status incident can't be published by
  accident or by a lower-privilege admin.
- `manage_status_page` is limited to super_admin/dev_admin; the permission matrix is tested.
- No status-page email subscriptions in v1 (OR-06); no auto-incident creation from alerts —
  publishing stays a human decision (OR-05).
