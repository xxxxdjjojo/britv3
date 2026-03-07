# Phase 6: Landlord Tools - Research

**Researched:** 2026-03-07
**Domain:** Rental property management (portfolio, tenancies, maintenance, financials, compliance, PDF generation)
**Confidence:** HIGH

## Summary

Phase 6 implements a landlord property management suite within the existing Next.js App Router application. The epic spec (Epic 7) is extremely well-defined with a 4-table database schema, complete SQL migrations, RLS policies, storage bucket definitions, API routes, and component breakdown already specified. This phase is primarily a CRUD implementation phase -- no new third-party services are needed beyond two small client-side libraries (jsPDF for PDF generation, browser-image-compression for photo/receipt compression).

The phase depends on Phase 3 (Dashboards -- landlord dashboard shell, notification system) and Phase 4 (Marketplace -- contractor search for maintenance assignment). All integration is via simple URL linking (marketplace search) and existing notification APIs (compliance reminders). The schema is deliberately consolidated: 4 tables instead of 8, unified financial_entries for income/expenses, unified property_documents for documents/compliance. This simplicity is a feature, not a limitation.

**Primary recommendation:** Implement as 4-5 plans organized by domain: database/types, portfolio+tenancies, maintenance+contractor assignment, financials, documents+compliance+PDF. Each plan maps cleanly to 2-3 user stories from the epic spec.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LL-01 | Portfolio view of managed rental properties (reuses listings data) | Server Component with LEFT JOIN query across listings, tenancies, maintenance_requests, property_documents. No new portfolio table needed. |
| LL-02 | Tenant record storage (contact, lease terms, deposit info) | tenancies table with RLS on landlord_id. React Hook Form + Zod validation. GDPR-scoped by RLS. |
| LL-03 | Maintenance request logging with status tracking and photo uploads | maintenance_requests table with status enum state machine. Photos via Supabase Storage + browser-image-compression. |
| LL-04 | Simple contractor assignment via marketplace link (no auto-RFQ) | URL link to `/marketplace/search?category={cat}`. Simple UPDATE on maintenance_requests. Message via existing COM system. |
| LL-05 | Manual rent payment tracking (paid/partial/overdue derived in UI) | financial_entries with type='income', category='rent'. Status derived client-side from lease dates + frequency. No cron. |
| LL-06 | Manual expense logging with optional receipt upload | financial_entries with type='expense'. Receipts via Supabase Storage bucket. Client-side compression. |
| LL-07 | Per-property financial summary (income minus expenses via RPC function) | get_property_financial_summary() PostgreSQL function. Called via Supabase RPC. Cached 5min via React Query staleTime. |
| LL-08 | Document upload with expiry dates for compliance tracking | property_documents table with expiry_date, next_reminder_date. File validation via magic bytes (file-type or magic-bytes.js). |
| LL-09 | Automated compliance reminders (30-day, 7-day before expiry) | pg_cron + Supabase Edge Function calling get_documents_due_for_reminder(). Uses existing notification system from Phase 3. |
| LL-10 | Client-side lease agreement (AST) PDF generation via jspdf | jsPDF 4.x for client-side PDF. Single AST template. Pre-filled from tenancy + property data. Zero server cost. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, Server/Client Components | Project framework |
| React | 19.2.3 | UI rendering | Project framework |
| @supabase/supabase-js | ^2.98.0 | Database, Auth, Storage, RPC | Project BaaS |
| react-hook-form | ^7.71.2 | Form state management | Already installed, used in auth forms |
| @hookform/resolvers | ^5.2.2 | Zod resolver for RHF | Already installed |
| zod | ^4.3.6 | Schema validation | Already installed |
| sonner | ^2.0.7 | Toast notifications | Already installed |
| lucide-react | ^0.577.0 | Icons | Already installed |

