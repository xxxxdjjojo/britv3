# Epic 7 Cost Audit: The Deceptively Simple Epic That Hides Real Traps

## Context

Analysis of `epic7.txt` — Property Management Tools for Landlords & Agents. At first glance, this looks like the cheapest epic: mostly CRUD operations, forms, and lists. No AI, no real-time chat, no GPU instances. But the cost traps here are subtler — they compound silently as landlord portfolios grow, documents accumulate, and reminder systems scale.

For context: OpenRent (the UK's largest free letting platform) handles 1M+ tenancies with a remarkably thin tech stack. Goodlord and Arthur Online charge £50-150/mo for landlord tools and still keep infrastructure lean. The spec proposes building comparable functionality as a free feature inside a property portal — so every penny of infrastructure cost eats directly into margin.

---

## The Good News First

Epic 7 is the most restrained spec in the project. It explicitly says:
- "Basic financial management" (not full accounting)
- "Manual tracking" of rent (not automated collection)
- "Simple financial overview" (not advanced reporting)
- "Guidance or checklists" for compliance (not automated compliance)

**Don't let implementation drift expand this scope.** The biggest cost risk in Epic 7 isn't what the spec asks for — it's what a developer will build beyond what's asked.

---

## 1. Document Storage Without Retention Policy -- SILENT COST SPIRAL

**Source:** E07-S11

Every landlord uploads Gas Safety certs, EPCs, electrical certificates, insurance docs, lease agreements, inspection reports. The spec says "Secure storage using Supabase Storage" with no mention of retention, compression, or limits.

### The Math

A typical landlord with 5 properties uploads per year:
- Gas Safety Certificate: ~500KB PDF
- EICR (Electrical): ~800KB PDF
- EPC: ~300KB PDF
- Insurance: ~400KB PDF
- Lease agreement: ~1MB PDF
- Inspection photos: ~5-10MB
- Miscellaneous: ~2MB

**~15MB per property per year, growing cumulatively.**

| Landlords | Properties (avg 4) | Annual Storage Added | Cumulative Year 3 | Supabase Cost (Year 3) |
|-----------|-------------------|---------------------|-------------------|----------------------|
| 1K | 4K | 60GB | 180GB | ~$4/mo |
| 10K | 40K | 600GB | 1.8TB | ~$38/mo |
| 100K | 400K | 6TB | 18TB | ~$378/mo |

Supabase Storage is $0.021/GB/month. Looks cheap — but documents are **never deleted** (compliance requires retention), so storage only grows. By year 3 at 100K landlords, you're paying $378/mo just for landlord documents, growing every month.

**Add expense receipts from E07-S09** (photo uploads of receipts at ~2MB each, 10+ per property per year) and the numbers double.

**Recommendation:**
- Set document size limits: 2MB for PDFs, 1MB for images (receipts)
- Compress images server-side before storage (Supabase image transforms or client-side compression)
- Archive documents older than 7 years to cold storage (legal retention period for most UK landlord docs)
- **Don't store duplicate versions** — when a new Gas Safety cert is uploaded, keep the old one but move it to an archive bucket with cheaper storage class
- Display thumbnails/previews, serve full documents on-demand

---

## 2. Compliance Reminder System -- CRON JOB OR COST BOMB

**Source:** E07-S12

"Automated reminders (in-app and/or email) sent in advance of document expiry (e.g., 1 month before, 1 week before)"

This sounds simple. It's not. The naive implementation:

```
Daily cron job → scan ALL documents → find expiring ones → send notifications
```

At scale:

| Landlords | Documents with expiry | Daily scan rows | Operations/day |
|-----------|----------------------|----------------|---------------|
| 1K | ~20K | 20K | Trivial |
| 10K | ~200K | 200K | Noticeable |
| 100K | ~2M | 2M | **DB pressure** |

Plus each reminder generates:
1. In-app notification INSERT
2. Email send (Resend)
3. Potential SMS (if added later)

Two reminders per document (1 month + 1 week) = 2x multiplier.

**But here's the real trap:** The spec says reminders for Gas Safety, EPC, electrical, insurance. UK regulations require Gas Safety annually, EPC every 10 years, EICR every 5 years, and insurance annually. So for 5 properties, a landlord has ~12 expiry-tracked documents generating ~24 reminders per year. At 100K landlords = **2.4M reminder events per year.**

**Email cost (Resend):**

| Landlords | Annual reminder emails | Resend cost |
|-----------|----------------------|------------|
| 10K | 240K | ~$20/mo amortized |
| 100K | 2.4M | ~$200/mo amortized |

Not catastrophic, but unnecessary for most of these.

**Recommendation:**
- **Don't scan the full table daily.** Create an indexed `next_reminder_date` column on the documents table. Query only `WHERE next_reminder_date = CURRENT_DATE`. This is O(reminders due today), not O(all documents).
- **Use pg_cron or Supabase Edge Function on a schedule** — already in the stack from Epic 4 analysis. No new infrastructure.
- **Default to in-app notifications only.** Email only if the user hasn't acknowledged the in-app reminder within 3 days. This cuts email volume by 70%+.
- **Batch reminders:** Don't send "Your Gas Safety expires in 1 month" and "Your EPC expires in 1 month" as separate emails. Send one daily digest: "You have 3 documents expiring soon." One email instead of three.
- Pre-calculate `next_reminder_date` when the document is uploaded (simple: expiry_date minus 30 days). Update it to the 1-week reminder after the first one fires. Two values, no daily scan needed.

---

## 3. Lease Template PDF Generation -- DON'T BUILD A DOCUMENT ENGINE

**Source:** E07-S05

"Generate a basic digital lease agreement using a template with customizable fields" that can be "downloaded as a PDF."

The tempting implementation: use a PDF generation library (puppeteer, pdf-lib, react-pdf) to dynamically render PDFs server-side. This means:

- **Puppeteer on serverless:** 50MB+ cold start, 3-5s generation time, memory-hungry. On Vercel: will hit function size limits and timeout.
- **pdf-lib:** Lighter, but building a multi-page legal document with proper formatting is 2-3 weeks of dev time.
- **React-pdf/renderer:** Decent, but still server-side rendering overhead.

**What OpenRent does:** They use pre-built PDF templates from government-recommended AST agreements. Landlords fill in a web form, and the data is merged into a static template. No dynamic layout engine.

**What Goodlord does:** They partnered with legal providers for professionally drafted templates. Landlords pay for this.

**Recommendation:**
- Use a **static HTML template** rendered to PDF via a simple library like `jspdf` or `html2pdf.js` **client-side**. Zero server cost. The browser does the work.
- Start with ONE template: the standard AST (Assured Shorthold Tenancy) agreement. Don't build a template engine for multiple agreement types.
- Pre-fill from property + tenant records via form fields. User reviews in browser, clicks "Download PDF."
- Include the disclaimer ("seek legal advice") prominently.
- **Do NOT use Puppeteer/Playwright for PDF generation on serverless.** The cold start and memory cost is brutal.
- If you need server-side PDF later, use a lightweight Edge Function with `@react-pdf/renderer` — but only when client-side proves insufficient.

---

## 4. Maintenance → Marketplace Integration -- KEEP IT SIMPLE

**Source:** E07-S07

"Assign a logged maintenance job to a verified service provider from the Britestate marketplace"

This integration between Epic 7 and Epic 4 sounds natural, but the spec is vague on HOW. The over-engineered version:
- Auto-match providers based on maintenance category
- Create an RFQ automatically
- Track the job through the marketplace pipeline
- Sync status between maintenance_requests and marketplace jobs
- Handle payments through the marketplace

This creates a **dual-state management problem**: the maintenance request has a status, AND the marketplace job/RFQ has a status. Keeping them in sync requires triggers, webhooks, or event listeners.

**What Arthur Online does:** A simple "Find a contractor" button that opens the marketplace search pre-filtered by service type. The landlord manually assigns. Status tracking stays in the maintenance system — the marketplace is just for finding the provider.

**Recommendation:**
- **Don't auto-create RFQs from maintenance requests.** Let the landlord click "Find Provider" which opens the marketplace search filtered by the relevant trade category (plumbing, electrical, etc.).
- Once the landlord selects a provider, simply store `assigned_provider_id` on the maintenance request. Don't create a parallel marketplace job record.
- Communication happens through the existing messaging system (Epic 5).
- Status updates on the maintenance request are manual (landlord marks as "In Progress", "Resolved"). Don't try to sync with marketplace job status.
- This eliminates: event listeners, status sync triggers, dual-state management, and the debugging nightmare of two systems disagreeing on job status.

---

## 5. Financial Overview Queries -- PREMATURE AGGREGATION

**Source:** E07-S10

"Total logged rent income and total logged expenses over a selected period"

The naive implementation: `SUM(amount) FROM rental_payments WHERE property_id = ? AND date BETWEEN ? AND ?` every time the dashboard loads.

At small scale: fine. At 100K landlords each loading their dashboard with 4 properties, each with 12 months of rent + 20 expense entries:

| Dashboard loads/day | Queries (4 properties × 2 aggregations) | Total queries/day |
|--------------------|----------------------------------------|------------------|
| 1K | 8K | 8K |
| 10K | 80K | 80K |
| 100K | 800K | **800K aggregation queries/day** |

SUM queries aren't free — they scan rows.

**Recommendation:**
- For MVP: the simple SUM query is fine. Don't optimize until you see DB pressure.
- When you need to optimize: add `running_total` columns on a `property_financial_summary` table, updated via trigger on INSERT to rental_payments or property_expenses. Read the summary, don't re-aggregate.
- **Don't build materialized views for this.** A simple summary row per property per month is sufficient and incrementally updated.
- Consider caching dashboard data for 5 minutes (Upstash Redis, already in the stack). Landlords don't need real-time financial data — it's manually entered.

---

## 6. Database Schema Bloat -- THE 266-TABLE DISEASE

**Source:** E07-S13, project memory

The project memory mentions 266 tables. Epic 7 alone proposes: `landlord_portfolios`, `tenancies`, `maintenance_requests`, `rental_payments`, `property_expenses`, `property_documents`, `compliance_items`, plus junction tables and audit tables.

**The risk:** Each table needs:
- RLS policies (2-4 per table)
- Indexes (2-3 per table)
- Triggers (timestamps, audit)
- TypeScript types
- API routes or service functions
- Tests

8 new tables × ~10 artifacts each = ~80 things to build, test, and maintain.

**Recommendation — Consolidate where possible:**

| Spec Proposes | Recommendation |
|--------------|----------------|
| `landlord_portfolios` (linking table) | Skip — use the existing `listings` table with a `managed_by` column. A property in someone's portfolio = a listing they own/manage. |
| `tenancies` | Keep — this is genuinely new data. |
| `maintenance_requests` | Keep — core feature. |
| `rental_payments` + `property_expenses` | Merge into single `financial_entries` table with a `type` enum (`income`/`expense`) and `category`. One table, one set of RLS policies, one set of indexes. |
| `property_documents` | Keep — but ensure it's generic enough to reuse for transaction documents in Phase 6 (don't build a separate document system later). |
| `compliance_items` | Skip — compliance is just documents with expiry dates. The `property_documents` table with a `compliance_type` column and `expiry_date` handles this. |

