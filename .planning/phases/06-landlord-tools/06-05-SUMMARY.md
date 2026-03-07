---
phase: 06-landlord-tools
plan: 05
subsystem: landlord
tags: [supabase, document-upload, compliance, jspdf, pg_cron, edge-function, file-validation]

# Dependency graph
requires:
  - phase: 06-landlord-tools
    provides: landlord database tables (property_documents), file validation, image compression, types
  - phase: 03-dashboards-comms
    provides: notification system for compliance reminders
provides:
  - Document CRUD service with storage upload and expiry tracking
  - API routes for document management (GET/POST/DELETE)
  - DocumentUpload client component with magic byte file validation
  - DocumentList with green/amber/red expiry status indicators
  - ComplianceAlert banner for expiring compliance documents
  - LeasePreview client component with jsPDF for AST lease PDF generation
  - Static compliance guide page with UK landlord requirements and gov.uk links
  - Compliance reminder Edge Function with pg_cron daily schedule
  - Pure compliance-reminder-logic module for testable reminder processing
affects: [06-landlord-tools]

# Tech tracking
tech-stack:
  added: []
  patterns: [compliance-reminder-logic-extraction, dynamic-jspdf-import, expiry-status-derivation]

key-files:
  created:
    - britv3.0/src/services/landlord/document-service.ts
    - britv3.0/src/app/api/properties/[id]/documents/route.ts
    - britv3.0/src/app/api/documents/[id]/route.ts
    - britv3.0/src/components/landlord/DocumentUpload.tsx
    - britv3.0/src/components/landlord/DocumentList.tsx
    - britv3.0/src/components/landlord/ComplianceAlert.tsx
    - britv3.0/src/components/landlord/LeasePreview.tsx
    - britv3.0/src/app/(protected)/dashboard/landlord/properties/[id]/documents/page.tsx
    - britv3.0/src/app/(protected)/dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease/page.tsx
    - britv3.0/src/app/(protected)/dashboard/landlord/compliance-guide/page.tsx
    - britv3.0/src/lib/compliance-reminder-logic.ts
    - britv3.0/supabase/functions/compliance-reminders/index.ts
    - britv3.0/supabase/migrations/20260307_epic7_compliance_cron.sql
    - britv3.0/src/__tests__/landlord/document-upload.test.ts
    - britv3.0/src/__tests__/landlord/compliance-reminders.test.ts
    - britv3.0/src/__tests__/landlord/lease-pdf.test.ts
    - britv3.0/src/__tests__/landlord/compliance-edge-function.test.ts
  modified: []

key-decisions:
  - "Extracted compliance reminder logic into pure module (compliance-reminder-logic.ts) shared between Edge Function and tests"
  - "jsPDF dynamically imported via await import('jspdf') to avoid bundle impact on other pages"
  - "Expiry status derived client-side as pure function: getExpiryStatus(expiryDate) returns valid/expiring/expired/none"
  - "Duplicate notification prevention via 24-hour window check in Edge Function"

patterns-established:
  - "Expiry status derivation: green (>30d), amber (<=30d), red (expired), none (no date)"
  - "Edge Function logic extraction: pure functions in src/lib for testability, inlined in Deno function"
  - "Dynamic import for heavy client libs: await import('jspdf') only on lease page"

requirements-completed: [LL-08, LL-09, LL-10]

# Metrics
duration: 25min
completed: 2026-03-07
---

# Phase 06 Plan 05: Documents, Compliance & Lease PDF Summary

**Document upload with magic byte validation, compliance reminder Edge Function via pg_cron, and client-side AST lease PDF generation with jsPDF**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-07T18:47:05Z
- **Completed:** 2026-03-07T19:12:05Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments
- Built document management service with CRUD operations, Storage upload, and expiry status tracking (green/amber/red indicators)
- Created AST lease PDF generation with jsPDF dynamic import, all 7 sections pre-filled from tenancy data, custom clauses support, and save-to-documents functionality
- Implemented compliance reminder Edge Function with pure logic extraction, duplicate prevention, error resilience, and pg_cron daily schedule at 9 AM UTC
- Created static compliance guide page with 8 UK landlord requirements and gov.uk links
- 54 new tests across 4 test files covering file validation, expiry status, lease PDF, and reminder logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Document service, API routes, and document UI** - `f7f07e0` (feat -- pre-existing from prior run)
2. **Task 2: Lease PDF generation and compliance guide** - `94dadc5` (feat)
3. **Task 3: Compliance reminder Edge Function and pg_cron schedule** - `d21d97e` (feat)

## Files Created/Modified
- `britv3.0/src/services/landlord/document-service.ts` - Document CRUD with getDocuments, createDocument, deleteDocument, getExpiringDocuments, uploadDocumentFile, getExpiryStatus
- `britv3.0/src/app/api/properties/[id]/documents/route.ts` - GET/POST API routes for property documents
- `britv3.0/src/app/api/documents/[id]/route.ts` - DELETE API route for individual documents
- `britv3.0/src/components/landlord/DocumentUpload.tsx` - Client component with file validation, compression, and upload
- `britv3.0/src/components/landlord/DocumentList.tsx` - Document table with expiry status indicators and delete
- `britv3.0/src/components/landlord/ComplianceAlert.tsx` - Amber banner for expiring compliance documents
- `britv3.0/src/components/landlord/LeasePreview.tsx` - Client component with jsPDF for AST lease PDF and save-to-documents
- `britv3.0/src/app/(protected)/dashboard/landlord/properties/[id]/documents/page.tsx` - Documents page
- `britv3.0/src/app/(protected)/dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease/page.tsx` - Lease generation page
- `britv3.0/src/app/(protected)/dashboard/landlord/compliance-guide/page.tsx` - Static UK compliance guide
- `britv3.0/src/lib/compliance-reminder-logic.ts` - Pure reminder logic (calculateReminderType, processDocument, processAllDocuments)
- `britv3.0/supabase/functions/compliance-reminders/index.ts` - Edge Function for daily compliance reminders
- `britv3.0/supabase/migrations/20260307_epic7_compliance_cron.sql` - pg_cron schedule for 9 AM UTC daily execution

## Decisions Made
- Extracted compliance reminder logic into a pure TypeScript module (`compliance-reminder-logic.ts`) so the same logic is testable with Vitest while the Edge Function inlines it for Deno runtime compatibility
- jsPDF dynamically imported only on the lease page via `await import("jspdf")` to avoid bundle size impact on all other pages
- Expiry status is a pure derived function (not stored in DB) -- consistent with the spec's approach of UI-derived statuses
- Duplicate notifications prevented by checking for existing notifications with the same document name, user, and link within a 24-hour window

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 1 files were already present in HEAD from a prior execution (committed as part of `f7f07e0`). Content was identical so no re-commit was needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All landlord tools (Plan 01-05) are now complete: schema, types, portfolio, tenancies, maintenance, financials, documents, compliance, and lease PDF
- Phase 6 is ready for verification
- 180 landlord tests passing across 13 test files

---
*Phase: 06-landlord-tools*
*Completed: 2026-03-07*