### New Dependencies (Phase 6 specific)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jspdf | ^4.2.0 | Client-side PDF generation for AST lease | LL-10: Lease PDF generation |
| browser-image-compression | ^2.0.2 | Client-side image compression before upload | LL-03, LL-06, LL-08: Photo/receipt/document compression |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jspdf | @react-pdf/renderer | @react-pdf/renderer is more React-native (JSX syntax) but heavier bundle size (~500KB vs ~300KB). jspdf is simpler for a single template and matches the epic spec recommendation. |
| jspdf | html2pdf.js | html2pdf.js wraps jspdf + html2canvas. Adds html2canvas overhead. Since AST template is structured text, jspdf direct API is cleaner. |
| browser-image-compression | Canvas API manual | browser-image-compression handles edge cases (EXIF rotation, WebWorker offloading). Manual Canvas code would need to handle these. |
| file-type (server magic bytes) | magic-bytes.js | file-type is ESM-only (may complicate server-side usage). magic-bytes.js (1.13.0) works in both browser and Node. Either works -- epic spec mentions file-type but magic-bytes.js may be easier to integrate. Consider inline magic byte check for just PDF/JPG/PNG (only 3 types) to avoid a dependency entirely. |

**Installation:**
```bash
cd britv3.0 && pnpm add jspdf browser-image-compression
```

**Note on file-type validation:** For only 3 file types (PDF, JPG, PNG), a simple inline magic byte check is sufficient and avoids adding another dependency:
```typescript
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46],      // %PDF
  jpg: [0xFF, 0xD8, 0xFF],              // JPEG SOI
  png: [0x89, 0x50, 0x4E, 0x47],        // .PNG
} as const;
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── portfolio/route.ts                    # GET portfolio
│   │   ├── properties/[id]/
│   │   │   ├── tenancies/route.ts                # GET/POST tenancies
│   │   │   ├── maintenance/route.ts              # GET/POST maintenance
│   │   │   ├── financials/route.ts               # GET summary / POST entry
│   │   │   └── documents/route.ts                # GET/POST documents
│   │   ├── tenancies/[id]/route.ts               # PATCH tenancy
│   │   ├── maintenance/[id]/route.ts             # PATCH maintenance
│   │   └── documents/[id]/route.ts               # DELETE document
│   └── (protected)/
│       └── dashboard/
│           └── landlord/
│               ├── portfolio/page.tsx            # Portfolio grid
│               ├── properties/[id]/
│               │   ├── overview/page.tsx         # Property detail
│               │   ├── tenancies/page.tsx        # Tenancy list
│               │   ├── tenancies/[id]/page.tsx   # Tenancy detail
│               │   ├── tenancies/[id]/lease/page.tsx  # Lease PDF
│               │   ├── maintenance/page.tsx      # Maintenance list
│               │   ├── maintenance/new/page.tsx  # New maintenance request
│               │   ├── maintenance/[id]/page.tsx # Maintenance detail
│               │   ├── financials/page.tsx       # Financial summary + entries
│               │   └── documents/page.tsx        # Document list + upload
│               └── compliance-guide/page.tsx     # Static compliance info
├── components/
│   └── landlord/
│       ├── PortfolioGrid.tsx          # Server Component
│       ├── PropertyCard.tsx           # Server Component
│       ├── TenancyForm.tsx            # Client Component
│       ├── TenancyStatusBadge.tsx     # Server Component
│       ├── MaintenanceList.tsx        # Server Component
│       ├── MaintenanceForm.tsx        # Client Component (with photo upload)
│       ├── MaintenanceStatusBadge.tsx # Server Component
│       ├── ProviderAssignment.tsx     # Client Component
│       ├── FinancialEntryForm.tsx     # Client Component
│       ├── FinancialSummary.tsx       # Server Component
│       ├── RentStatusIndicator.tsx    # Client Component (derived status)
│       ├── DocumentUpload.tsx         # Client Component
│       ├── DocumentList.tsx           # Server Component
│       ├── ComplianceAlert.tsx        # Server Component
│       └── LeasePreview.tsx           # Client Component (jsPDF generation)
├── services/
│   └── landlord/
│       ├── portfolio-service.ts       # Portfolio queries
│       ├── tenancy-service.ts         # Tenancy CRUD
│       ├── maintenance-service.ts     # Maintenance CRUD
│       ├── financial-service.ts       # Financial entry + RPC summary
│       └── document-service.ts        # Document CRUD + storage
├── types/
│   └── landlord.ts                    # All landlord domain types
└── lib/
    ├── file-validation.ts             # Magic byte checks (PDF/JPG/PNG)
    └── image-compression.ts           # browser-image-compression wrapper
```