**Result:** 8 proposed tables → 4 tables. Half the RLS policies, half the indexes, half the test surface.

---

## 7. Tenant Screening Integration -- DON'T BUILD IT, LINK IT

**Source:** E07-S03

"Integration points/guidance for tenant screening (e.g., links to third-party referencing services; Britestate itself won't perform checks initially)"

The spec wisely says "links to third-party" — but the user story still asks for an application management system with statuses (New, Under Review, Approved, Rejected, Waitlisted) and filtering/sorting.

This is a mini-CRM. For MVP, this is overscoped.

**What OpenRent does:** Landlords click "Order References" which redirects to their referencing partner (RentProfile). Application status is binary: applied or not.

**Recommendation:**
- **MVP:** Applications are just messages in the inbox (from Epic 5) with a "Mark as Tenant" action that creates the tenancy record. No separate application pipeline.
- Add application status tracking only when you have landlords telling you they need it (and they'll need it when they're getting 50+ applications per listing — a good problem to have).
- Link out to OpenRent's free referencing or a partner. Don't build screening infrastructure.

---

## 8. Rent Payment Tracking -- DON'T BECOME AN ACCOUNTING TOOL

**Source:** E07-S08, E07-S09

The spec carefully says "manual tracking" and "mark as paid/overdue." Good. But the implementation risk is scope creep:

