# Epic 7: Property Management Tools (Landlords & Agents) -- Final Spec

**Epic Number:** E07
**Date Created:** May 13, 2025
**Last Updated:** March 7, 2026 (Cost-Optimized Rewrite)
**Target Release:** Phase 6
**Depends On:** Phase 1 (Auth), Phase 2 (Listings), Phase 3 (Dashboards), Phase 4 (Marketplace), Phase 5 (Communication)

---

## 1. Description

A suite of tools for Landlords and Estate Agents to manage rental property portfolios. Covers tenant records, maintenance tracking, basic financial logging, document storage with compliance reminders, and integration with the existing marketplace for contractor assignment.

This spec is deliberately restrained. Advanced features (automated rent collection, bank imports, tenant screening, financial reporting, e-signatures) are future premium features -- not MVP freebies.

---

## 2. Goals

1. Give Landlords/Agents a centralized view of their rental properties and tenants.
2. Enable maintenance issue logging with simple contractor assignment via the existing marketplace.
3. Provide manual rent and expense tracking per property.
4. Store compliance documents with automated expiry reminders.
5. Keep infrastructure cost under $250/mo at 100K landlords.

---

## 3. Scope

### In Scope

- Portfolio view of managed rental properties (reuses existing listings data)
- Tenant record storage (contact, lease terms, deposit info)
- Maintenance request logging and status tracking
- Simple contractor assignment (link to marketplace, not auto-RFQ)
- Manual rent payment tracking (paid/partial/overdue)
- Manual expense logging with optional receipt upload
- Basic per-property financial summary (income minus expenses)
- Document upload with expiry dates and compliance reminders
- Client-side lease agreement PDF generation from a single AST template

### Out of Scope (Future Premium Features)

- Automated rent collection via payment gateway
- Bank statement import or reconciliation
- Automated tenant screening or referencing
- Application pipeline with status tracking (use messaging for MVP)
- Late payment interest calculation
- Tenant-facing rent statements
- Integration with accounting software (Xero, QuickBooks)
- E-signature integration (Phase 8)
- Automated RFQ creation from maintenance requests
- Multiple lease agreement templates
- Inspection scheduling tools
- Tenant portal (tenants use messaging from Epic 5)

---

## 4. Database Schema

### Design Principles

- **4 tables, not 8.** Consolidated schema reduces RLS policies, indexes, triggers, and test surface by 50%.
- **No new linking table for portfolios.** A managed property is a listing owned by the user -- reuse `listings` with a `management_status` column.
- **Single financial table.** Income and expenses in one `financial_entries` table with a `type` enum.
- **Documents and compliance unified.** One `property_documents` table handles both general documents and compliance certificates.

### Migration: `supabase/migrations/YYYYMMDD_epic7_property_management.sql`

