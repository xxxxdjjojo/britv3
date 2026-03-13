---
phase: 14-landlord-dashboard
plan: "06"
subsystem: ui
tags: [compliance, landlord, dashboard, supabase-storage, react-dropzone, react-hook-form, zod]

requires:
  - phase: 14-02
    provides: getComplianceSummary service, getPortfolioProperties service, property_documents table, landlord-documents private bucket

provides:
  - Compliance Dashboard (9.12) — 4 certificate category tiles + urgency-sorted all-certs table
  - CertificateStatusTile component — reusable tile with status colour coding, progress bar, counts
  - Expiry Alerts page (9.14) — Server Component with category filter tabs, days-overdue/remaining counter
  - Upload Certificate page (9.13) — Server Component with URL query param pre-fill
  - ComplianceUploadForm component — react-dropzone, zod validation, UK compliance hints per category
  - API route POST /api/landlord/compliance/upload — private bucket upload, createSignedUrl, next_reminder_date insertion

affects:
  - 14-07 (maintenance inbox — same landlord dashboard pattern)
  - 14-08 (finance pages — same Server Component pattern)
  - compliance reminder Edge Function (uses property_documents.next_reminder_date)

tech-stack:
  added: []
  patterns:
    - Server Component + async searchParams pattern for URL query pre-fill (upload page)
    - Private bucket uploads via landlord-documents with createSignedUrl (never getPublicUrl)
    - react-dropzone useDropzone with onDropRejected for file validation UX

key-files:
  created:
    - src/app/(protected)/dashboard/landlord/compliance/alerts/page.tsx
    - src/app/(protected)/dashboard/landlord/compliance/upload/page.tsx
    - src/app/api/landlord/compliance/upload/route.ts
    - src/components/landlord/CertificateStatusTile.tsx
    - src/components/landlord/ComplianceUploadForm.tsx
  modified:
    - src/app/(protected)/dashboard/landlord/compliance/page.tsx

key-decisions:
  - "Compliance dashboard rebuilt as Server Component calling getComplianceSummary — replaced existing mock-data client component"
  - "Upload API route stores storage_path (not signed URL) in property_documents.file_url — signed URLs are ephemeral and generated on-demand"
  - "next_reminder_date set server-side in API route as expiry_date - 30 days at insert time"
  - "CertificateStatusTile navigates to /compliance/alerts?category={category} on click — enables filtered alert view"

patterns-established:
  - "Private storage: landlord-documents bucket; all consumers use createSignedUrl to access — never getPublicUrl"
  - "Compliance pages: Server Components for initial data fetch + client form components for interactivity"

requirements-completed:
  - LD-06
  - LD-07
  - LD-26
  - LD-27

duration: 45min
completed: 2026-03-13
---

# Phase 14 Plan 06: Compliance Management Summary

**Compliance dashboard (9.12-9.14) with real Supabase data: 4 certificate status tiles, urgency-sorted expiry alerts, and private-bucket upload form with UK compliance hints**

## Performance

- **Duration:** 45 min
- **Started:** 2026-03-13T23:00:00Z
- **Completed:** 2026-03-13T23:45:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Rebuilt compliance/page.tsx as a Server Component using real getComplianceSummary data — replaced mock client component
- Built CertificateStatusTile with colour-coded borders (red/amber/green), count breakdown, and progress bar
- Created Expiry Alerts page (9.14) with category filter tabs, expired/expiring_soon sorting, and days-remaining counter
- Created Upload Certificate form with react-dropzone, UK compliance hints per category (gas safety/EICR/EPC), file preview, and upload progress
- API route stores storage path in DB (not ephemeral signed URL); uses createSignedUrl on access — security best practice
- next_reminder_date auto-set to expiry - 30 days on insert

## Task Commits

1. **Task 1: Compliance Dashboard (9.12) + Expiry Alerts (9.14)** - `cdf80da` (committed as part of 14-05 summary by concurrent agent)
2. **Task 2: Upload Certificate form (9.13) + API route** - `a145c7c` (feat)