### Pattern 1: Server Component Data Fetching with RLS
**What:** Server Components fetch data directly via Supabase server client. RLS ensures authorization.
**When to use:** All read-only data display (portfolio grid, maintenance list, document list, financial summary).
**Example:**
```typescript
// Source: Epic spec + project conventions
import { createClient } from "@/lib/supabase/server";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("listings")
    .select(`
      *,
      tenancies!left(id, tenant_name, status, rent_amount, lease_end_date),
      maintenance_requests!left(id, status),
      property_documents!left(id, expiry_date, next_reminder_date)
    `)
    .eq("listing_type", "rental");
  // RLS ensures only this landlord's properties are returned
  return <PortfolioGrid properties={properties} />;
}
```

### Pattern 2: Client Component Forms with React Hook Form + Zod
**What:** All mutation forms use RHF + Zod with the resolver already installed.
**When to use:** TenancyForm, MaintenanceForm, FinancialEntryForm, DocumentUpload.
**Example:**
```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const tenancySchema = z.object({
  tenant_name: z.string().min(1, "Tenant name is required"),
  lease_start_date: z.string().date(),
  rent_amount: z.number().positive("Rent must be positive"),
  // ... etc
});

type TenancyFormData = z.infer<typeof tenancySchema>;
```

### Pattern 3: Supabase Storage Upload with Client-Side Compression
**What:** Compress images client-side before uploading to Supabase Storage buckets.
**When to use:** Maintenance photos, expense receipts, document images.
**Example:**
```typescript
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

async function uploadPhoto(file: File, propertyId: string, requestId: string) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  const supabase = createClient();
  const path = `${propertyId}/${requestId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from("maintenance-photos")
    .upload(path, compressed);
  return data;
}
```

### Pattern 4: RPC Function Calls for Financial Summary
**What:** Call PostgreSQL functions via Supabase RPC to avoid complex client-side aggregation.
**When to use:** Financial summary (get_property_financial_summary).
**Example:**
```typescript
const { data } = await supabase.rpc("get_property_financial_summary", {
  p_property_id: propertyId,
  p_start_date: startDate,
  p_end_date: endDate,
});
// Returns: { total_income, total_expenses, net_income, entry_count }
```

### Pattern 5: Derived Status in UI (Rent Payment Status)
**What:** Payment status (paid/partial/overdue) is calculated client-side, not stored in DB.
**When to use:** Rent payment tracking (LL-05).
**Why:** Avoids cron jobs generating scheduled records. Keeps schema simple.
**Example:**
```typescript
function getRentStatus(
  tenancy: Tenancy,
  payments: FinancialEntry[]
): "paid" | "partial" | "overdue" | "not_due" {
  const currentPeriodStart = calculateCurrentPeriodStart(
    tenancy.lease_start_date,
    tenancy.rent_frequency
  );
  const periodPayments = payments.filter(
    (p) => p.category === "rent" && p.entry_date >= currentPeriodStart
  );
  const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0);
  if (totalPaid >= tenancy.rent_amount) return "paid";
  if (totalPaid > 0) return "partial";
  if (new Date() > currentPeriodStart) return "overdue";
  return "not_due";
}
```

### Anti-Patterns to Avoid
- **Storing derived rent status in DB:** The spec explicitly says status is derived in the UI. Do not add a payment_status column that needs cron-based updates.
- **Auto-creating RFQs from maintenance requests:** LL-04 says "no auto-RFQ." It is a simple link to marketplace search.
- **Building a template selection system for leases:** ONE template only (standard AST). No template CRUD.
- **Server-side PDF generation:** No Puppeteer, no headless browser. jsPDF runs entirely client-side.
- **Real-time financial data:** Financial entries are manually entered. 5-minute stale time in React Query is more than adequate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Canvas API resize + quality loop | browser-image-compression | Handles EXIF rotation, WebWorker offloading, binary search for target size |
| PDF generation | Server-side Puppeteer/Chrome | jsPDF client-side | Zero server cost, no headless browser infrastructure |
| File type validation | Extension-only check | Magic byte validation (inline or library) | Extensions can be faked; magic bytes are reliable |
| Financial aggregation | Client-side SUM across all entries | PostgreSQL RPC function | Server-side aggregation is faster and avoids transferring all rows |
| Reminder scheduling | Custom Node.js cron service | Supabase pg_cron + Edge Function | Built into Supabase, no additional infrastructure |

## Common Pitfalls

### Pitfall 1: Portfolio Query N+1
**What goes wrong:** Fetching properties, then separately fetching tenancies, maintenance counts, and document expiry for each property.
**Why it happens:** Natural to query each table separately.
**How to avoid:** Single query with LEFT JOINs. The epic spec explicitly calls this out -- "No new database table is created -- this is a query across listings, tenancies, maintenance_requests, and property_documents."
**Warning signs:** Multiple sequential Supabase queries in portfolio page, slow load times.

### Pitfall 2: Rent Period Calculation Edge Cases
**What goes wrong:** Off-by-one errors in calculating rent due dates from lease_start_date + frequency.
**Why it happens:** Monthly frequency is not exactly 30 days. Weekly is simpler but still has edge cases around year boundaries.
**How to avoid:** Use proper date arithmetic. For monthly: add N months to lease_start_date. For weekly: add N * 7 days. Use a well-tested utility function. Test with edge cases: Feb 29, lease starting Jan 31, etc.
**Warning signs:** Wrong "overdue" indicators, payments showing in wrong periods.

### Pitfall 3: Storage Bucket RLS Complexity
**What goes wrong:** Storage RLS policies use subqueries on listings/properties tables. If those tables don't exist yet or have different column names, policies silently fail.
**Why it happens:** Storage RLS depends on application tables being present.
**How to avoid:** Ensure the migration creates storage buckets and policies AFTER the application tables exist. Verify with integration tests that upload/read/delete works for owners and fails for non-owners.
**Warning signs:** 403 errors on file upload, files accessible to wrong users.

### Pitfall 4: File Size Validation Gap
**What goes wrong:** Client-side size check passes but server rejects, or vice versa.
**Why it happens:** Compression changes file size. Client checks pre-compression size but uploads compressed version.
**How to avoid:** Check file size AFTER compression but BEFORE upload. Also enforce via Storage bucket file_size_limit config.
**Warning signs:** Uploads failing silently, oversized files in storage.

### Pitfall 5: Compliance Reminder Double-Firing
**What goes wrong:** Cron job runs twice in quick succession, sending duplicate reminders.
**Why it happens:** pg_cron scheduling overlap, Edge Function timeout retry.
**How to avoid:** The schema handles this with `reminder_sent = TRUE` flag + `next_reminder_date` update. Ensure the cron function marks documents as sent BEFORE sending notifications (or within a transaction).
**Warning signs:** Users receiving duplicate reminder notifications.

### Pitfall 6: jsPDF Bundle Size Impact
**What goes wrong:** jsPDF (~300KB) loaded on every page, increasing initial bundle.
**Why it happens:** Static import at top level.
**How to avoid:** Dynamic import (`const { jsPDF } = await import("jspdf")`) only on the lease preview page. Next.js code splits automatically with dynamic imports.
**Warning signs:** Increased bundle size reported in build output, slow page loads on unrelated pages.

## Code Examples

### AST Lease PDF Generation with jsPDF
```typescript
// Source: jsPDF docs + epic spec E07-S10
"use client";
import type { Tenancy } from "@/types/landlord";