```sql
-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE tenancy_status AS ENUM ('active', 'ending_soon', 'ended', 'terminated');

CREATE TYPE maintenance_status AS ENUM (
  'new',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'closed'
);

CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'emergency');

CREATE TYPE financial_entry_type AS ENUM ('income', 'expense');

CREATE TYPE document_category AS ENUM (
  'gas_safety',
  'electrical_eicr',
  'epc',
  'insurance',
  'lease_agreement',
  'inventory',
  'inspection_report',
  'receipt',
  'other'
);

-- ============================================================================
-- TABLE 1: tenancies
-- ============================================================================

CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tenant info (may or may not be a Britestate user)
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  tenant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Lease terms
  status tenancy_status DEFAULT 'active',
  lease_start_date DATE NOT NULL,
  lease_end_date DATE,
  rent_amount NUMERIC(10,2) NOT NULL CHECK (rent_amount > 0),
  rent_frequency TEXT DEFAULT 'monthly' CHECK (rent_frequency IN ('weekly', 'monthly')),
  deposit_amount NUMERIC(10,2),
  deposit_scheme TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_lease_dates CHECK (
    lease_end_date IS NULL OR lease_end_date > lease_start_date
  ),
  CONSTRAINT valid_tenant_email CHECK (
    tenant_email IS NULL OR tenant_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- ============================================================================
-- TABLE 2: maintenance_requests
-- ============================================================================

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES auth.users(id),

  -- Issue details
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 2000),
  priority maintenance_priority DEFAULT 'medium',
  status maintenance_status DEFAULT 'new',

  -- Assignment (simple link, no marketplace sync)
  assigned_provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_provider_name TEXT,

  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- Photos (stored as array of Supabase Storage paths)
  photo_urls TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: financial_entries (income + expenses unified)
-- ============================================================================

CREATE TABLE financial_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entry details
  type financial_entry_type NOT NULL,
  category TEXT NOT NULL,
  -- Income categories: 'rent', 'deposit', 'other_income'
  -- Expense categories: 'maintenance', 'insurance', 'service_charge',
  --                     'ground_rent', 'mortgage', 'management_fee', 'other_expense'

  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,

  -- Receipt (optional, Supabase Storage path)
  receipt_url TEXT,

  -- For rent tracking specifically
  rent_period_start DATE,
  rent_period_end DATE,
  payment_status TEXT CHECK (
    payment_status IS NULL OR payment_status IN ('paid', 'partial', 'overdue')
  ),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: property_documents (documents + compliance unified)
-- ============================================================================

CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document info
  name TEXT NOT NULL,
  category document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER CHECK (file_size > 0 AND file_size <= 2097152), -- 2MB max

  -- Compliance tracking
  expiry_date DATE,
  next_reminder_date DATE, -- Pre-calculated: expiry_date - 30 days
  reminder_sent BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_reminder_date CHECK (
    next_reminder_date IS NULL OR next_reminder_date <= expiry_date
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tenancies
CREATE INDEX idx_tenancies_property ON tenancies(property_id) WHERE status = 'active';
CREATE INDEX idx_tenancies_landlord ON tenancies(landlord_id);
CREATE INDEX idx_tenancies_lease_end ON tenancies(lease_end_date) WHERE status = 'active';

-- Maintenance
CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(property_id, status)
  WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_maintenance_reported_by ON maintenance_requests(reported_by);

-- Financial entries
CREATE INDEX idx_financial_property ON financial_entries(property_id, entry_date DESC);
CREATE INDEX idx_financial_type ON financial_entries(property_id, type, entry_date DESC);
CREATE INDEX idx_financial_user ON financial_entries(user_id);

-- Documents
CREATE INDEX idx_documents_property ON property_documents(property_id);
CREATE INDEX idx_documents_reminder ON property_documents(next_reminder_date)
  WHERE next_reminder_date IS NOT NULL AND reminder_sent = FALSE;
CREATE INDEX idx_documents_expiry ON property_documents(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER set_tenancies_updated_at
  BEFORE UPDATE ON tenancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_maintenance_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate next_reminder_date when expiry_date is set
CREATE OR REPLACE FUNCTION calculate_reminder_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    NEW.next_reminder_date := NEW.expiry_date - INTERVAL '30 days';
    NEW.reminder_sent := FALSE;
  ELSE
    NEW.next_reminder_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reminder_date
  BEFORE INSERT OR UPDATE OF expiry_date ON property_documents
  FOR EACH ROW EXECUTE FUNCTION calculate_reminder_date();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- Tenancies: landlord manages own tenancies
CREATE POLICY "Landlords manage own tenancies"
  ON tenancies FOR ALL TO authenticated
  USING (landlord_id = auth.uid());

-- Maintenance: property owner or reporter can access
CREATE POLICY "Property owners manage maintenance"
  ON maintenance_requests FOR ALL TO authenticated
  USING (
    reported_by = auth.uid()
    OR property_id IN (
      SELECT property_id FROM listings WHERE user_id = auth.uid()
    )
  );

-- Financial entries: user manages own entries
CREATE POLICY "Users manage own financial entries"
  ON financial_entries FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Documents: uploader and property owner can access
CREATE POLICY "Property owners manage documents"
  ON property_documents FOR ALL TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR property_id IN (
      SELECT property_id FROM listings WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Property financial summary (avoids repeated SUM queries)
CREATE OR REPLACE FUNCTION get_property_financial_summary(
  p_property_id UUID,
  p_start_date DATE DEFAULT DATE_TRUNC('year', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_income NUMERIC,
  total_expenses NUMERIC,
  net_income NUMERIC,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_income,
    COUNT(*) AS entry_count
  FROM financial_entries
  WHERE property_id = p_property_id
    AND entry_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get documents due for reminder (used by cron job)
CREATE OR REPLACE FUNCTION get_documents_due_for_reminder()
RETURNS TABLE (
  document_id UUID,
  property_id UUID,
  uploaded_by UUID,
  document_name TEXT,
  category document_category,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.property_id,
    pd.uploaded_by,
    pd.name,
    pd.category,
    pd.expiry_date,
    (pd.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry
  FROM property_documents pd
  WHERE pd.next_reminder_date <= CURRENT_DATE
    AND pd.reminder_sent = FALSE
    AND pd.expiry_date > CURRENT_DATE
  ORDER BY pd.expiry_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Why This Schema Works

| Original Proposal | This Schema | Benefit |
|-------------------|-------------|---------|
| `landlord_portfolios` linking table | Reuse `listings.user_id` | No new table, existing queries work |
| `tenancies` | `tenancies` | Kept -- genuinely new data |
| `maintenance_requests` | `maintenance_requests` | Kept -- core feature |
| `rental_payments` | Merged into `financial_entries` | One table, one set of policies |
| `property_expenses` | Merged into `financial_entries` | One table, one set of policies |
| `property_documents` | `property_documents` with compliance fields | Unified documents + compliance |
| `compliance_items` | Eliminated -- expiry tracking on documents | No separate table needed |
| Separate `application_status` table | Eliminated -- use messaging (Epic 5) | Defer to post-MVP |

**Result:** 4 tables instead of 8. 4 RLS policies instead of 8+. 10 indexes instead of 20+.

---

## 5. User Stories & Acceptance Criteria

### E07-S01: Portfolio View

**As a** Landlord/Agent, **I want to** see all my managed rental properties in one view, **so I can** monitor their status at a glance.

**Acceptance Criteria:**
1. A "Portfolio" tab on the landlord/agent dashboard shows all properties where the user is the listing owner (`listings.user_id = current_user`).
2. Each property card displays: address, tenancy status (Vacant/Occupied), current tenant name, rent amount, lease end date, count of open maintenance requests.
3. Properties with expiring compliance documents (within 30 days) show a warning indicator.
4. Clicking a property navigates to its management detail page.
5. No new database table is created -- this is a query across `listings`, `tenancies`, `maintenance_requests`, and `property_documents`.

**Implementation Notes:**
- Server Component fetching via Supabase server client.
- Single query with LEFT JOINs to tenancies (active), maintenance (open count), and documents (expiring count).
- Cache the dashboard query result for 5 minutes via `revalidate` or Upstash Redis if needed at scale.

---

### E07-S02: Tenant Records

**As a** Landlord/Agent, **I want to** store tenant details and lease terms for each property, **so I have** all tenancy information in one place.

**Acceptance Criteria:**
1. From a property's management page, user can create a new tenancy record.
2. Required fields: tenant name, lease start date, rent amount.
3. Optional fields: tenant email, phone, tenant's Britestate user ID (for linking), lease end date, rent frequency, deposit amount, deposit scheme, notes.
4. Active tenancy is displayed on the property card in the portfolio view.
5. User can mark a tenancy as "ended" which sets status and clears it from the active view.
6. Past tenancies are viewable in a "History" section.
7. GDPR: tenant PII is only accessible to the landlord who created the record (enforced by RLS).
8. Validation: email format check, lease end date must be after start date, rent amount must be positive.

**Implementation Notes:**
- Simple form using React Hook Form + Zod validation.
- `tenancies` table with RLS policy `landlord_id = auth.uid()`.
- No tenant screening, no application pipeline, no automated communication.

---

### E07-S03: Maintenance Request Logging

**As a** Landlord/Agent, **I want to** log and track maintenance issues for my properties, **so I can** manage repairs efficiently.

**Acceptance Criteria:**
1. From a property's management page, user can create a maintenance request.
2. Required fields: title, description, priority (Low/Medium/High/Emergency).
3. Optional: up to 3 photos (max 1MB each, compressed client-side before upload).
4. Requests display in a list view, filterable by status and priority.
5. Status can be updated: New -> Acknowledged -> Assigned -> In Progress -> Resolved -> Closed.
6. Resolution requires: resolution notes and sets `resolved_at` timestamp.
7. Open request count shows on the portfolio property card.

**Implementation Notes:**
- Photos uploaded to Supabase Storage bucket `maintenance-photos` with path `{property_id}/{request_id}/`.
- Client-side image compression to target 500KB before upload (use browser Canvas API or a lightweight library like `browser-image-compression`).
- RLS: accessible to property owner (via listings) or the user who reported it.

---

### E07-S04: Contractor Assignment (Marketplace Integration)

**As a** Landlord/Agent, **I want to** assign a maintenance job to a provider from the marketplace, **so I can** get issues resolved by verified professionals.

**Acceptance Criteria:**
1. From a maintenance request, a "Find Provider" button opens the marketplace search (Epic 4) pre-filtered by the relevant service category.
2. User selects a provider and confirms assignment.
3. Assignment stores `assigned_provider_id` and `assigned_provider_name` on the maintenance request and sets status to "Assigned."
4. A message is sent to the provider via the messaging system (Epic 5) with the maintenance details.
5. No RFQ is auto-created. No marketplace job record is created. No status sync between systems.
6. The landlord manually updates the maintenance request status as work progresses.

**Implementation Notes:**
- "Find Provider" links to `/marketplace/search?category={relevant_category}&property_id={id}` -- reuses existing marketplace search UI.
- Assignment is a simple UPDATE on `maintenance_requests` setting the provider fields.
- Message creation uses the existing messaging API from Epic 5.
- **No event listeners, no webhooks, no dual-state management.**

---

### E07-S05: Rent Payment Tracking

**As a** Landlord/Agent, **I want to** manually log rent payments and see which are overdue, **so I can** monitor my rental income.

**Acceptance Criteria:**
1. From a tenancy record, user can log a rent payment: date, amount.
2. Payment is stored as a `financial_entries` row with `type = 'income'`, `category = 'rent'`.
3. Payment status is derived in the UI, not stored separately:
   - If a payment exists for the current period: "Paid" (green).
   - If the amount is less than the expected rent: "Partial" (amber).
   - If no payment exists and rent due date has passed: "Overdue" (red).
4. Rent due dates are calculated in the UI from lease start date + frequency. No cron job generates scheduled records.
5. A simple payment history list shows all logged payments for the tenancy, sorted by date.
6. No automated reminders to tenants. No late payment interest. No PDF statements.

**Implementation Notes:**
- Expected rent dates calculated client-side: `lease_start_date + (n * frequency)` where frequency is 7 or 30 days.
- Payment status is a UI concern, not a database column. The query is: "Is there a financial_entry of type 'income' category 'rent' for this tenancy in the current period?"
- Keep it dead simple. This is a manual ledger, not an accounting system.

---

### E07-S06: Expense Logging

**As a** Landlord/Agent, **I want to** log property expenses with optional receipts, **so I can** track my outgoings per property.

**Acceptance Criteria:**
1. From a property's management page, user can log an expense.
2. Required fields: date, category (Maintenance, Insurance, Service Charge, Ground Rent, Mortgage, Management Fee, Other), amount.
3. Optional fields: description, receipt upload (PDF or image, max 2MB).
4. Expenses are listed per property with date, category, amount, and receipt link.
5. Basic filtering by date range and category.
6. Receipts stored in Supabase Storage bucket `expense-receipts` with path `{property_id}/{entry_id}/`.

**Implementation Notes:**
- Same `financial_entries` table with `type = 'expense'`.
- Receipt images compressed client-side before upload (target 500KB).
- No accounting integration, no tax calculations, no automated categorization.

---

### E07-S07: Financial Summary

**As a** Landlord/Agent, **I want to** see a simple income vs. expenses overview per property, **so I can** understand basic financial performance.

**Acceptance Criteria:**
1. Each property's management page shows a financial summary section.
2. Displays: total income, total expenses, and net income for a selectable period (This Month, This Quarter, Year to Date, Last 12 Months).
3. Uses the `get_property_financial_summary` database function to avoid repeated aggregation queries.
4. No charts, no graphs, no trend analysis. Plain numbers in a clean layout.
5. Does not include: yield calculation, ROI, capital appreciation, tax implications.

**Implementation Notes:**
- Call the RPC function `get_property_financial_summary(property_id, start_date, end_date)`.
- Cache result for 5 minutes on the client (React Query stale time) -- landlords don't need real-time financial data from manually entered records.
- If dashboard load times become a concern at scale, add a `property_financial_cache` table updated via trigger on INSERT to `financial_entries`. Defer this optimization until metrics show it's needed.

---

### E07-S08: Document Upload & Storage

**As a** Landlord/Agent, **I want to** upload and organize important documents per property, **so they are** accessible and linked to the right property/tenancy.

**Acceptance Criteria:**
1. Each property's management page has a "Documents" tab.
2. User can upload documents with: name, category (Gas Safety, Electrical EICR, EPC, Insurance, Lease Agreement, Inventory, Inspection Report, Receipt, Other), and optional expiry date.
3. File constraints: max 2MB, allowed types: PDF, JPG, PNG.
4. File type is validated server-side (magic bytes check using `file-type` library), not just by extension.
5. Documents are listed with name, category, upload date, expiry date (if set), and expiry status indicator (green = valid, amber = expiring within 30 days, red = expired).
6. Users can download or delete their uploaded documents.
7. Documents can optionally be linked to a specific tenancy.

**Implementation Notes:**
- Supabase Storage bucket `property-documents` with path `{property_id}/{document_id}/`.
- RLS on storage: only the uploader and property owner can access.
- **File size limit enforced both client-side (pre-upload check) and server-side (API validation).**
- No virus scanning at MVP (see Epic 4 cost audit -- file-type validation + restricted types is sufficient). Add scanning when upload volume justifies the cost.
- Images compressed client-side before upload. PDFs accepted as-is (most compliance certificates are already optimized).
- **Retention policy:** Display a notice that documents older than 7 years may be archived. Implement archival cron job post-MVP.

---

### E07-S09: Compliance Reminders

**As a** Landlord/Agent, **I want to** receive reminders before compliance documents expire, **so I can** stay legally compliant.

**Acceptance Criteria:**
1. When a document is uploaded with an expiry date, the system pre-calculates `next_reminder_date` as expiry minus 30 days (via database trigger -- already defined in schema).
2. A daily cron job (pg_cron or Supabase Edge Function, scheduled at 9 AM UK time) queries `get_documents_due_for_reminder()` -- this uses the indexed `next_reminder_date` column, scanning only documents due today, not the entire table.
3. For each due document:
   - Create an in-app notification (using Epic 5 notification system).
   - Mark `reminder_sent = TRUE` on the document.
   - Update `next_reminder_date` to expiry minus 7 days (second reminder).
4. After the second reminder fires, set `next_reminder_date = NULL` (no more reminders).
5. **Email notifications:** Only sent if the user hasn't acknowledged the in-app notification within 3 days. Not on every reminder.
6. The portfolio dashboard highlights properties with expiring documents (within 30 days) using a warning badge.
7. Uploading a new document in the same category for the same property resets the reminder cycle.

**Implementation Notes:**
- Cron job is a simple Supabase Edge Function or pg_cron calling `get_documents_due_for_reminder()`.
- **O(reminders due today)** query cost, not O(all documents). At 100K landlords with ~500K documents, only ~50-100 reminders fire per day.
- In-app notification uses the existing notification system from Epic 5 -- no new notification infrastructure.
- Email fallback: a second cron job runs 3 days later, checks for unacknowledged reminders, batches them into a single digest email per user. One email, not one per document.
- **Do not send individual emails per document.** Batch: "You have 3 documents expiring soon: Gas Safety at 123 Main St (expires April 15), EPC at 45 Oak Rd (expires April 22)..."

---

### E07-S10: Lease Agreement PDF Generation

**As a** Landlord/Agent, **I want to** generate a basic AST lease agreement pre-filled with property and tenant details, **so I can** streamline tenant onboarding.

**Acceptance Criteria:**
1. From a tenancy record, a "Generate Lease" button opens a preview page.
2. The template is a standard Assured Shorthold Tenancy (AST) agreement.
3. Pre-filled fields: landlord name, tenant name(s), property address, rent amount, rent frequency, lease start/end dates, deposit amount and scheme.
4. User can add custom clauses via a text input (appended to the agreement).
5. A "Download PDF" button generates the PDF **client-side** in the browser.
6. The generated PDF can be saved to the property's documents (E07-S08) with category "Lease Agreement."
7. A prominent disclaimer states: "This template is for guidance only. Seek legal advice before use."

**Implementation Notes:**
- Use `jspdf` or `html2pdf.js` for client-side PDF generation. **Zero server cost.**
- The template is a static HTML/React component styled for print. No Puppeteer, no server-side rendering, no headless browser.
- ONE template only (standard AST). Don't build a template selection system.
- Template content based on the UK government's model tenancy agreement (publicly available).
- No e-signature integration (that's Epic 8).

---

## 6. Compliance Checklist (Static Content)

A static page/section listing common UK rental compliance requirements. This is informational content, not a dynamic feature.

**Content:**
- Gas Safety Certificate (annual, by Gas Safe registered engineer)
- Electrical Installation Condition Report (EICR, every 5 years)
- Energy Performance Certificate (EPC, minimum rating E, valid 10 years)
- Deposit protection (within 30 days, government-approved scheme)
- Right to Rent checks (before tenancy starts)
- Smoke and carbon monoxide alarms (required on every floor)
- Landlord licensing (if applicable to local authority area)
- How to Rent guide (must be provided to tenants)

**Implementation:** A static page at `/dashboard/landlord/compliance-guide` with links to official government sources (gov.uk). No database, no dynamic content.

---

## 7. Supabase Storage Buckets

```sql
-- Create storage buckets for Epic 7
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('maintenance-photos', 'maintenance-photos', false, 1048576),    -- 1MB limit
  ('expense-receipts', 'expense-receipts', false, 2097152),        -- 2MB limit
  ('property-documents', 'property-documents', false, 2097152);    -- 2MB limit