## Files Created/Modified

- `src/app/(protected)/dashboard/landlord/compliance/page.tsx` — Rebuilt as Server Component with getComplianceSummary, 4 tiles, all-certs table
- `src/app/(protected)/dashboard/landlord/compliance/alerts/page.tsx` — Category-filtered alert list with days-overdue/remaining
- `src/app/(protected)/dashboard/landlord/compliance/upload/page.tsx` — Server Component with URL query param pre-fill for property/category
- `src/app/api/landlord/compliance/upload/route.ts` — POST handler with auth, property ownership check, signed URL, DB insert with next_reminder_date
- `src/components/landlord/CertificateStatusTile.tsx` — Reusable status tile with Link wrapper, colour-coded border, progress bar
- `src/components/landlord/ComplianceUploadForm.tsx` — Client form with react-dropzone, zod validation, upload progress bar

## Decisions Made

- Upload API stores `storage_path` (not signed URL) in `property_documents.file_url` — signed URLs expire; storing path lets us generate fresh URLs on demand
- CertificateStatusTile is a clickable Link to alerts filtered by category — avoids separate "view" button
- Deposit protection tile hardcoded to valid/0 expired since deposit_registrations table is separate from property_documents; full deposit compliance tracking is in plan 14-05
- Compliance hints (gas safety/EICR/EPC) are informational only in the form — not enforced validation per plan spec

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Zod v4 API change: .errors[] → .issues[]**
- **Found during:** Task 2 (API route TypeScript compilation)
- **Issue:** Zod v4 changed SafeParseError from `.error.errors[0]` to `.error.issues[0]` — TypeScript error prevented build
- **Fix:** Updated route.ts to use `parsed.error.issues[0]?.message`
- **Files modified:** src/app/api/landlord/compliance/upload/route.ts
- **Verification:** Build passes, TypeScript clean on file
- **Committed in:** a145c7c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — Zod v4 API)
**Impact on plan:** Minimal — single line fix required by Zod v4 upgrade. No scope creep.

## Issues Encountered

- Build environment was highly contested with 3+ concurrent agents running parallel `pnpm build` processes competing for `.next/lock` — required waiting for competing builds to finish before verifying. Build eventually confirmed passing via `Compiled successfully in 45s` + all compliance routes present in output.
- Pre-existing TypeScript errors in other files (InventoryRoomForm, TenantScreeningClient, etc.) are out of scope — documented for deferred tracking.

## Next Phase Readiness

- Compliance upload stores files in `landlord-documents` private bucket — same bucket as tenancy agreements (consistent with Phase 14 decisions)
- next_reminder_date populated — compliance reminder Edge Function (plan 06-05) can query this field
- Upload form pre-fills from URL query params — compliance alerts page "Upload New" buttons work end-to-end

---
*Phase: 14-landlord-dashboard*
*Completed: 2026-03-13*

## Self-Check: PASSED

Files verified:
- `src/app/(protected)/dashboard/landlord/compliance/page.tsx` - EXISTS
- `src/app/(protected)/dashboard/landlord/compliance/alerts/page.tsx` - EXISTS
- `src/app/(protected)/dashboard/landlord/compliance/upload/page.tsx` - EXISTS
- `src/app/api/landlord/compliance/upload/route.ts` - EXISTS
- `src/components/landlord/CertificateStatusTile.tsx` - EXISTS
- `src/components/landlord/ComplianceUploadForm.tsx` - EXISTS

Commits verified:
- `a145c7c` - feat(14-06): upload certificate form (9.13) + API route - FOUND
- Task 1 files committed in `cdf80da` by concurrent agent - FOUND

Build: PASSED (Compiled successfully in 45s, all compliance routes in build output)
getPublicUrl check: NOT FOUND in compliance upload files - PASSED
createSignedUrl check: FOUND in API route - PASSED