- "Can we add automated bank statement import?"
- "Can we add recurring payment reminders?"
- "Can we calculate late payment interest?"
- "Can we generate rent statements for tenants?"

**Every one of these is a separate product.** Goodlord charges £25/tenant/month for this. Arthur Online charges £1/unit/month. These are revenue-generating features, not freebies.

**Recommendation:**
- Build exactly what the spec says: a simple table where landlords log payments manually. Date, amount, status (Paid/Partial/Overdue). That's it.
- Show "Overdue" based on: `rent_due_date < TODAY AND status != 'paid'`. One query.
- **Do NOT add:** automated reminders to tenants, bank import, interest calculation, or PDF statements. These are Phase 2 premium features that landlords should pay for.
- The "expected rent due dates based on lease terms" should be a simple calculation in the UI (lease start + frequency), not a cron job generating scheduled payment records.

---

## Cost Summary: Spec vs. Recommended

| Item | Spec Approach (at 100K landlords) | Recommended | Savings |
|------|----------------------------------|-------------|---------|
| Document storage | ~$400/mo (growing, no retention) | Compression + retention policy | ~$200/mo |
| Reminder emails | ~$200/mo (individual emails) | In-app first + digest batching | ~$160/mo |
| PDF generation | Server-side Puppeteer (compute cost) | Client-side html2pdf.js | ~$50/mo compute |
| Maintenance ↔ marketplace sync | Event listeners + dual state | Manual assignment, single status | Dev time saved: 1-2 weeks |
| Financial aggregation queries | Raw SUM on every dashboard load | Summary table + cache | DB pressure relief |
| Database tables | 8 tables + full artifact set | 4 consolidated tables | 50% less maintenance |
| Application management | Mini-CRM with pipeline | Messages + "Mark as Tenant" | Dev time saved: 1 week |
| **Total monthly (at scale)** | **~$650/mo + 4-5 weeks dev** | **~$240/mo + 2-3 weeks dev** | **~$410/mo + 2 weeks** |