-- RLS: Users can upload to their own properties
CREATE POLICY "Users upload to own property folders"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('maintenance-photos', 'expense-receipts', 'property-documents')
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = auth.uid()
  )
);

-- RLS: Users can read their own uploads
CREATE POLICY "Users read own property files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('maintenance-photos', 'expense-receipts', 'property-documents')
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = auth.uid()
  )
);

-- RLS: Users can delete their own uploads
CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('maintenance-photos', 'expense-receipts', 'property-documents')
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = auth.uid()
  )
);
```

---

## 8. API Routes

All routes under `app/api/` using Next.js App Router route handlers.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/portfolio` | List user's managed properties with summary data |
| GET | `/api/properties/[id]/tenancies` | List tenancies for a property |
| POST | `/api/properties/[id]/tenancies` | Create tenancy |
| PATCH | `/api/tenancies/[id]` | Update tenancy (status, details) |
| GET | `/api/properties/[id]/maintenance` | List maintenance requests |
| POST | `/api/properties/[id]/maintenance` | Create maintenance request |
| PATCH | `/api/maintenance/[id]` | Update status, assign provider |
| GET | `/api/properties/[id]/financials` | Get financial summary (RPC call) |
| POST | `/api/properties/[id]/financials` | Log income or expense entry |
| GET | `/api/properties/[id]/documents` | List documents |
| POST | `/api/properties/[id]/documents` | Upload document metadata (file uploaded to Storage separately) |
| DELETE | `/api/documents/[id]` | Delete document + storage file |