async function generateLeasePDF(tenancy: Tenancy, propertyAddress: string, landlordName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text("Assured Shorthold Tenancy Agreement", 105, 20, { align: "center" });

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "This template is for guidance only. Seek legal advice before use.",
    105, 30, { align: "center" }
  );

  // Parties
  doc.setFontSize(12);
  doc.setTextColor(0);
  let y = 45;
  doc.text("1. PARTIES", 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Landlord: ${landlordName}`, 25, y);
  y += 6;
  doc.text(`Tenant: ${tenancy.tenant_name}`, 25, y);
  y += 6;
  doc.text(`Property: ${propertyAddress}`, 25, y);

  // Terms
  y += 12;
  doc.setFontSize(12);
  doc.text("2. TERM", 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Start Date: ${tenancy.lease_start_date}`, 25, y);
  y += 6;
  if (tenancy.lease_end_date) {
    doc.text(`End Date: ${tenancy.lease_end_date}`, 25, y);
    y += 6;
  }

  // Rent
  y += 6;
  doc.setFontSize(12);
  doc.text("3. RENT", 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Amount: GBP ${tenancy.rent_amount} ${tenancy.rent_frequency}`, 25, y);

  // ... additional clauses

  doc.save(`lease-${tenancy.id}.pdf`);
}
```

### Magic Byte File Validation (Inline)
```typescript
// Source: Wikipedia file signatures + epic spec E07-S08
const ALLOWED_SIGNATURES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
};

export async function validateFileType(
  file: File
): Promise<{ valid: boolean; mimeType: string | null }> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [mime, signatures] of Object.entries(ALLOWED_SIGNATURES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => bytes[i] === byte)) {
        return { valid: true, mimeType: mime };
      }
    }
  }
  return { valid: false, mimeType: null };
}
```

### Compliance Reminder Cron Setup
```sql
-- Source: Supabase docs + epic spec E07-S09
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily compliance check at 9 AM UTC
SELECT cron.schedule(
  'compliance-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/compliance-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side PDF (Puppeteer) | Client-side jsPDF | Ongoing trend | Zero server cost, no Chrome dependency |
| Separate income/expense tables | Unified financial_entries | This spec design | 50% fewer tables, policies, indexes |
| Stored payment status column | UI-derived status | This spec design | No cron jobs, no stale data |
| Separate compliance_items table | Expiry fields on property_documents | This spec design | Eliminated an entire table |
| Individual reminder emails | Batched digest emails | This spec design | 70% less email volume |

## Open Questions

1. **Properties/Listings table relationship**
   - What we know: The epic spec references both `properties` and `listings` tables with FK relationships. The schema uses `properties(id)` for FKs and `listings.user_id` for ownership.
   - What's unclear: The exact schema of `properties` and `listings` tables depends on Phase 2 implementation. Column names and relationships may differ from what the epic spec assumes.
   - Recommendation: The migration should be written to match whatever schema Phase 2 creates. If Phase 2 uses a single `properties` table (common in simpler designs), adjust FKs accordingly. Flag this as a dependency check before Phase 6 execution.

2. **Notification system API from Phase 3**
   - What we know: Compliance reminders (LL-09) depend on the notification system built in Phase 3 (COM-10).
   - What's unclear: The exact API for creating in-app notifications programmatically.
   - Recommendation: The cron Edge Function will need to INSERT into whatever notifications table Phase 3 creates. Document the dependency and adapt.

3. **Marketplace search URL structure from Phase 4**
   - What we know: LL-04 links to marketplace search with category filter.
   - What's unclear: Exact URL path and query parameter names.
   - Recommendation: Use a simple link pattern `/marketplace/search?category={cat}` and adjust to match Phase 4's actual implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + happy-dom |
| Config file | `britv3.0/vitest.config.mts` |
| Quick run command | `pnpm test:run --reporter=verbose` |
| Full suite command | `pnpm test:run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LL-01 | Portfolio view fetches properties with summary data | unit | `pnpm test:run src/__tests__/landlord/portfolio.test.ts -x` | No -- Wave 0 |
| LL-02 | Tenancy form validates required fields, creates record | unit | `pnpm test:run src/__tests__/landlord/tenancy-form.test.ts -x` | No -- Wave 0 |
| LL-03 | Maintenance form validates, handles photo upload flow | unit | `pnpm test:run src/__tests__/landlord/maintenance.test.ts -x` | No -- Wave 0 |
| LL-04 | Provider assignment updates maintenance request | unit | `pnpm test:run src/__tests__/landlord/provider-assignment.test.ts -x` | No -- Wave 0 |
| LL-05 | Rent status derived correctly (paid/partial/overdue/not_due) | unit | `pnpm test:run src/__tests__/landlord/rent-status.test.ts -x` | No -- Wave 0 |
| LL-06 | Expense form validates, handles receipt upload | unit | `pnpm test:run src/__tests__/landlord/expense.test.ts -x` | No -- Wave 0 |
| LL-07 | Financial summary displays RPC results with period selection | unit | `pnpm test:run src/__tests__/landlord/financial-summary.test.ts -x` | No -- Wave 0 |
| LL-08 | Document upload validates file type via magic bytes | unit | `pnpm test:run src/__tests__/landlord/document-upload.test.ts -x` | No -- Wave 0 |
| LL-09 | Reminder date calculated correctly (expiry - 30 days) | unit | `pnpm test:run src/__tests__/landlord/compliance-reminders.test.ts -x` | No -- Wave 0 |
| LL-10 | Lease PDF generates with correct pre-filled data | unit | `pnpm test:run src/__tests__/landlord/lease-pdf.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test:run src/__tests__/landlord/ --reporter=verbose`
- **Per wave merge:** `pnpm test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/landlord/` directory -- all test files listed above
- [ ] Zod schema tests for all 4 entity types (tenancy, maintenance, financial entry, document)
- [ ] Rent period calculation utility tests (edge cases: Feb 29, month-end, weekly vs monthly)
- [ ] File validation utility tests (magic byte checks for PDF, JPG, PNG + rejection of other types)

## Sources

### Primary (HIGH confidence)
- Epic 7 spec (`docs/epic7final.md`) -- complete schema, API routes, components, storage buckets, RLS policies
- Project `package.json` -- verified existing dependencies (react-hook-form, zod, @hookform/resolvers, @supabase/supabase-js)
- Project `vitest.config.mts` -- verified test framework setup

### Secondary (MEDIUM confidence)
- [jsPDF npm](https://www.npmjs.com/package/jspdf) -- v4.2.0 confirmed, client-side PDF generation
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) -- v2.x confirmed, client-side compression
- [Supabase Cron docs](https://supabase.com/docs/guides/cron) -- pg_cron + pg_net for scheduled Edge Functions
- [Supabase pg_cron extension docs](https://supabase.com/docs/guides/database/extensions/pg_cron) -- scheduling syntax

### Tertiary (LOW confidence)
- None -- all findings verified against official sources or epic spec

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already installed; only jspdf and browser-image-compression are new (both well-established)
- Architecture: HIGH -- epic spec provides complete schema, API routes, component breakdown, storage setup
- Pitfalls: HIGH -- derived from spec constraints and common Supabase/Next.js patterns
- Integration dependencies: MEDIUM -- exact API shapes from Phase 3 (notifications) and Phase 4 (marketplace search) are not yet implemented

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no rapidly changing dependencies)