The savings here are smaller than Epics 4-6 because the spec is already restrained. The real savings are in **dev time** (2+ weeks) and **long-term maintenance** (fewer tables, fewer policies, fewer things to break).

---

## The OpenRent Test

Before building any landlord feature, ask: **"Does OpenRent charge for this?"**

| Feature | OpenRent | Arthur Online | Spec Proposes | Verdict |
|---------|----------|--------------|--------------|---------|
| Portfolio dashboard | Free (basic) | £1/unit/mo | Free | Build (simple) |
| Tenant record storage | Free | Paid | Free | Build (simple) |
| Lease template generation | Links to gov.uk | Paid | Free | Simplify (client-side PDF) |
| Maintenance tracking | Not offered | Paid | Free | Build (basic only) |
| Rent payment tracking | Not offered | Paid | Free | Build (manual only) |
| Financial reporting | Not offered | Paid feature | Free | Keep very basic |
| Compliance reminders | Not offered | Paid feature | Free | Build (cheap if done right) |
| Tenant screening | Partnered (RentProfile) | Integrated (paid) | Links | Link out, don't build |
| Application pipeline | Basic | Full CRM | Mini-CRM | Defer — use messages |

**OpenRent serves 1M+ tenancies with a fraction of this feature set.** Build the minimum that gets landlords onto the platform, then add premium features that generate revenue.

---

## The 3 Rules for Epic 7

1. **Don't give away what competitors charge for.** Rent tracking, compliance reminders, and financial reporting are paid features at Arthur/Goodlord. Build basic versions free to drive adoption, but architect them so you can gate advanced versions behind a subscription later.

2. **Consolidate relentlessly.** 4 tables instead of 8. One financial_entries table instead of two. Documents and compliance in one table. Every table you don't create is 10 artifacts you don't maintain.

3. **Manual before automated.** Manual rent tracking before automated collection. Manual provider assignment before auto-matching. Manual expense logging before receipt scanning. Automation is a Phase 2 revenue feature, not an MVP freebie.

---

*Analysis date: 2026-03-07*
*Applies to: Epic 7 -- Property Management Tools (Landlords & Agents)*
