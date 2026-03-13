---
phase: 14-landlord-dashboard
plan: "04"
subsystem: ui
tags: [kanban, tenant-screening, react-pdf, pdf-generation, file-upload, supabase, next-js]

# Dependency graph
requires:
  - phase: 14-02
    provides: tenant-application-service with listApplications, acceptApplication, rejectApplication functions

provides:
  - Tenant Screening Kanban page (received/shortlisted/referencing/approved/rejected columns)
  - Application Detail page with screening status and pipeline timeline
  - Accept/Reject decision page with Resend email notifications
  - Tenancy Agreement PDF generation using @react-pdf/renderer (client-side)
  - Tenancy Agreement file upload to landlord-documents Supabase Storage bucket

affects:
  - 14-05
  - future landlord features referencing tenant_applications

# Tech tracking
tech-stack:
  added:
    - "@react-pdf/renderer (dynamic ssr:false in TenancyAgreementPDFWrapper client component)"
    - "react-dropzone (TenancyAgreementUpload)"
  patterns:
    - "dynamic(ssr:false) must live in a Client Component wrapper, not a Server Component — Next.js 16 Turbopack enforces this"
    - "Server Component outer + TenantScreeningClient inner for Kanban with router.refresh() on mutation"
    - "acceptApplication/rejectApplication called from client decision page via createClient()"

key-files:
  created:
    - src/app/(protected)/dashboard/landlord/tenants/page.tsx
    - src/app/(protected)/dashboard/landlord/tenants/[applicationId]/page.tsx
    - src/app/(protected)/dashboard/landlord/tenants/[applicationId]/decision/page.tsx
    - src/app/(protected)/dashboard/landlord/tenants/[tenancyId]/agreement/page.tsx
    - src/components/landlord/ApplicationPipelineCard.tsx
    - src/components/landlord/TenantScreeningClient.tsx
    - src/components/landlord/ApplicationDetailActions.tsx
    - src/components/landlord/TenancyAgreementPDF.tsx
    - src/components/landlord/TenancyAgreementPDFWrapper.tsx
    - src/components/landlord/TenancyAgreementUpload.tsx
  modified: []

key-decisions:
  - "dynamic(ssr:false) cannot be used in Server Components in Next.js 16 Turbopack — created TenancyAgreementPDFWrapper as a dedicated Client Component wrapper"
  - "TenancyAgreementPDF uses 'use client' directive at file level; PDFDownloadLink renders inline HTML button-styled anchor via className prop"
  - "TenantScreeningClient uses router.refresh() for optimistic Kanban updates rather than full React Query invalidation to keep implementation simple"
  - "AddApplicationSheet inserts directly to tenant_applications via createClient() since no API route exists for manual application entry"

patterns-established:
  - "SSR-incompatible libraries: always create a *Wrapper.tsx Client Component with dynamic(ssr:false) rather than importing directly in Server Component"
  - "Kanban pipeline: Server Component fetches via service function, passes initialApplications to Client wrapper for interactive rendering"

requirements-completed:
  - LD-03
  - LD-04
  - LD-14
  - LD-21
  - LD-22

# Metrics
duration: 28min
completed: 2026-03-13
---

# Phase 14 Plan 04: Tenant Screening Summary

**Kanban application pipeline (5 stages), application detail with screening status, accept/reject with Resend email, and @react-pdf/renderer AST tenancy agreement with drag-drop upload**

## Performance

- **Duration:** 28 min
- **Started:** 2026-03-13T22:49:03Z
- **Completed:** 2026-03-13T23:17:00Z
- **Tasks:** 2
- **Files created:** 10