**All routes:**
- Validate request body with Zod schemas
- Use Supabase server client (RLS handles authorization)
- Return consistent error format: `{ error: string, details?: unknown }`
- No rate limiting needed beyond what middleware provides (these are low-volume operations)

---

## 9. UI Components

### Page Structure

```
/dashboard/landlord/
  portfolio/                    -- Portfolio overview (E07-S01)
  properties/[id]/
    overview/                   -- Property detail + tenancy info (E07-S02)
    tenancies/                  -- Tenancy management (E07-S02, S03)
    tenancies/[id]/             -- Tenancy detail
    tenancies/[id]/lease/       -- Lease PDF generation (E07-S10)
    maintenance/                -- Maintenance list (E07-S03)
    maintenance/new/            -- Create maintenance request
    maintenance/[id]/           -- Maintenance detail + assignment
    financials/                 -- Financial summary + entry log (E07-S05, S06, S07)
    documents/                  -- Document list + upload (E07-S08, S09)
  compliance-guide/             -- Static compliance checklist
```

### Key Components

| Component | Type | Notes |
|-----------|------|-------|
| `PortfolioGrid` | Server Component | Fetches all properties with summary counts |
| `PropertyCard` | Server Component | Shows property summary with status indicators |
| `TenancyForm` | Client Component | React Hook Form + Zod, `"use client"` |
| `MaintenanceList` | Server Component | Filterable list, server-side filtering |
| `MaintenanceForm` | Client Component | With photo upload (client-side compression) |
| `ProviderAssignment` | Client Component | Links to marketplace search, handles assignment |
| `FinancialEntryForm` | Client Component | Unified income/expense form with type toggle |
| `FinancialSummary` | Server Component | Calls RPC function, displays totals |
| `DocumentUpload` | Client Component | File validation, upload to Storage, metadata to DB |
| `DocumentList` | Server Component | With expiry status indicators |
| `ComplianceAlert` | Server Component | Banner showing expiring documents |
| `LeasePreview` | Client Component | HTML template preview + client-side PDF generation |

---

## 10. Cost Projection

### Infrastructure Cost at Scale

| Scale | Storage (docs + photos) | Reminder Emails | Compute (cron) | Total Monthly |
|-------|------------------------|-----------------|----------------|---------------|
| 1K landlords | ~$2 | ~$0 (free tier) | ~$0 | ~$2 |
| 10K landlords | ~$15 | ~$5 | ~$0 | ~$20 |
| 100K landlords | ~$150 | ~$40 | ~$5 | ~$195 |
| 500K landlords | ~$700 | ~$150 | ~$10 | ~$860 |

### Cost Controls Built In

1. **2MB file size limit** -- prevents storage runaway
2. **Client-side image compression** -- reduces actual storage by ~60%
3. **Indexed reminder queries** -- O(reminders due today), not O(all documents)
4. **In-app notifications first, email as fallback** -- cuts email volume by 70%
5. **Digest batching** -- one email per user, not one per document
6. **Client-side PDF generation** -- zero server compute for lease documents
7. **No materialized views** -- simple indexed queries are sufficient at this scale
8. **4 tables, not 8** -- half the RLS policies, indexes, and maintenance

---

## 11. Testing Strategy

### Unit Tests

- Zod schema validation for all forms (tenancy, maintenance, financial entry, document upload)
- Financial summary calculation (income - expenses)
- Rent due date calculation from lease terms
- Reminder date calculation (expiry - 30 days)
- File type validation logic