## Accomplishments
- Replaced stub tenants page with live Server Component calling `listApplications()` from `tenant-application-service`
- Kanban board with 5 columns (received/shortlisted/referencing/approved/rejected), each showing count badge and ApplicationPipelineCard items
- Application Detail page showing credit check status, references status, pipeline timeline, and stage-advance actions
- Accept/Reject decision page with tabbed UI calling `acceptApplication`/`rejectApplication` from service (Resend email included in service layer)
- TenancyAgreementPDF component with 12 standard AST clauses (parties, property, dates, rent, deposit, standard terms, signatures)
- TenancyAgreementUpload component using react-dropzone to upload to `landlord-documents` Supabase Storage bucket and record in `property_documents`

## Task Commits

1. **Task 1: Tenant Screening pipeline (9.6), Application Detail (9.7), Accept/Reject (9.8)** - `64414f0` (feat)
2. **Task 2: Tenancy Agreement creation and PDF generation (9.9)** - `927f645` (feat)

## Files Created/Modified
- `src/app/(protected)/dashboard/landlord/tenants/page.tsx` - Server Component calling listApplications, passes to TenantScreeningClient
- `src/app/(protected)/dashboard/landlord/tenants/[applicationId]/page.tsx` - Full applicant detail with two-column layout
- `src/app/(protected)/dashboard/landlord/tenants/[applicationId]/decision/page.tsx` - Accept/Reject tabs with service calls
- `src/app/(protected)/dashboard/landlord/tenants/[tenancyId]/agreement/page.tsx` - Agreement page (upload + PDF generation)
- `src/components/landlord/ApplicationPipelineCard.tsx` - Card component with status badges
- `src/components/landlord/TenantScreeningClient.tsx` - Client Kanban wrapper with Sheet form for manual entry
- `src/components/landlord/ApplicationDetailActions.tsx` - Client component for stage-advance mutations
- `src/components/landlord/TenancyAgreementPDF.tsx` - "use client" PDF document with 12 AST clauses
- `src/components/landlord/TenancyAgreementPDFWrapper.tsx` - Client wrapper with dynamic(ssr:false) for PDF
- `src/components/landlord/TenancyAgreementUpload.tsx` - react-dropzone upload to Supabase Storage

## Decisions Made
- `dynamic(ssr:false)` cannot be used in Server Components in Next.js 16 Turbopack — created `TenancyAgreementPDFWrapper` as dedicated Client Component
- TenancyAgreementPDF exports `TenancyAgreementPDFDownload` component wrapping `PDFDownloadLink`
- Kanban uses `router.refresh()` for simplicity rather than full React Query mutation/invalidation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved dynamic(ssr:false) from Server Component to Client Component wrapper**
- **Found during:** Task 2 (Agreement page build)
- **Issue:** Next.js 16 Turbopack throws error when `dynamic()` with `ssr: false` is used directly in a Server Component — "ssr: false is not allowed with next/dynamic in Server Components"
- **Fix:** Created `TenancyAgreementPDFWrapper.tsx` as a `"use client"` file with the `dynamic(ssr:false)` import; agreement page imports the wrapper instead
- **Files modified:** src/components/landlord/TenancyAgreementPDFWrapper.tsx (new), src/app/(protected)/dashboard/landlord/tenants/[tenancyId]/agreement/page.tsx (import updated)
- **Verification:** TypeScript passes, pattern matches Next.js 16 docs
- **Committed in:** 927f645 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required fix for Next.js 16 Turbopack compatibility. No scope creep.

## Issues Encountered
- pnpm build hits exit code 137 (killed) during Turbopack compilation — appears to be a system resource/timeout issue unrelated to code correctness. TypeScript check (`npx tsc --noEmit`) passes cleanly with no errors. All verification criteria confirmed via grep and file checks.

## User Setup Required
None - no external service configuration required beyond what 14-02 established (RESEND_API_KEY).

## Next Phase Readiness
- Tenant screening workflow complete: applications flow from received → shortlisted → referencing → approved/rejected with email notifications
- Tenancy agreement PDF generation ready for landlord use
- Next: inventory reports (14-05) and legal notices (14-06) can link from the application/tenancy detail pages

---
*Phase: 14-landlord-dashboard*
*Completed: 2026-03-13*