### Integration Tests

- Tenancy CRUD with RLS verification (user A cannot access user B's tenancies)
- Maintenance request creation and status updates
- Financial entry creation and summary RPC function
- Document upload with metadata storage
- Provider assignment updates maintenance request correctly
- Reminder query returns only documents due today

### E2E Tests (Playwright)

1. **Landlord full workflow:** Add property to portfolio -> create tenancy -> log rent payment -> view financial summary.
2. **Maintenance flow:** Create maintenance request -> assign provider (navigate to marketplace, select, confirm) -> update status to resolved.
3. **Document flow:** Upload Gas Safety certificate with expiry date -> verify it appears in document list with correct expiry indicator -> verify compliance alert appears on dashboard when within 30 days.
4. **Lease generation:** Create tenancy -> generate lease PDF -> verify download works -> save to documents.

### What NOT to Test

- Supabase Storage upload mechanics (trust the SDK)
- RLS policy SQL syntax (test via integration tests that verify access denial)
- PDF content layout (visual -- test manually)

---

## 12. Dependencies & Integration Points

| Dependency | Integration | How |
|------------|-------------|-----|
| Epic 1 (Auth) | User identity, roles | `auth.uid()` in RLS policies |
| Epic 2 (Listings) | Property data | `properties` and `listings` tables, `listings.user_id` for ownership |
| Epic 3 (Dashboards) | Dashboard shell | Portfolio tab added to landlord/agent dashboard layout |
| Epic 4 (Marketplace) | Contractor assignment | Link to marketplace search with category filter, no API integration |
| Epic 5 (Communication) | Notifications + messaging | In-app notifications for reminders, messages for contractor communication |

**No new third-party services required.** Everything uses existing Supabase (DB, Storage, Auth) and the existing notification system from Epic 5.

---

## 13. Future Premium Features (Post-MVP Revenue Opportunities)

These features are deliberately excluded from MVP. They are what competitors charge for and should be gated behind a landlord subscription tier (e.g., "Britestate Pro" at $15-30/mo per portfolio).

| Feature | Competitor Price | Revenue Potential |
|---------|-----------------|-------------------|
| Automated rent collection (Direct Debit/bank) | £25/tenant/mo (Goodlord) | High |
| Tenant screening & referencing integration | £15-30/check (OpenRent via RentProfile) | Medium |
| Financial reporting with tax summaries | £1/unit/mo (Arthur Online) | Medium |
| Automated tenant communications (reminders, notices) | Included in £50+/mo plans | Medium |
| Maintenance contractor auto-matching | Custom pricing | Low-Medium |
| Bank statement reconciliation | Premium feature everywhere | Medium |
| Rent guarantee insurance integration | Commission-based | High |
| Multi-user team management for agents | Per-seat pricing | High |

**Architecture note:** The consolidated `financial_entries` table and `property_documents` table are designed to support these premium features without schema changes. When automated rent collection is added, it inserts into the same `financial_entries` table. When referencing is integrated, results are stored as `property_documents`. The schema is ready; the features are gated by business logic, not database limitations.

---

*Spec finalized: 2026-03-07*
*Cost audit applied: epic7costanalysis.md*
*Applies to: Phase 6 -- Landlord Tools & Transactions*
