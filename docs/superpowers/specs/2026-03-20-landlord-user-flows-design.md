# Landlord User Flow Design — 10 End-to-End Scenarios

**Date:** 2026-03-20
**Author:** Claude Code
**Status:** Draft — Awaiting Review
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [System Inventory](#system-inventory)
3. [Scenario 1: The Accidental Landlord](#scenario-1-the-accidental-landlord)
4. [Scenario 2: The Tenant Screener](#scenario-2-the-tenant-screener)
5. [Scenario 3: The Portfolio Commander](#scenario-3-the-portfolio-commander)
6. [Scenario 4: The Emergency Responder](#scenario-4-the-emergency-responder)
7. [Scenario 5: The Compliance Warrior](#scenario-5-the-compliance-warrior)
8. [Scenario 6: The Eviction Navigator](#scenario-6-the-eviction-navigator)
9. [Scenario 7: The Overseas Landlord](#scenario-7-the-overseas-landlord)
10. [Scenario 8: The HMO Landlord](#scenario-8-the-hmo-landlord)
11. [Scenario 9: The Tax Season Landlord](#scenario-9-the-tax-season-landlord)
12. [Scenario 10: The Growth Landlord](#scenario-10-the-growth-landlord)
13. [Evaluation Framework](#evaluation-framework)
14. [Cross-Scenario Gap Analysis](#cross-scenario-gap-analysis)
15. [Final Scorecard & Recommendations](#final-scorecard--recommendations)

---

## Overview

### Purpose

This document defines 10 comprehensive landlord user flow scenarios that serve triple duty:

| Function | What It Tests |
|----------|--------------|
| **QA Validation** | Does every route render? Do forms submit? Do state machines transition correctly? |
| **UX Audit** | Is the journey smooth? Is cognitive load manageable? Are there delight moments? |
| **Gap Analysis** | What's missing? Where are dead-ends? What edge cases break the flow? |

### Evaluation Dimensions (FAANG Rubric)

| Dimension | Weight | What We're Measuring |
|-----------|--------|---------------------|
| **Task Completion** | 25% | Can the user achieve their goal end-to-end without getting stuck? |
| **Efficiency** | 20% | How many clicks/pages to complete the task? Any unnecessary steps? |
| **Error Handling** | 15% | What happens when things go wrong? Clear error messages? Recovery paths? |
| **Empty/Edge States** | 15% | First-run experience, zero-data states, boundary conditions |
| **Information Architecture** | 15% | Can the user find what they need? Is navigation intuitive? |
| **Delight & Polish** | 10% | Animations, feedback, celebration moments, micro-interactions |

### Severity Ratings

- **P0 — Blocker**: User cannot complete core task, data loss risk, security issue
- **P1 — Critical**: Major friction, workaround exists but painful
- **P2 — Important**: UX degradation, missing but non-essential feature
- **P3 — Nice-to-have**: Polish, optimization, delight improvements

### Gap Categories

| Category | Definition |
|----------|-----------|
| **Dead End** | User reaches a page with no clear next action |
| **Missing Link** | Two features that should connect but don't |
| **Missing Feature** | Functionality referenced but not implemented |
| **Data Gap** | Information the user needs but can't access from current view |
| **Mobile Gap** | Feature works on desktop but breaks/degrades on mobile |
| **Edge Case** | Unusual but valid scenario not handled |

---

## System Inventory

### Routes (39 pages + 1 layout)

| Section | Route | Page |
|---------|-------|------|
| **Dashboard** | `/dashboard/landlord` | Home / KPI overview |
| **Analytics** | `/dashboard/landlord/analytics` | Portfolio analytics |
| **Compliance** | `/dashboard/landlord/compliance` | Compliance dashboard |
| | `/dashboard/landlord/compliance/alerts` | Expiry alerts |
| | `/dashboard/landlord/compliance/upload` | Upload certificates |
| | `/dashboard/landlord/compliance-guide` | Compliance guide |
| **Deposits** | `/dashboard/landlord/deposits` | Deposit registrations |
| **Finance** | `/dashboard/landlord/finance/expenses` | Expense tracking |
| | `/dashboard/landlord/finance/report` | Financial report |
| | `/dashboard/landlord/finance/tax` | Tax summary |
| **Find Services** | `/dashboard/landlord/find-agent` | Find estate agent |
| | `/dashboard/landlord/find-tradespeople` | Find tradesperson |
| **Insurance** | `/dashboard/landlord/insurance` | Insurance overview |
| **Inventory** | `/dashboard/landlord/inventory/[propertyId]/check-in` | Check-in inventory |
| | `/dashboard/landlord/inventory/[propertyId]/check-out` | Check-out inventory |
| **Legal** | `/dashboard/landlord/legal/notices` | Legal notices |
| **Maintenance** | `/dashboard/landlord/maintenance` | All maintenance requests |
| | `/dashboard/landlord/maintenance/[id]` | Request detail |
| | `/dashboard/landlord/maintenance/[id]/assign` | Assign provider |
| **Properties** | `/dashboard/landlord/properties` | Property list |
| | `/dashboard/landlord/properties/add` | Add property |
| | `/dashboard/landlord/properties/[id]` | Property detail |
| | `/dashboard/landlord/properties/[id]/documents` | Property documents |
| | `/dashboard/landlord/properties/[id]/financials` | Property financials |
| | `/dashboard/landlord/properties/[id]/listing` | Create/edit listing |
| | `/dashboard/landlord/properties/[id]/overview` | Property overview |
| | `/dashboard/landlord/properties/[id]/maintenance` | Property maintenance |
| | `/dashboard/landlord/properties/[id]/maintenance/new` | New request |
| | `/dashboard/landlord/properties/[id]/maintenance/[requestId]` | Request detail |
| | `/dashboard/landlord/properties/[id]/tenancies` | Property tenancies |
| | `/dashboard/landlord/properties/[id]/tenancies/[tenancyId]` | Tenancy detail |
| | `/dashboard/landlord/properties/[id]/tenancies/[tenancyId]/lease` | Lease agreement |
| **Rent** | `/dashboard/landlord/rent` | Rent collection overview |
| | `/dashboard/landlord/rent/[propertyId]` | Per-property rent |
| **Tenants** | `/dashboard/landlord/tenants` | Application pipeline |
| | `/dashboard/landlord/tenants/[applicationId]` | Application detail |
| | `/dashboard/landlord/tenants/[applicationId]/decision` | Approve/reject |
| | `/dashboard/landlord/tenants/[applicationId]/tenancy/agreement` | Generate agreement |
| **Tools** | `/dashboard/landlord/tools/yield-calculator` | Yield calculator |

### Components (42)

| Component | Purpose |
|-----------|---------|
| `LandlordSidebar` | Navigation sidebar |
| `ApplicationDetailActions` | Application pipeline action buttons |
| `ApplicationPipelineCard` | Application card with status |
| `KpiCard` | Dashboard KPI display |
| `RentPaymentRow` | Rent collection table row |
| `FinancialSummary` | Income/expense summary with period presets |
| `ComplianceExpiryCalendar` | Calendar of compliance expiries |
| `TaxSummaryExport` | CSV/PDF tax export |
| `PropertyCard` | Property summary card |
| `TenantScreeningClient` | Multi-step screening form |
| `DocumentUpload` | File upload with compression |
| `PortfolioGrid` | Property grid layout |
| `MaintenanceForm` | Maintenance request form |
| `ComplianceAlert` | Compliance warning banner |
| `Section21NoticePDF` | Section 21 notice PDF generator |
| `ProviderAssignment` | Assign provider to maintenance |
| `MaintenanceStatusBadge` | Status badge (new→closed) |
| `PDFErrorBoundary` | PDF rendering error handler |
| `TenancyAgreementPDFWrapper` | AST agreement PDF wrapper |
| `Section8NoticePDF` | Section 8 notice PDF generator |
| `TenancyAgreementUpload` | Lease document upload |
| `TradesPersonAssignModal` | Provider search/assign modal |
| `ComplianceAlertBanner` | Expiry alert banner |
| `PortfolioAnalyticsCharts` | Income trend, occupancy, property type charts |
| `LeasePreview` | Lease terms preview/download |
| `ComplianceUploadForm` | Certificate upload form |
| `InventoryPdfButton` | Inventory report PDF download |
| `CertificateStatusTile` | Certificate status summary tile |
| `PropertyOverview` | Comprehensive property detail tabs |
| `TenancyForm` | Tenancy create/edit form |
| `HealthScoreCard` | Portfolio health score |
| `FinancialEntryForm` | Income/expense entry form |
| `TenancyAgreementPDF` | Full AST agreement PDF |
| `TenancyStatusBadge` | Tenancy status indicator |
| `InventoryRoomForm` | Room-by-room inventory form |
| `IncomeExpenseChart` | Monthly income vs expense chart |
| `DocumentList` | Document table with actions |
| `MaintenanceList` | Maintenance request table |
| `Section21PreflightChecklist` | Pre-Section 21 legal checklist |
| `DepositCard` | Deposit registration card |
| `RentStatusIndicator` | Payment status indicator |
| `MaintenancePriorityBadge` | Priority badge (emergency→low) |

### Services (9)

| Service | Domain |
|---------|--------|
| `deposit-service` | TDS/DPS/mydeposits registration |
| `document-service` | Property document CRUD + expiry tracking |
| `financial-service` | Income/expense + receipt upload |
| `inventory-service` | Check-in/check-out inventory reports |
| `legal-notice-service` | Section 21/8 notice generation + validation |
| `maintenance-service` | Maintenance CRUD + status state machine |
| `portfolio-service` | Portfolio data with summary counts |
| `tenancy-service` | Tenancy CRUD + status filtering |
| `tenant-application-service` | Application pipeline + email notifications |

### API Routes (13)

| Route | Methods | Purpose |
|-------|---------|---------|
| `api/landlord/compliance/upload` | POST | Upload compliance certificates |
| `api/landlord/deposits` | GET | List deposit registrations |
| `api/landlord/deposits/[id]` | PATCH | Update deposit |
| `api/landlord/finance/entries` | GET | Financial entries with filters |
| `api/landlord/finance/entries/[id]` | PATCH | Update financial entry |
| `api/landlord/inventory` | POST | Create inventory report |
| `api/landlord/inventory/[reportId]` | GET, PATCH | Get/update inventory report |
| `api/landlord/maintenance` | GET | List maintenance requests |
| `api/landlord/maintenance/[id]/status` | PATCH | Update request status |
| `api/landlord/maintenance/[id]/assign` | PATCH | Assign provider |
| `api/landlord/maintenance/[id]/notes` | PATCH | Update request notes |
| `api/landlord/rent` | GET | Rent collection grouped by status |
| `api/landlord/rent/[entryId]/mark-paid` | PATCH | Mark rent as paid |

---

## Scenario 1: The Accidental Landlord

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Sarah |
| **Age** | 34 |
| **Properties** | 1 (inherited flat in Croydon) |
| **Tech comfort** | Medium — uses apps daily but never property software |
| **Situation** | Inherited grandmother's flat. No landlord experience. Overwhelmed by legal requirements. |
| **Goal** | Go from zero to rental-ready: property listed, compliance sorted, understand obligations |
| **Emotional state** | Anxious, needs reassurance, scared of making costly mistakes |

### FAANG Benchmark

**Airbnb Host Onboarding** — Progressive disclosure, celebration moments at each milestone, visual checklist progress, contextual help tooltips, "you're X% done" encouragement.

### End-to-End Journey

#### Step 1: Sign Up & Role Selection

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to registration page | `/register` | Registration form displayed |
| 1.2 | Complete registration form (email, password, name) | `/register` | Form validates, submits |
| 1.3 | Verify email (click link in inbox) | `/auth/callback` → redirect | Email verified |
| 1.4 | Select "Landlord" role | `/register/role-select` | Role saved, redirect to dashboard |

**QA Checkpoints:**
- [ ] Registration form validates email format, password strength
- [ ] Email verification link works and redirects correctly
- [ ] Role selection page shows all available roles
- [ ] Selecting "Landlord" sets role in database and redirects to `/dashboard/landlord`
- [ ] If user closes browser and returns, role persists

**UX Audit:**
- Is it clear which role to pick? Does "Landlord" description explain what Sarah will get?
- Is there a "not sure?" option or comparison view?
- How many clicks from landing to dashboard? (Target: ≤5)

#### Step 2: Empty Dashboard — First Impression

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Land on dashboard for first time | `/dashboard/landlord` | Empty state with guidance |
| 2.2 | See KPI cards with zero values | `/dashboard/landlord` | KPIs show 0 or empty gracefully |
| 2.3 | Look for "what to do next" guidance | `/dashboard/landlord` | CTA to add first property |

**QA Checkpoints:**
- [ ] Dashboard renders without errors when user has no properties
- [ ] `KpiCard` components handle zero/null values gracefully
- [ ] `PortfolioGrid` shows empty state (not blank white space)
- [ ] `HealthScoreCard` handles no-data state
- [ ] No JavaScript console errors on empty dashboard

**UX Audit:**
- Does the empty dashboard feel welcoming or abandoned?
- Is there a clear, prominent CTA ("Add Your First Property")?
- Is there an onboarding checklist visible? (FAANG standard: yes)
- **Gap flag:** Is there a welcome modal or first-run tutorial? [Check]
- **Gap flag:** Does `LandlordSidebar` highlight the recommended first step? [Check]

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.1 | Missing Feature | P2 | No onboarding checklist/wizard for first-time landlords |
| GAP-1.2 | Missing Feature | P2 | No welcome modal or first-run experience |
| GAP-1.3 | Dead End | P1 | Empty dashboard may show KPIs at 0 with no explanation or next-step guidance |

#### Step 3: Add First Property

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click "Add Property" | `/dashboard/landlord/properties/add` | Property form loads |
| 3.2 | Enter property address | `/dashboard/landlord/properties/add` | Address field autocomplete |
| 3.3 | Select property type (flat), bedrooms (2), bathrooms (1) | `/dashboard/landlord/properties/add` | Form fields populate |
| 3.4 | Set rental price (£1,200/month) | `/dashboard/landlord/properties/add` | Price validates |
| 3.5 | Upload property photos (5 images) | `/dashboard/landlord/properties/add` | Photos compress and upload |
| 3.6 | Submit property form | `/dashboard/landlord/properties/add` | Redirect to property detail |

**QA Checkpoints:**
- [ ] Property form renders all required fields
- [ ] Address input supports UK postcode format
- [ ] Photo upload handles multiple files, shows progress, compresses images
- [ ] Form validates required fields before submission
- [ ] Successful submission creates property record in database
- [ ] Redirect goes to `/dashboard/landlord/properties/[newId]`
- [ ] Property appears in `PortfolioGrid` on `/dashboard/landlord/properties`

**UX Audit:**
- Is the form intimidating? How many fields on first view?
- Is there progressive disclosure (basic info first, details later)?
- Does the photo upload feel responsive? (Compression feedback?)
- Is there a "save draft" option for a nervous first-timer?
- After submission, is there a celebration moment ("Your first property is added!")?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.4 | Missing Feature | P2 | No address autocomplete/lookup (UK PAF or Google Places) |
| GAP-1.5 | Missing Feature | P3 | No save-as-draft on property form |
| GAP-1.6 | Missing Feature | P3 | No celebration moment after adding first property |

#### Step 4: Upload Gas Safety Certificate

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Navigate to compliance or property documents | `/dashboard/landlord/compliance` OR `/dashboard/landlord/properties/[id]/documents` | Compliance overview loads |
| 4.2 | See that gas safety certificate is missing/required | Compliance page | Missing status shown |
| 4.3 | Click upload for gas safety cert | `/dashboard/landlord/compliance/upload` | Upload form loads |
| 4.4 | Select document type: "Gas Safety Certificate" | `/dashboard/landlord/compliance/upload` | Type selected |
| 4.5 | Select property from dropdown | `/dashboard/landlord/compliance/upload` | Property associated |
| 4.6 | Upload PDF scan of certificate | `/dashboard/landlord/compliance/upload` | File validates and uploads |
| 4.7 | Enter expiry date (12 months from inspection) | `/dashboard/landlord/compliance/upload` | Date validated |
| 4.8 | Submit | `/dashboard/landlord/compliance/upload` | Certificate stored, status updated |

**QA Checkpoints:**
- [ ] `ComplianceUploadForm` renders with document type options
- [ ] File type validation (PDF, JPG, PNG accepted; others rejected)
- [ ] File size limit enforced with clear error message
- [ ] Expiry date cannot be in the past
- [ ] After upload, `CertificateStatusTile` on compliance page updates to "active"
- [ ] `ComplianceAlert` / `ComplianceAlertBanner` clears for this certificate
- [ ] Document appears in `/dashboard/landlord/properties/[id]/documents` (`DocumentList`)

**UX Audit:**
- Is it clear which documents are required vs optional?
- Can Sarah get to upload from the property detail page OR the compliance page? (Multiple paths)
- Is there contextual help explaining what a gas safety cert is and how to get one?
- After upload, does the checklist progress update?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.7 | Missing Link | P2 | No direct link from property detail "compliance" section to upload form for that specific property |
| GAP-1.8 | Data Gap | P2 | No information about how to obtain a gas safety certificate (find Gas Safe engineer) |
| GAP-1.9 | Missing Link | P2 | No link from "you need a gas safety cert" alert to `/find-tradespeople` filtered for Gas Safe engineers |

#### Step 5: Upload EPC

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Return to compliance page | `/dashboard/landlord/compliance` | See gas safety now green, EPC still red |
| 5.2 | Click upload for EPC | `/dashboard/landlord/compliance/upload` | Upload form with EPC pre-selected |
| 5.3 | Upload EPC document | `/dashboard/landlord/compliance/upload` | File validates |
| 5.4 | Enter EPC rating (C) and expiry date | `/dashboard/landlord/compliance/upload` | Rating and date stored |
| 5.5 | Submit | `/dashboard/landlord/compliance/upload` | EPC status updated |

**QA Checkpoints:**
- [ ] EPC-specific fields appear (rating: A-G)
- [ ] Expiry date defaults correctly (EPCs valid for 10 years)
- [ ] Property with EPC below E shows rental restriction warning (Minimum Energy Efficiency Standards)
- [ ] Multiple certificates for same property don't conflict

**UX Audit:**
- Does the compliance page clearly show progress (2 of 3 done)?
- Are there tooltips explaining EPC ratings and MEES regulations?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.10 | Missing Feature | P1 | No MEES warning for EPC ratings below E (legal requirement since 2018) |
| GAP-1.11 | Data Gap | P3 | No auto-lookup from EPC register (public API exists) |

#### Step 6: Create Rental Listing

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Navigate to property listing page | `/dashboard/landlord/properties/[id]/listing` | Listing form loads |
| 6.2 | Write property description | Listing page | Text area available |
| 6.3 | Set listing details (available date, furnished, pets policy) | Listing page | Details captured |
| 6.4 | Preview listing | Listing page | Preview renders |
| 6.5 | Publish listing | Listing page | Listing goes live |

**QA Checkpoints:**
- [ ] Listing form pre-populates from property data (address, type, bedrooms, price)
- [ ] Cannot publish listing without required compliance docs (gas safety, EPC, deposit protection scheme intent)
- [ ] Published listing appears in public search results
- [ ] Listing page accessible from property detail

**UX Audit:**
- Is listing creation separate from property creation? Is the distinction clear?
- Can Sarah preview how the listing will look to prospective tenants?
- Is there guidance on writing a good listing description?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-1.12 | Missing Feature | P1 | No compliance gate before publishing listing (landlords must have gas safety cert and EPC to legally let) |
| GAP-1.13 | Missing Feature | P2 | No listing preview showing how it appears to searchers |
| GAP-1.14 | Missing Link | P2 | No link from listing page to compliance page if docs are missing |

#### Step 7: Understand Compliance Requirements

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 7.1 | Navigate to compliance guide | `/dashboard/landlord/compliance-guide` | Guide content loads |
| 7.2 | Read through landlord obligations | Compliance guide | Content is clear and comprehensive |
| 7.3 | Return to compliance dashboard | `/dashboard/landlord/compliance` | Status reflects current state |

**QA Checkpoints:**
- [ ] Compliance guide page renders with content
- [ ] Content covers: Gas Safety, EPC, EICR, Deposit Protection, How to Rent guide, Right to Rent checks
- [ ] Links from guide to relevant upload/action pages work

**UX Audit:**
- Is the guide written in plain English (not legalese)?
- Is it scannable (headers, checklists) or a wall of text?
- Does it feel reassuring or overwhelming for Sarah?

### Scenario 1 Scorecard

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Can Sarah go from zero to listed? |
| Efficiency | — | Total clicks, total pages visited |
| Error Handling | — | What happens if upload fails? If form has errors? |
| Empty/Edge States | — | First-run dashboard, zero properties, zero documents |
| Information Architecture | — | Can she find compliance from dashboard? Find upload from compliance? |
| Delight & Polish | — | Celebration moments, progress indicators, reassurance |

### Scenario 1 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-1.1 | Missing Feature | P2 | No onboarding checklist/wizard |
| GAP-1.2 | Missing Feature | P2 | No welcome modal or first-run experience |
| GAP-1.3 | Dead End | P1 | Empty dashboard without guidance |
| GAP-1.4 | Missing Feature | P2 | No address autocomplete |
| GAP-1.5 | Missing Feature | P3 | No save-as-draft on property form |
| GAP-1.6 | Missing Feature | P3 | No celebration moment after first property |
| GAP-1.7 | Missing Link | P2 | No property-specific compliance upload link |
| GAP-1.8 | Data Gap | P2 | No guidance on obtaining certificates |
| GAP-1.9 | Missing Link | P2 | No link from compliance alert to find-tradespeople |
| GAP-1.10 | Missing Feature | P1 | No MEES warning for EPC below E |
| GAP-1.11 | Data Gap | P3 | No EPC register auto-lookup |
| GAP-1.12 | Missing Feature | P1 | No compliance gate before listing publish |
| GAP-1.13 | Missing Feature | P2 | No listing preview |
| GAP-1.14 | Missing Link | P2 | No listing → compliance link when docs missing |

---

## Scenario 2: The Tenant Screener

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Marcus |
| **Age** | 45 |
| **Properties** | 1 (BTL flat in Manchester) |
| **Tech comfort** | High — uses comparison sites, online banking |
| **Situation** | Hands-on landlord, does everything himself. Current tenant leaving. Needs to find a reliable replacement. |
| **Goal** | Screen applicants, run references, approve tenant, generate AST, register deposit |
| **Emotional state** | Methodical, wants control over the process, risk-averse about bad tenants |

### FAANG Benchmark

**Greenhouse/Lever ATS** — Clear pipeline stages, bulk actions, structured scorecards, one-click stage advancement, interview-to-offer flow, configurable rejection templates.

### End-to-End Journey

#### Step 1: Review Application Pipeline

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to tenants page | `/dashboard/landlord/tenants` | Application pipeline loads |
| 1.2 | See applications grouped by stage (received, shortlisted, referencing, approved, rejected) | Tenants page | Pipeline view with counts |
| 1.3 | Scan application cards for new applications | Tenants page | `ApplicationPipelineCard` components rendered |

**QA Checkpoints:**
- [ ] `TenantScreeningClient` renders pipeline view
- [ ] Applications grouped correctly by status
- [ ] Each `ApplicationPipelineCard` shows: applicant name, property applied for, date, credit check status, reference status
- [ ] Pipeline counts are accurate
- [ ] Empty pipeline shows appropriate empty state

**UX Audit:**
- Is the pipeline view immediately understandable? (Kanban vs list view?)
- Can Marcus filter by property if he had multiple?
- Is the most important information visible without clicking into each card?

#### Step 2: Review Individual Application

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Click on an application | `/dashboard/landlord/tenants/[applicationId]` | Application detail loads |
| 2.2 | Review applicant details (employment, income, references, rental history) | Application detail | All fields populated |
| 2.3 | Review credit check status | Application detail | Status shown |

**QA Checkpoints:**
- [ ] Application detail page renders all applicant information
- [ ] Income-to-rent ratio calculated and displayed (standard: 2.5x)
- [ ] Previous landlord reference status shown
- [ ] Employment reference status shown
- [ ] Application date and property name visible

**UX Audit:**
- Is all decision-relevant information on one page (no excessive clicking)?
- Is the income-to-rent ratio calculated automatically?
- Are red flags highlighted (gaps in rental history, failed credit check)?

#### Step 3: Shortlist & Reference

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Move application to "Shortlisted" | Application detail | `ApplicationDetailActions` stage transition |
| 3.2 | Move to "Referencing" stage | Application detail | Status updates, references initiated |
| 3.3 | View reference results when complete | Application detail | Reference data populated |

**QA Checkpoints:**
- [ ] `ApplicationDetailActions` provides correct stage transition buttons
- [ ] Stage transitions follow valid state machine (received → shortlisted → referencing → approved/rejected)
- [ ] Invalid transitions prevented (can't skip stages)
- [ ] `tenant-application-service` sends email notification to applicant on stage change
- [ ] Referencing stage triggers appropriate actions

**UX Audit:**
- Is the state machine clear to Marcus? Does he know what each stage means?
- Are there confirmation dialogs for irreversible actions (reject)?
- Can he add notes at each stage?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-2.1 | Missing Feature | P1 | No automated reference checking integration (manual process only?) |
| GAP-2.2 | Missing Feature | P2 | No Right to Rent check integration (legal requirement) |
| GAP-2.3 | Data Gap | P2 | No applicant comparison view (side-by-side) |

#### Step 4: Approve Tenant & Generate Agreement

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Navigate to decision page | `/dashboard/landlord/tenants/[applicationId]/decision` | Decision form loads |
| 4.2 | Approve the application | Decision page | Status updated to "approved" |
| 4.3 | Navigate to agreement generation | `/dashboard/landlord/tenants/[applicationId]/tenancy/agreement` | Agreement form loads |
| 4.4 | Review pre-filled agreement details | Agreement page | `TenancyAgreementPDF` / `TenancyAgreementPDFWrapper` renders |
| 4.5 | Customize terms (break clause, pet deposit) | Agreement page | Terms editable |
| 4.6 | Generate AST PDF | Agreement page | PDF generated and downloadable |
| 4.7 | Download agreement | Agreement page | File downloads |

**QA Checkpoints:**
- [ ] Decision page allows approve/reject with reason
- [ ] Approved application triggers agreement generation route
- [ ] `TenancyAgreementPDF` generates valid PDF with all AST required clauses
- [ ] `TenancyAgreementPDFWrapper` handles SSR-disabled PDF rendering (dynamic import)
- [ ] `PDFErrorBoundary` catches @react-pdf/renderer failures gracefully
- [ ] Generated PDF includes: landlord details, tenant details, property address, rent amount, deposit amount, tenancy dates, prescribed clauses
- [ ] `LeasePreview` shows accurate preview before PDF generation

**UX Audit:**
- Is the agreement template legally compliant with current AST requirements?
- Can Marcus preview before generating the PDF?
- Is there a clear path from "approved" to "generate agreement"?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-2.4 | Missing Feature | P2 | No e-signature integration (DocuSign/Adobe Sign) |
| GAP-2.5 | Missing Link | P2 | No direct link from approval to agreement generation |
| GAP-2.6 | Missing Feature | P3 | No agreement template library (standard AST vs custom) |

#### Step 5: Upload Signed Lease

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Both parties sign the printed agreement (offline) | — | Physical signing complete |
| 5.2 | Upload signed copy | Property documents or tenancy page | `TenancyAgreementUpload` component available |
| 5.3 | Confirm upload | Upload form | File stored |

**QA Checkpoints:**
- [ ] `TenancyAgreementUpload` dropzone accepts PDF files
- [ ] Upload associates with correct tenancy record
- [ ] Uploaded lease visible in `/dashboard/landlord/properties/[id]/documents`

#### Step 6: Register Deposit

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Navigate to deposits page | `/dashboard/landlord/deposits` | Deposit list loads |
| 6.2 | Create/view deposit for new tenancy | Deposits page | `DepositCard` shown with "pending" status |
| 6.3 | Enter scheme reference number (TDS/DPS/mydeposits) | Deposits page | Reference stored |
| 6.4 | Mark as "registered" | Deposits page | Status updated via `deposit-service` |

**QA Checkpoints:**
- [ ] `DepositCard` shows correct status (pending → registered)
- [ ] `api/landlord/deposits/[id]` PATCH updates scheme reference and status
- [ ] Deposit amount matches tenancy agreement
- [ ] Deposit protection scheme options include TDS, DPS, mydeposits
- [ ] Registration deadline warning (30 days from receipt)

**UX Audit:**
- Is there a clear link from the new tenancy to deposit registration?
- Does Marcus get reminded of the 30-day deadline?
- Is it obvious what "registered" vs "protected" means?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-2.7 | Missing Feature | P1 | No automatic deposit creation when tenancy is created (manual step) |
| GAP-2.8 | Missing Feature | P1 | No 30-day registration deadline reminder/enforcement |
| GAP-2.9 | Missing Link | P2 | No link from tenancy creation flow to deposit registration |

#### Step 7: Schedule Check-In Inventory

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 7.1 | Navigate to inventory check-in | `/dashboard/landlord/inventory/[propertyId]/check-in` | Inventory form loads |
| 7.2 | Fill in room-by-room condition report | Inventory page | `InventoryRoomForm` for each room |
| 7.3 | Upload photos per room | Inventory page | Photos compress and store |
| 7.4 | Generate inventory report | Inventory page | `InventoryPdfButton` creates PDF |
| 7.5 | Download report for tenant signing | Inventory page | PDF downloads |

**QA Checkpoints:**
- [ ] `InventoryRoomForm` renders for configurable number of rooms
- [ ] Photo upload works per room with compression
- [ ] `InventoryPdfButton` generates downloadable PDF
- [ ] `api/landlord/inventory` POST creates report correctly
- [ ] Report saved and retrievable via `api/landlord/inventory/[reportId]` GET

**UX Audit:**
- Is room-by-room entry tedious for a 2-bed flat? (5 rooms minimum: 2 bedrooms, kitchen, bathroom, living room)
- Can Marcus add custom rooms (hallway, garden)?
- Are there condition templates (excellent/good/fair/poor) or free text only?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-2.10 | Missing Link | P2 | No link from tenancy creation to inventory check-in |
| GAP-2.11 | Missing Feature | P3 | No tenant counter-sign flow for inventory |

### Scenario 2 Scorecard

| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Task Completion | — | Full pipeline from application to move-in? |
| Efficiency | — | How many pages in the full flow? |
| Error Handling | — | Invalid state transitions, failed uploads, PDF errors |
| Empty/Edge States | — | Zero applications, first tenant, no references |
| Information Architecture | — | Pipeline → detail → decision → agreement → deposit → inventory |
| Delight & Polish | — | Stage transition animations, progress tracking |

### Scenario 2 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-2.1 | Missing Feature | P1 | No automated reference checking |
| GAP-2.2 | Missing Feature | P2 | No Right to Rent check |
| GAP-2.3 | Data Gap | P2 | No applicant comparison view |
| GAP-2.4 | Missing Feature | P2 | No e-signature integration |
| GAP-2.5 | Missing Link | P2 | No approval → agreement link |
| GAP-2.6 | Missing Feature | P3 | No agreement template library |
| GAP-2.7 | Missing Feature | P1 | No auto deposit creation with tenancy |
| GAP-2.8 | Missing Feature | P1 | No 30-day deadline reminder |
| GAP-2.9 | Missing Link | P2 | No tenancy → deposit link |
| GAP-2.10 | Missing Link | P2 | No tenancy → inventory link |
| GAP-2.11 | Missing Feature | P3 | No tenant counter-sign for inventory |

---

## Scenario 3: The Portfolio Commander

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | David |
| **Age** | 52 |
| **Properties** | 12 (London and Birmingham mix) |
| **Tech comfort** | High — uses financial dashboards, spreadsheets |
| **Situation** | Portfolio landlord, 8 self-managed, 4 via letting agent. Morning routine: check everything in 2 minutes. |
| **Goal** | Understand portfolio health instantly: occupancy, rent collection, compliance, maintenance |
| **Emotional state** | Efficient, time-poor, wants data not fluff |

### FAANG Benchmark

**Stripe Dashboard** — Instant overview with real-time data, drill-down from aggregate to detail, sparkline trends, configurable date ranges, zero loading spinners on cached data.

### End-to-End Journey

#### Step 1: Dashboard KPI Overview

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Login and land on dashboard | `/dashboard/landlord` | KPIs load instantly |
| 1.2 | Scan KPI cards | Dashboard | `KpiCard` × N showing key metrics |
| 1.3 | Check portfolio health score | Dashboard | `HealthScoreCard` renders with score |

**QA Checkpoints:**
- [ ] Dashboard loads in under 2 seconds with 12 properties
- [ ] `KpiCard` shows: total properties, occupancy rate, monthly income, outstanding maintenance, compliance alerts
- [ ] `HealthScoreCard` calculates across all properties
- [ ] Trend indicators (up/down arrows) are accurate vs previous period
- [ ] `KpiCard` variant switches correctly (default/warning/danger based on thresholds)

**UX Audit:**
- Can David get the full picture without scrolling? (Above-the-fold KPIs)
- Do KPIs have drill-down capability (click occupancy → see which properties are vacant)?
- Is loading state handled? (Skeleton loaders vs spinners)

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-3.1 | Data Gap | P1 | KPIs may not aggregate correctly across 12 properties (performance) |
| GAP-3.2 | Missing Feature | P2 | No occupancy rate drill-down to vacant properties |
| GAP-3.3 | Missing Feature | P2 | No agent-managed vs self-managed property filter |

#### Step 2: Rent Collection Status

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to rent collection | `/dashboard/landlord/rent` | Rent overview loads |
| 2.2 | See paid/partial/overdue grouping | Rent page | `RentPaymentRow` components grouped by status |
| 2.3 | Identify overdue payments | Rent page | Overdue highlighted |
| 2.4 | Click into specific property rent detail | `/dashboard/landlord/rent/[propertyId]` | Per-property rent history |

**QA Checkpoints:**
- [ ] `api/landlord/rent` GET returns data grouped by paid/partial/overdue
- [ ] `RentPaymentRow` shows tenant name, property, amount, status, due date
- [ ] `RentStatusIndicator` correctly categorizes: paid, due soon, overdue, upcoming
- [ ] Per-property rent page shows payment history timeline
- [ ] 12 properties' rent data loads without pagination issues

**UX Audit:**
- Is overdue rent prominently highlighted (not buried)?
- Can David mark rent as received from the overview (one-click) or must he drill in?
- Is there a "chase" action (send reminder to tenant)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-3.4 | Missing Feature | P2 | No bulk "mark as paid" for multiple properties |
| GAP-3.5 | Missing Feature | P2 | No automated rent reminder to tenant |
| GAP-3.6 | Missing Feature | P3 | No bank feed integration for auto-reconciliation |

#### Step 3: Compliance Scan

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate to compliance | `/dashboard/landlord/compliance` | Compliance overview loads |
| 3.2 | Check expiry alerts | `/dashboard/landlord/compliance/alerts` | `ComplianceAlertBanner` shows upcoming expiries |
| 3.3 | Review calendar view | Compliance page | `ComplianceExpiryCalendar` renders |

**QA Checkpoints:**
- [ ] Compliance page aggregates across all 12 properties
- [ ] `CertificateStatusTile` shows counts per category (gas, electrical, EPC, deposit)
- [ ] `ComplianceExpiryCalendar` handles 12 properties × multiple cert types without UI overflow
- [ ] `ComplianceAlertBanner` shows: document type, property, expiry date, days until expiry
- [ ] Sort/filter by urgency works (expired first, then 7-day, 30-day, 90-day)

**UX Audit:**
- Can David see "how many things are red?" in one glance?
- Is the calendar view useful at portfolio scale or overwhelming?
- Can he filter by property, by cert type?

#### Step 4: Maintenance Inbox

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Navigate to maintenance | `/dashboard/landlord/maintenance` | Maintenance list loads |
| 4.2 | Scan `MaintenanceList` for new/urgent items | Maintenance page | `MaintenancePriorityBadge` and `MaintenanceStatusBadge` visible |
| 4.3 | Sort by priority (emergency first) | Maintenance page | List reorders |

**QA Checkpoints:**
- [ ] `MaintenanceList` loads all requests across 12 properties
- [ ] `MaintenancePriorityBadge` shows emergency/high/medium/low correctly
- [ ] `MaintenanceStatusBadge` shows current status accurately
- [ ] Filtering by status and priority works via `api/landlord/maintenance` query params
- [ ] Clicking a request navigates to `/dashboard/landlord/maintenance/[id]`

**UX Audit:**
- Is the priority system visible and clear from the list view?
- Can David identify which property each request is for without clicking in?

#### Step 5: Analytics Review

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Navigate to analytics | `/dashboard/landlord/analytics` | Charts load |
| 5.2 | View income trend | Analytics page | `PortfolioAnalyticsCharts` income area chart |
| 5.3 | View occupancy by month | Analytics page | Occupancy bar chart |
| 5.4 | View property type breakdown | Analytics page | Donut chart |

**QA Checkpoints:**
- [ ] `PortfolioAnalyticsCharts` renders all three chart types without error
- [ ] Income trend shows accurate monthly data for last 12 months
- [ ] Occupancy chart handles mix of occupied/vacant correctly
- [ ] Charts handle 12-property dataset without performance issues
- [ ] Recharts library renders correctly (no missing deps)

**UX Audit:**
- Are charts interactive (hover for values)?
- Can David compare individual property performance?
- Is yield calculator accessible from analytics?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-3.7 | Missing Link | P2 | No direct link from analytics to yield calculator |
| GAP-3.8 | Missing Feature | P2 | No per-property analytics comparison |
| GAP-3.9 | Missing Feature | P3 | No exportable analytics report |

#### Step 6: Yield Calculator Comparison

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Navigate to yield calculator | `/dashboard/landlord/tools/yield-calculator` | Calculator loads |
| 6.2 | Compare yields across properties | Yield calculator | Multi-property comparison |

**QA Checkpoints:**
- [ ] Yield calculator renders with input fields
- [ ] Calculation is accurate (gross yield = annual rent / property value × 100)
- [ ] Can calculate for existing properties (pre-fill from data)
- [ ] Can calculate for hypothetical properties (manual input)

**UX Audit:**
- Does the calculator pre-fill data from David's existing 12 properties?
- Can he see a ranked comparison (highest to lowest yield)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-3.10 | Missing Feature | P2 | Yield calculator may not pre-fill from existing property data |
| GAP-3.11 | Missing Feature | P2 | No net yield calculation (accounting for expenses) |

### Scenario 3 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-3.1 | Data Gap | P1 | KPI aggregation performance at scale |
| GAP-3.2 | Missing Feature | P2 | No occupancy drill-down |
| GAP-3.3 | Missing Feature | P2 | No agent-managed filter |
| GAP-3.4 | Missing Feature | P2 | No bulk mark-as-paid |
| GAP-3.5 | Missing Feature | P2 | No automated rent reminders |
| GAP-3.6 | Missing Feature | P3 | No bank feed integration |
| GAP-3.7 | Missing Link | P2 | No analytics → yield calculator link |
| GAP-3.8 | Missing Feature | P2 | No per-property analytics comparison |
| GAP-3.9 | Missing Feature | P3 | No exportable analytics report |
| GAP-3.10 | Missing Feature | P2 | Yield calculator may not pre-fill |
| GAP-3.11 | Missing Feature | P2 | No net yield calculation |

---

## Scenario 4: The Emergency Responder

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya |
| **Age** | 38 |
| **Properties** | 3 (London suburbs) |
| **Tech comfort** | High — uses apps for everything |
| **Situation** | On holiday in Portugal, gets a WhatsApp from tenant: "Pipe burst, water everywhere!" |
| **Goal** | Triage, find tradesperson, assign, track resolution — all from mobile |
| **Emotional state** | Stressed, time-critical, needs speed and clarity |

### FAANG Benchmark

**Uber Incident Management** — Real-time status tracking, one-tap actions, clear escalation path, push notifications, mobile-first design, ETA and cost transparency.

### End-to-End Journey

#### Step 1: Alert & Triage

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Open dashboard on mobile | `/dashboard/landlord` | Mobile-responsive layout |
| 1.2 | See maintenance alert/notification | Dashboard | Alert visible |
| 1.3 | Navigate to maintenance | `/dashboard/landlord/maintenance` | List loads on mobile |

**QA Checkpoints:**
- [ ] Dashboard is fully responsive on mobile viewport (375px width)
- [ ] `LandlordSidebar` collapses to mobile menu
- [ ] `MaintenanceList` is usable on mobile (no horizontal scroll)
- [ ] Emergency items highlighted prominently

**UX Audit:**
- Can Priya see urgent items without navigating? (Dashboard should surface emergencies)
- Is the mobile sidebar easy to use with one hand?
- How many taps from dashboard to maintenance detail?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-4.1 | Missing Feature | P1 | No push notification system for emergencies |
| GAP-4.2 | Mobile Gap | P1 | Mobile responsiveness of maintenance flow untested |
| GAP-4.3 | Missing Feature | P2 | No tenant-initiated maintenance request (tenant creates, landlord sees) |

#### Step 2: Create Emergency Maintenance Request

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to property's maintenance section | `/dashboard/landlord/properties/[id]/maintenance` | Property maintenance loads |
| 2.2 | Create new request | `/dashboard/landlord/properties/[id]/maintenance/new` | `MaintenanceForm` loads |
| 2.3 | Set priority to "Emergency" | Form | Priority field set |
| 2.4 | Select category (plumbing) | Form | Category selected |
| 2.5 | Add description and tenant-provided photos | Form | Data entered |
| 2.6 | Submit | Form | Request created with emergency status |

**QA Checkpoints:**
- [ ] `MaintenanceForm` renders correctly on mobile
- [ ] Priority options include "Emergency" with clear visual distinction
- [ ] Photo upload works on mobile (camera capture option)
- [ ] `maintenance-service` creates request with correct priority
- [ ] Emergency priority triggers any escalation logic

**UX Audit:**
- Can Priya submit in under 60 seconds on mobile?
- Is photo upload from mobile camera smooth?
- Does "Emergency" selection change the flow (faster path)?

#### Step 3: Find & Assign Tradesperson

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate to assignment page | `/dashboard/landlord/maintenance/[id]/assign` | Assignment page loads |
| 3.2 | Search for local plumber | Assignment page | `ProviderAssignment` / `TradesPersonAssignModal` renders |
| 3.3 | View available providers with ratings | Assignment page | Provider list with ratings |
| 3.4 | Select and assign provider | Assignment page | `api/landlord/maintenance/[id]/assign` PATCH |
| 3.5 | See status transition to "assigned" | Request detail | `MaintenanceStatusBadge` updates |

**QA Checkpoints:**
- [ ] `ProviderAssignment` component loads available providers
- [ ] `TradesPersonAssignModal` shows providers filtered by category and location
- [ ] Provider assignment via API updates status to "assigned" automatically
- [ ] Status transition: new → acknowledged → assigned is valid
- [ ] Can skip "acknowledged" for emergency? (new → assigned)

**UX Audit:**
- Is the provider search pre-filtered by category (plumbing) and location (property postcode)?
- Can Priya see ratings, reviews, availability?
- Is there an "emergency available" filter?
- How many taps from "burst pipe" to "plumber assigned"?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-4.4 | Missing Feature | P2 | No emergency availability filter for providers |
| GAP-4.5 | Missing Feature | P2 | No direct messaging to assigned provider |
| GAP-4.6 | Missing Feature | P2 | No quote/cost estimate before assignment |

#### Step 4: Track & Resolve

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Monitor maintenance request status | `/dashboard/landlord/maintenance/[id]` | Status updates visible |
| 4.2 | Update status as work progresses | Request detail | `api/landlord/maintenance/[id]/status` PATCH |
| 4.3 | Add notes about resolution | Request detail | `api/landlord/maintenance/[id]/notes` PATCH |
| 4.4 | Mark as resolved | Request detail | Status → "resolved" |
| 4.5 | Close request | Request detail | Status → "closed" |

**QA Checkpoints:**
- [ ] Status state machine enforces valid transitions: new → acknowledged → assigned → in_progress → resolved → closed
- [ ] `MaintenanceStatusBadge` updates in real-time (or on refresh)
- [ ] Notes PATCH works and displays updated notes
- [ ] Status history is tracked (who changed what, when)

#### Step 5: Log Expense

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Navigate to expenses | `/dashboard/landlord/finance/expenses` | Expense form accessible |
| 5.2 | Create new expense entry | Expenses page | `FinancialEntryForm` loads |
| 5.3 | Enter plumber cost, attach receipt | Form | Data entered |
| 5.4 | Submit | Form | `financial-service` creates entry |

**QA Checkpoints:**
- [ ] `FinancialEntryForm` captures: amount, category (maintenance), date, property, notes, receipt
- [ ] Receipt photo upload works
- [ ] Entry associated with correct property
- [ ] Entry visible in `/dashboard/landlord/finance/report`

**UX Audit:**
- Is there a link from closed maintenance request to "log expense"?
- Can Priya photograph the plumber's invoice on mobile and attach directly?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-4.7 | Missing Link | P1 | No link from resolved maintenance request to expense creation |
| GAP-4.8 | Missing Feature | P2 | No maintenance cost tracking within the maintenance request itself |
| GAP-4.9 | Missing Feature | P3 | No auto-expense-creation when maintenance is resolved with known cost |

### Scenario 4 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-4.1 | Missing Feature | P1 | No push notifications |
| GAP-4.2 | Mobile Gap | P1 | Mobile responsiveness untested |
| GAP-4.3 | Missing Feature | P2 | No tenant-initiated maintenance |
| GAP-4.4 | Missing Feature | P2 | No emergency availability filter |
| GAP-4.5 | Missing Feature | P2 | No direct messaging to provider |
| GAP-4.6 | Missing Feature | P2 | No quote/cost estimate |
| GAP-4.7 | Missing Link | P1 | No maintenance → expense link |
| GAP-4.8 | Missing Feature | P2 | No cost tracking in maintenance |
| GAP-4.9 | Missing Feature | P3 | No auto-expense from maintenance |

---

## Scenario 5: The Compliance Warrior

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Ahmed |
| **Age** | 60 |
| **Properties** | 6 (mixed portfolio across West Midlands) |
| **Tech comfort** | Medium — uses email and basic web apps |
| **Situation** | Heard about a landlord prosecuted for missing gas safety cert. Terrified of non-compliance. |
| **Goal** | Verify all 6 properties are fully compliant — no gaps, no expired certs |
| **Emotional state** | Anxious, needs certainty and proof |

### FAANG Benchmark

**Notion Database Views** — Filtered views, status indicators with color coding, bulk operations, calendar view, grouped by status, export capability.

### End-to-End Journey

#### Step 1: Compliance Dashboard Overview

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to compliance | `/dashboard/landlord/compliance` | Compliance overview loads |
| 1.2 | See `CertificateStatusTile` per category | Compliance page | Gas, Electrical, EPC, Deposit tiles |
| 1.3 | Identify which tiles show warnings | Compliance page | Expired/expiring counts visible |

**QA Checkpoints:**
- [ ] `CertificateStatusTile` renders for each compliance category
- [ ] Expired count, expiring count, active count per category accurate
- [ ] Tile links to filtered detail view
- [ ] 6 properties × 4+ cert types aggregated correctly

**UX Audit:**
- Can Ahmed see "am I compliant?" in one glance (green/amber/red traffic light)?
- Is the distinction between "expired" (legal problem) and "expiring soon" (action needed) clear?

#### Step 2: Review Expiring Certificates

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to compliance alerts | `/dashboard/landlord/compliance/alerts` | Alerts list loads |
| 2.2 | See `ComplianceAlertBanner` for each issue | Alerts page | Banners show type, property, date, days until expiry |
| 2.3 | Filter by urgency | Alerts page | 7-day, 30-day, 90-day filters |

**QA Checkpoints:**
- [ ] `ComplianceAlertBanner` renders for each expiring/expired document
- [ ] Days-until-expiry calculation is accurate (handles leap years, timezone)
- [ ] Already-expired documents show negative days or "EXPIRED" label
- [ ] Filtering works correctly
- [ ] Sort by urgency (most urgent first) is default

**UX Audit:**
- Are the most urgent items at the top?
- Is the "days until expiry" color-coded (red < 7 days, amber < 30, green > 90)?
- Can Ahmed filter by property to see one property's compliance at a time?

#### Step 3: Upload Renewed Gas Safety Certificate

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click "Upload" on expiring gas safety alert | `/dashboard/landlord/compliance/upload` | Upload form, property pre-selected |
| 3.2 | Upload new certificate | Upload form | `ComplianceUploadForm` handles upload |
| 3.3 | Enter new expiry date | Upload form | Date validated (must be in future) |
| 3.4 | Submit | Upload form | Old cert superseded, new cert active |

**QA Checkpoints:**
- [ ] `ComplianceUploadForm` pre-selects property and doc type from alert link
- [ ] Upload via `api/landlord/compliance/upload` POST succeeds
- [ ] Previous certificate is archived (not deleted — audit trail)
- [ ] New certificate's expiry date updates the compliance calendar
- [ ] `ComplianceExpiryCalendar` reflects the change

**UX Audit:**
- Is pre-selection from the alert working (no re-entering property)?
- Does Ahmed see a success confirmation after upload?
- Does the compliance tile update in real-time?

#### Step 4: Review EPC Status

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Check EPC certificates across portfolio | Compliance page | EPC tile shows all 6 properties |
| 4.2 | Verify ratings meet MEES requirements | Compliance page | Ratings visible (must be E or above) |

**QA Checkpoints:**
- [ ] EPC ratings displayed per property
- [ ] Properties with EPC below E flagged

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-5.1 | Missing Feature | P1 | No EICR (Electrical Installation Condition Report) tracking — required since 2020 |
| GAP-5.2 | Missing Feature | P2 | No "How to Rent" guide served tracking (legal requirement) |
| GAP-5.3 | Missing Feature | P2 | No Right to Rent check tracking |
| GAP-5.4 | Missing Feature | P2 | No bulk upload for renewing multiple certs at once |

#### Step 5: Review Compliance Calendar

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | View calendar view of all compliance dates | Compliance page | `ComplianceExpiryCalendar` renders |
| 5.2 | Scan next 12 months for upcoming expiries | Calendar | Future dates highlighted |

**QA Checkpoints:**
- [ ] `ComplianceExpiryCalendar` shows all cert expiry dates
- [ ] Calendar handles 6 properties × multiple cert types without visual clutter
- [ ] Status badges (expired, expiring, active, missing) color-coded correctly
- [ ] Can navigate between months

**UX Audit:**
- Is the calendar the right visualization for compliance? (Timeline might be better for 6 properties)
- Can Ahmed export the compliance calendar?

#### Step 6: Verify All Green & Download Report

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Return to compliance overview | `/dashboard/landlord/compliance` | All tiles show green after renewals |
| 6.2 | Look for "download compliance report" | Compliance page | Report generation available |

**QA Checkpoints:**
- [ ] After all uploads, compliance tiles show 100% compliant
- [ ] No false positives (missing cert type shows as "not applicable" vs "missing" where appropriate)

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-5.5 | Missing Feature | P2 | No downloadable compliance report/summary |
| GAP-5.6 | Missing Feature | P2 | No email notification for upcoming expiries |
| GAP-5.7 | Missing Feature | P3 | No integration with gas safety/EICR engineer booking |

### Scenario 5 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-5.1 | Missing Feature | P1 | No EICR tracking |
| GAP-5.2 | Missing Feature | P2 | No "How to Rent" guide tracking |
| GAP-5.3 | Missing Feature | P2 | No Right to Rent check tracking |
| GAP-5.4 | Missing Feature | P2 | No bulk cert upload |
| GAP-5.5 | Missing Feature | P2 | No downloadable compliance report |
| GAP-5.6 | Missing Feature | P2 | No email notification for expiries |
| GAP-5.7 | Missing Feature | P3 | No engineer booking integration |

---

## Scenario 6: The Eviction Navigator

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Janet |
| **Age** | 55 |
| **Properties** | 1 (terraced house in Leeds) |
| **Tech comfort** | Low-medium — needs clear, simple interfaces |
| **Situation** | Tenant 4 months in arrears. Reluctant to evict but can't afford the mortgage shortfall. |
| **Goal** | Serve a valid Section 8 notice (rent arrears) with all legal pre-requisites satisfied |
| **Emotional state** | Stressed, guilty, scared of legal mistakes, needs legal confidence |

### FAANG Benchmark

**TurboTax** — Guided step-by-step flow with validation gates, plain-English explanations of legal jargon, confidence-building messaging, pre-flight checklist, cannot proceed until all gates are green.

### End-to-End Journey

#### Step 1: Navigate to Legal Notices

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to legal notices | `/dashboard/landlord/legal/notices` | Legal notices page loads |
| 1.2 | See option to create new notice | Legal notices | Create button visible |
| 1.3 | Select property | Legal notices | Property selector available |

**QA Checkpoints:**
- [ ] Legal notices page renders
- [ ] Existing notices listed (if any)
- [ ] Create new notice flow accessible
- [ ] Property selection works

**UX Audit:**
- Is the legal section easy to find from the sidebar?
- Is there introductory text explaining what Section 8 and Section 21 are?
- Is the language supportive (not legalistic)?

#### Step 2: Pre-Flight Checklist

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | System checks pre-requisites for selected property | Legal notices | `Section21PreflightChecklist` or equivalent for Section 8 |
| 2.2 | Checklist items: | | |
| | — Deposit registered? | | `deposit-service` lookup |
| | — Gas safety certificate valid? | | `document-service` lookup |
| | — EPC provided to tenant? | | `document-service` lookup |
| | — How to Rent guide served? | | Document check |
| 2.3 | Failed items highlighted with fix actions | Checklist | Red items with links to resolve |

**QA Checkpoints:**
- [ ] `Section21PreflightChecklist` (or Section 8 equivalent) checks all 4 mandatory items
- [ ] Each check queries the correct service for current status
- [ ] Failed checks show clear explanation of why it fails
- [ ] Failed checks provide direct link to resolution (e.g., "Upload gas safety cert" → compliance upload)
- [ ] Cannot proceed to notice generation until all checks pass

**UX Audit:**
- Is the checklist in plain English ("Your gas safety certificate has expired" not "CP12 non-compliant")?
- Does each failed item explain WHY it matters (legal consequence)?
- Is the "fix it" action one click away?
- Is there a "not sure what this means?" help link?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-6.1 | Missing Feature | P1 | `Section21PreflightChecklist` exists but Section 8 equivalent may not |
| GAP-6.2 | Missing Feature | P1 | How to Rent guide tracking not implemented (required pre-req for S21) |
| GAP-6.3 | Missing Link | P2 | Failed checklist items may not link directly to resolution pages |

#### Step 3: Fix Gaps (If Any)

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Click failed item to fix | Various (compliance/deposits) | Resolution page loads |
| 3.2 | Complete required action | Various | Gap resolved |
| 3.3 | Return to checklist | Legal notices | Item now green |

**QA Checkpoints:**
- [ ] Navigation from checklist to fix page preserves context (returns to checklist after)
- [ ] Fixed items update in real-time when returning to checklist
- [ ] Checklist re-validates on return (no cached stale data)

#### Step 4: Generate Section 8 Notice

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | All checklist items green — proceed button enabled | Legal notices | Proceed button active |
| 4.2 | Select Section 8 notice type | Legal notices | Form opens |
| 4.3 | Select grounds: Ground 8 (mandatory, 8+ weeks arrears) and Ground 10 (discretionary, some rent unpaid) | Form | Grounds selected |
| 4.4 | System calculates arrears amount | Form | Auto-calculated from rent records |
| 4.5 | Preview notice | Form | `Section8NoticePDF` renders preview |

**QA Checkpoints:**
- [ ] `Section8NoticePDF` generates legally correct Housing Act 1988 Section 8 notice
- [ ] Ground selection provides descriptions of each ground
- [ ] Ground 8 requires minimum 8 weeks' arrears — validated against rent records
- [ ] Arrears calculation pulls from `financial-service` / rent records
- [ ] Preview renders complete PDF with all required legal elements
- [ ] `legal-notice-service` validates all prerequisites (pure function)

**UX Audit:**
- Are the grounds explained in plain English alongside legal names?
- Is the arrears amount auto-calculated (Janet doesn't need to do maths)?
- Is the preview readable (not tiny PDF viewer)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-6.4 | Missing Feature | P1 | Arrears auto-calculation from rent records may not be implemented |
| GAP-6.5 | Data Gap | P2 | Ground descriptions may be too legal/technical |
| GAP-6.6 | Missing Feature | P2 | No "speak to a solicitor" signpost for complex cases |

#### Step 5: Serve & Track Notice

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Download/email notice to tenant | Legal notices | PDF downloaded |
| 5.2 | Record date of service | Legal notices | Service date logged |
| 5.3 | Track notice period (2 weeks for Ground 8) | Legal notices | Countdown visible |
| 5.4 | Record outcome when period expires | Legal notices | Status updated |

**QA Checkpoints:**
- [ ] Notice can be downloaded as PDF
- [ ] Service date is recorded for legal timeline tracking
- [ ] Notice status tracking works (served → expired → court action / tenant vacated)

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-6.7 | Missing Feature | P2 | No notice service tracking (date served, method of service) |
| GAP-6.8 | Missing Feature | P2 | No countdown timer for notice period |
| GAP-6.9 | Missing Feature | P3 | No court action guidance after notice expires |

### Scenario 6 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-6.1 | Missing Feature | P1 | No Section 8 pre-flight checklist |
| GAP-6.2 | Missing Feature | P1 | No How to Rent guide tracking |
| GAP-6.3 | Missing Link | P2 | No checklist → resolution page links |
| GAP-6.4 | Missing Feature | P1 | No arrears auto-calculation |
| GAP-6.5 | Data Gap | P2 | Legal grounds descriptions too technical |
| GAP-6.6 | Missing Feature | P2 | No solicitor referral signpost |
| GAP-6.7 | Missing Feature | P2 | No notice service date tracking |
| GAP-6.8 | Missing Feature | P2 | No notice period countdown |
| GAP-6.9 | Missing Feature | P3 | No court action guidance |

---

## Scenario 7: The Overseas Landlord

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Chen |
| **Age** | 40 |
| **Properties** | 2 (flats in Leeds) |
| **Tech comfort** | High — manages everything digitally |
| **Situation** | Lives in Singapore (UTC+8), manages 1 property via agent, 1 self-managed. Monthly check-in routine. |
| **Goal** | Complete monthly management tasks across time zones with minimal friction |
| **Emotional state** | Pragmatic, values efficiency, expects async-friendly design |

### FAANG Benchmark

**GitHub** — Async-first design, clear notification badges, works across timezones, activity feed, comment threads, status checks that don't require real-time presence.

### End-to-End Journey

#### Step 1: Login & Dashboard Check

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Login from Singapore (9 PM SGT = 1 PM GMT) | `/login` → `/dashboard/landlord` | Dashboard loads |
| 1.2 | Check dashboard KPIs | Dashboard | `KpiCard` data accurate regardless of timezone |

**QA Checkpoints:**
- [ ] Login works across timezone (session not timezone-dependent)
- [ ] Date calculations (rent due dates, compliance expiry) use correct timezone
- [ ] Dashboard timestamps show local time or clearly indicate timezone
- [ ] No "day-off-by-one" errors for date calculations across timezone boundaries

**UX Audit:**
- Do dates show in user's local timezone or property timezone?
- Is there any timezone indicator?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-7.1 | Edge Case | P1 | Timezone handling for date calculations (rent due, cert expiry) may be incorrect |
| GAP-7.2 | Data Gap | P2 | No timezone display/preference setting |

#### Step 2: Rent Collection Check

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to rent | `/dashboard/landlord/rent` | Rent overview loads |
| 2.2 | See both properties' rent status | Rent page | 2 entries visible |
| 2.3 | Mark self-managed property rent as received (bank transfer confirmed) | Rent page | `api/landlord/rent/[entryId]/mark-paid` PATCH |

**QA Checkpoints:**
- [ ] Both properties visible (agent-managed and self-managed)
- [ ] Mark-as-paid PATCH works correctly
- [ ] Payment method can be recorded (bank transfer, standing order, cash)
- [ ] Agent-managed property shows rent status from agent side (if integrated)

**UX Audit:**
- Can Chen distinguish agent-managed vs self-managed properties?
- Is "mark as paid" a one-click action?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-7.3 | Missing Feature | P2 | No agent management integration (agent doesn't have dashboard access or reporting) |
| GAP-7.4 | Missing Feature | P3 | No payment method recording |

#### Step 3: Review Maintenance Request

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate to maintenance | `/dashboard/landlord/maintenance` | Requests listed |
| 3.2 | View request detail | `/dashboard/landlord/maintenance/[id]` | Detail loads |
| 3.3 | Need clarification from tenant | Detail page | Look for messaging option |

**QA Checkpoints:**
- [ ] Maintenance list shows property address for easy identification
- [ ] Request detail includes tenant contact info

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-7.5 | Missing Feature | P1 | No in-app messaging system (Chen needs to message tenant without exchanging personal phone numbers) |
| GAP-7.6 | Missing Link | P2 | No link from maintenance request to tenant contact/messaging |

#### Step 4: Assign Local Tradesperson

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Navigate to assign page | `/dashboard/landlord/maintenance/[id]/assign` | Assignment page loads |
| 4.2 | Find tradesperson near Leeds property | Assignment page | `TradesPersonAssignModal` with location filter |
| 4.3 | Assign provider | Assignment page | Status updates to "assigned" |

**QA Checkpoints:**
- [ ] Provider search works by property location (not user location)
- [ ] Providers are in the correct area (Leeds, not Singapore)

#### Step 5: Financial Review & Tax Export

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Navigate to finance report | `/dashboard/landlord/finance/report` | Report loads |
| 5.2 | Review monthly summary | Report page | `FinancialSummary` with period presets |
| 5.3 | Navigate to tax page | `/dashboard/landlord/finance/tax` | Tax summary loads |
| 5.4 | Export tax summary for UK accountant | Tax page | `TaxSummaryExport` generates CSV/PDF |

**QA Checkpoints:**
- [ ] `FinancialSummary` period presets work (this month, quarter, YTD, last 12 months)
- [ ] `TaxSummaryExport` generates valid CSV and PDF
- [ ] Tax summary covers UK tax year (6 April - 5 April)
- [ ] Non-Resident Landlord (NRL) status considered (HMRC NRL scheme)
- [ ] Export downloads to device correctly

**UX Audit:**
- Does the tax summary use UK tax year dates by default?
- Is the export format suitable for UK accountants (SA105 categories)?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-7.7 | Missing Feature | P2 | No NRL scheme awareness (non-resident landlords have different tax obligations) |
| GAP-7.8 | Missing Feature | P3 | No SA105 (UK property supplement) category mapping |

### Scenario 7 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-7.1 | Edge Case | P1 | Timezone handling for date calculations |
| GAP-7.2 | Data Gap | P2 | No timezone display/preference |
| GAP-7.3 | Missing Feature | P2 | No agent management integration |
| GAP-7.4 | Missing Feature | P3 | No payment method recording |
| GAP-7.5 | Missing Feature | P1 | No in-app messaging |
| GAP-7.6 | Missing Link | P2 | No maintenance → messaging link |
| GAP-7.7 | Missing Feature | P2 | No NRL scheme awareness |
| GAP-7.8 | Missing Feature | P3 | No SA105 category mapping |

---

## Scenario 8: The HMO Landlord

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Raj |
| **Age** | 48 |
| **Properties** | 1 (5-bed HMO in Bristol, converted Victorian house) |
| **Tech comfort** | Medium-high |
| **Situation** | Licensed HMO landlord. 5 individual tenants with separate tenancy agreements. One tenant leaving. |
| **Goal** | Process check-out, return deposit, re-list room, screen new tenant, create tenancy, update rent tracking |
| **Emotional state** | Experienced, efficient, knows HMO is complex, wants software that handles it |

### FAANG Benchmark

**Shopify Multi-Variant Management** — Handle product complexity (sizes/colors/stock) without overwhelming the UI. One product → multiple variants → individual tracking. In our case: one property → multiple rooms → individual tenancies.

### End-to-End Journey

#### Step 1: View Property with Multiple Tenancies

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to property detail | `/dashboard/landlord/properties/[id]` | Property page loads |
| 1.2 | View tenancies tab | `/dashboard/landlord/properties/[id]/tenancies` | All 5 tenancies listed |
| 1.3 | Identify leaving tenant's tenancy | Tenancies page | `TenancyStatusBadge` shows "ending soon" |

**QA Checkpoints:**
- [ ] Property detail supports multiple active tenancies
- [ ] Tenancy list shows all 5 current tenants with room assignment
- [ ] `TenancyStatusBadge` correctly identifies "ending soon" based on end date
- [ ] Each tenancy shows: tenant name, room, rent amount, start/end dates, status

**UX Audit:**
- Is the multi-tenancy view clear (not just a list of tenancies but room-based)?
- Can Raj see which rooms are occupied vs vacant at a glance?
- Is there a property-level vs room-level view toggle?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.1 | Edge Case | P1 | Multi-tenancy per property may not be fully supported (HMO model) |
| GAP-8.2 | Missing Feature | P1 | No room-level tracking (tenancies may only be property-level) |
| GAP-8.3 | Missing Feature | P2 | No HMO license tracking (separate compliance requirement) |

#### Step 2: Process Check-Out

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to check-out inventory | `/dashboard/landlord/inventory/[propertyId]/check-out` | Check-out form loads |
| 2.2 | Complete room condition report for leaving tenant's room | Check-out page | `InventoryRoomForm` for specific room |
| 2.3 | Upload photos of room condition | Check-out form | Photos uploaded |
| 2.4 | Compare with check-in inventory | Check-out page | Side-by-side comparison |
| 2.5 | Generate check-out report | Check-out page | `InventoryPdfButton` creates PDF |

**QA Checkpoints:**
- [ ] Check-out form loads for specific property
- [ ] Can isolate single room for HMO (not whole-property only)
- [ ] `InventoryRoomForm` condition assessment works
- [ ] Check-in vs check-out comparison available
- [ ] `api/landlord/inventory/[reportId]` GET retrieves previous check-in report
- [ ] PDF generation includes comparison data

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.4 | Edge Case | P1 | Check-out may not support per-room inventory for HMO |
| GAP-8.5 | Missing Feature | P2 | No check-in vs check-out side-by-side comparison |

#### Step 3: Handle Deposit Return

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate to deposits | `/dashboard/landlord/deposits` | Deposit list loads |
| 3.2 | Find leaving tenant's deposit | Deposits page | `DepositCard` with "registered" status |
| 3.3 | Process return (full or partial with deductions) | Deposits page | `api/landlord/deposits/[id]` PATCH |
| 3.4 | Mark as "returned" | Deposits page | Status updated |

**QA Checkpoints:**
- [ ] `DepositCard` supports status transition: registered → returned OR registered → disputed
- [ ] Partial return with deductions supported (damage deduction from inventory)
- [ ] Deduction amount with reason can be specified
- [ ] Deposit return recorded as financial entry (expense or contra-entry)

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.6 | Missing Feature | P2 | No deduction calculator linked to inventory damage |
| GAP-8.7 | Missing Link | P2 | No link from deposit return to inventory report (evidence for deductions) |

#### Step 4: Create Listing for Vacant Room

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Navigate to property listing | `/dashboard/landlord/properties/[id]/listing` | Listing page loads |
| 4.2 | Create room-specific listing | Listing page | Room listing form |
| 4.3 | Set room-specific details (size, furnished, rent) | Listing page | Details entered |
| 4.4 | Publish room listing | Listing page | Room visible in search |

**QA Checkpoints:**
- [ ] Can create a room-in-shared-house listing (not whole property)
- [ ] Listing type: "room in shared house" option available
- [ ] Individual room rent vs whole property rent handled

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.8 | Edge Case | P1 | Listing may only support whole-property, not individual rooms |
| GAP-8.9 | Missing Feature | P2 | No shared house/room listing type |

#### Step 5: Screen & Create New Tenancy

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Receive applications for room | `/dashboard/landlord/tenants` | Room-specific applications |
| 5.2 | Screen applicant (same as Scenario 2) | Application pipeline | Standard screening flow |
| 5.3 | Create individual tenancy for room | `/dashboard/landlord/properties/[id]/tenancies` | `TenancyForm` for new tenant |
| 5.4 | Schedule check-in | `/dashboard/landlord/inventory/[propertyId]/check-in` | Check-in form for room |

**QA Checkpoints:**
- [ ] `TenancyForm` creates tenancy scoped to specific room (not whole property)
- [ ] New tenancy doesn't conflict with existing 4 tenancies
- [ ] Individual rent amount for new room

#### Step 6: Update Rent Collection for 5 Tenants

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Navigate to rent collection | `/dashboard/landlord/rent` | Overview loads |
| 6.2 | See 5 individual rent entries for one property | Rent page | 5 `RentPaymentRow` entries |
| 6.3 | Mark individual payments | Rent page | Per-tenant mark-as-paid |

**QA Checkpoints:**
- [ ] Rent collection shows individual entries per tenant (not one lump for property)
- [ ] Can mark individual tenants as paid (one paid, one overdue)
- [ ] Total rent per property calculable from individual entries

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-8.10 | Edge Case | P1 | Rent collection may not support per-tenant tracking in same property |
| GAP-8.11 | Missing Feature | P2 | No shared utility cost splitting between HMO tenants |

### Scenario 8 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-8.1 | Edge Case | P1 | Multi-tenancy per property support |
| GAP-8.2 | Missing Feature | P1 | No room-level tracking |
| GAP-8.3 | Missing Feature | P2 | No HMO license tracking |
| GAP-8.4 | Edge Case | P1 | Per-room inventory for HMO |
| GAP-8.5 | Missing Feature | P2 | No check-in vs check-out comparison |
| GAP-8.6 | Missing Feature | P2 | No deduction calculator |
| GAP-8.7 | Missing Link | P2 | No deposit → inventory link |
| GAP-8.8 | Edge Case | P1 | Room-level listing not supported |
| GAP-8.9 | Missing Feature | P2 | No room listing type |
| GAP-8.10 | Edge Case | P1 | Per-tenant rent in same property |
| GAP-8.11 | Missing Feature | P2 | No utility cost splitting |

---

## Scenario 9: The Tax Season Landlord

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Emma |
| **Age** | 50 |
| **Properties** | 4 (mixed, across North West England) |
| **Tech comfort** | Medium — uses QuickBooks for main business |
| **Situation** | January, accountant needs everything for self-assessment. Dreading the annual tax-paperwork ordeal. |
| **Goal** | Generate complete, accurate financial records for tax year: income, expenses, receipts, per-property P&L |
| **Emotional state** | Overwhelmed, time-pressed, wants to get it done and move on |

### FAANG Benchmark

**QuickBooks Self-Employed** — Smart categorization, tax-year-aware date ranges, receipt capture, one-click export, per-project (property) P&L, guided tax prep, clear categories mapped to tax form lines.

### End-to-End Journey

#### Step 1: Finance Dashboard Overview

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to finance report | `/dashboard/landlord/finance/report` | Financial report loads |
| 1.2 | Set date range to tax year (6 Apr 2025 - 5 Apr 2026) | Report page | `FinancialSummary` updates with period |
| 1.3 | Review high-level income/expense summary | Report page | `FinancialSummary` shows totals |

**QA Checkpoints:**
- [ ] `FinancialSummary` supports custom date range (not just presets)
- [ ] Tax year preset available (6 Apr - 5 Apr)
- [ ] Income total, expense total, net profit calculated correctly
- [ ] `IncomeExpenseChart` shows monthly breakdown for selected period
- [ ] 4 properties' data aggregated correctly

**UX Audit:**
- Is there a "UK Tax Year" preset button? (Not just "this year" which would be Jan-Dec)
- Is the net profit (income - expenses) prominently displayed?
- Can Emma see she's missing data before exporting?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.1 | Missing Feature | P1 | No UK tax year preset (6 Apr - 5 Apr) — "this year" likely means calendar year |
| GAP-9.2 | Missing Feature | P2 | No custom date range picker on financial summary |

#### Step 2: Review Income by Property

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | View income breakdown by property | Report page | Per-property income visible |
| 2.2 | Verify total rent received per property | Report page | Totals match rent records |
| 2.3 | Cross-reference with rent collection | `/dashboard/landlord/rent` | Data consistent |

**QA Checkpoints:**
- [ ] Income entries filterable by property via `api/landlord/finance/entries` query params
- [ ] Per-property totals reconcile with rent collection records
- [ ] No duplicate entries (rent marked as paid AND income entry)

**UX Audit:**
- Is there a per-property view within the finance section?
- Can Emma switch between "all properties" and individual property views easily?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.3 | Data Gap | P2 | Potential double-counting: rent marked as paid in rent section vs income entries in finance |
| GAP-9.4 | Missing Feature | P2 | No per-property P&L report |

#### Step 3: Review Expenses by Category

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate to expenses | `/dashboard/landlord/finance/expenses` | Expense list loads |
| 3.2 | Filter by category (maintenance, insurance, legal, etc.) | Expenses page | Filtered view |
| 3.3 | Identify uncategorized entries | Expenses page | Uncategorized flagged |
| 3.4 | Categorize uncategorized entries | Expenses page | `api/landlord/finance/entries/[id]` PATCH |

**QA Checkpoints:**
- [ ] Expense entries have categories (maintenance, insurance, legal, agent fees, mortgage interest, utilities, etc.)
- [ ] Filter by category works
- [ ] PATCH endpoint allows category update
- [ ] Uncategorized entries are identifiable
- [ ] Categories align with HMRC allowable expenses for property income

**UX Audit:**
- Is the category list comprehensive for UK landlord expenses?
- Can Emma bulk-categorize entries?
- Are HMRC-allowable categories highlighted vs non-allowable?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.5 | Missing Feature | P2 | No HMRC-aligned expense categories |
| GAP-9.6 | Missing Feature | P2 | No bulk categorization |
| GAP-9.7 | Data Gap | P2 | No distinction between allowable and non-allowable expenses |

#### Step 4: Handle Missing Receipt

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Spot expense entry without receipt | Expenses page | Missing receipt indicator |
| 4.2 | Upload receipt photograph | Expenses page | `FinancialEntryForm` receipt upload |
| 4.3 | Receipt attached to entry | Expenses page | Receipt stored via `financial-service` |

**QA Checkpoints:**
- [ ] Entries without receipts are visually flagged
- [ ] Receipt upload works inline (no page navigation)
- [ ] Receipt file stored and associated with entry
- [ ] Multiple receipts per entry supported

**UX Audit:**
- Can Emma upload receipts from mobile (photograph invoices)?
- Is there a "missing receipts" filter?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.8 | Missing Feature | P2 | No "missing receipts" filter view |
| GAP-9.9 | Missing Feature | P3 | No OCR receipt scanning to auto-extract amount/date |

#### Step 5: Generate Tax Summary & Export

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Navigate to tax page | `/dashboard/landlord/finance/tax` | Tax summary loads |
| 5.2 | Review tax summary breakdown | Tax page | Income, expenses, net by property |
| 5.3 | Export as CSV | Tax page | `TaxSummaryExport` generates CSV |
| 5.4 | Export as PDF | Tax page | `TaxSummaryExport` generates PDF |
| 5.5 | Download exports | Tax page | Files download to device |

**QA Checkpoints:**
- [ ] Tax summary page calculates correctly for the tax year
- [ ] `TaxSummaryExport` generates valid CSV (opens in Excel without issues)
- [ ] `TaxSummaryExport` generates valid PDF via @react-pdf/renderer
- [ ] CSV includes: date, property, category, description, amount, type (income/expense)
- [ ] PDF includes summary tables and property-level breakdown
- [ ] Export covers correct date range (UK tax year)

**UX Audit:**
- Is the export format suitable for UK accountants?
- Does the CSV have clear column headers?
- Can Emma preview before downloading?

#### Step 6: Per-Property P&L Review

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Navigate to property-level financials | `/dashboard/landlord/properties/[id]/financials` | Property P&L loads |
| 6.2 | Review income and expenses for this property | Property financials | Filtered to single property |
| 6.3 | Repeat for each property | Properties × 4 | 4 P&L reviews |

**QA Checkpoints:**
- [ ] Per-property financials page shows only that property's entries
- [ ] Income and expenses correctly isolated per property
- [ ] Property-level net profit/loss calculated

**UX Audit:**
- Can Emma navigate between properties easily (next/previous)?
- Is there a single "all properties P&L" comparison view?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-9.10 | Missing Feature | P2 | No multi-property P&L comparison view |
| GAP-9.11 | Missing Feature | P3 | No accountant sharing/invite feature |

### Scenario 9 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-9.1 | Missing Feature | P1 | No UK tax year preset |
| GAP-9.2 | Missing Feature | P2 | No custom date range |
| GAP-9.3 | Data Gap | P2 | Potential double-counting rent/income |
| GAP-9.4 | Missing Feature | P2 | No per-property P&L report |
| GAP-9.5 | Missing Feature | P2 | No HMRC-aligned categories |
| GAP-9.6 | Missing Feature | P2 | No bulk categorization |
| GAP-9.7 | Data Gap | P2 | No allowable/non-allowable distinction |
| GAP-9.8 | Missing Feature | P2 | No missing receipts filter |
| GAP-9.9 | Missing Feature | P3 | No OCR receipt scanning |
| GAP-9.10 | Missing Feature | P2 | No multi-property P&L comparison |
| GAP-9.11 | Missing Feature | P3 | No accountant sharing |

---

## Scenario 10: The Growth Landlord

### Persona

| Attribute | Detail |
|-----------|--------|
| **Name** | Tom |
| **Age** | 35 |
| **Properties** | 2 existing + 1 just purchased (completing on a third) |
| **Tech comfort** | High — tech-savvy, uses fintech apps, data-driven decisions |
| **Situation** | Just completed on a 2-bed flat in Birmingham. Wants to get it rental-ready fast and compare yield. |
| **Goal** | Add property, set up compliance, list it, compare yield against portfolio, find local agent |
| **Emotional state** | Excited, growth-focused, wants ROI validation |

### FAANG Benchmark

**Zillow Listing Creation** — Step-by-step guided flow, smart defaults from property data, immediate feedback on listing quality, comparable market data, instant preview.

### End-to-End Journey

#### Step 1: Add New Property

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 1.1 | Navigate to add property | `/dashboard/landlord/properties/add` | Form loads |
| 1.2 | Enter address (new flat in Birmingham) | Form | Address captured |
| 1.3 | Select type: flat, 2 bedrooms, 1 bathroom | Form | Details entered |
| 1.4 | Set expected rental price (£950/month) | Form | Price set |
| 1.5 | Upload 8 property photos | Form | Photos compress and upload |
| 1.6 | Submit | Form | Property created, redirect to detail |

**QA Checkpoints:**
- [ ] All checkpoints from Scenario 1 Step 3 apply
- [ ] Property count updates from 2 to 3 on dashboard
- [ ] `PortfolioGrid` on properties page shows 3 cards
- [ ] KPI cards update (total properties, portfolio value)

**UX Audit:**
- Does Tom's existing experience make this faster? (No onboarding for returning user)
- Is the form quick to fill for someone who knows what they're doing?

#### Step 2: Upload Compliance Documents

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 2.1 | Navigate to compliance upload | `/dashboard/landlord/compliance/upload` | Upload form loads |
| 2.2 | Upload gas safety certificate | Upload form | Cert uploaded |
| 2.3 | Upload EPC | Upload form | Cert uploaded |
| 2.4 | Upload EICR | Upload form | Cert uploaded |

**QA Checkpoints:**
- [ ] Can upload multiple cert types in one session
- [ ] Each upload associates with the new property
- [ ] Compliance page shows new property's status

**UX Audit:**
- Can Tom upload all three certs in quick succession without re-navigating?
- Is there a "batch upload" flow?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-10.1 | Missing Feature | P2 | No batch upload for multiple compliance docs |
| GAP-10.2 | Missing Link | P2 | No direct link from new property creation to compliance upload |

#### Step 3: Create and Publish Listing

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 3.1 | Navigate to listing page | `/dashboard/landlord/properties/[id]/listing` | Listing form loads |
| 3.2 | Fill listing details | Listing page | Pre-populated from property data |
| 3.3 | Publish listing | Listing page | Listing goes live in search |

**QA Checkpoints:**
- [ ] Listing pre-fills from property data (address, bedrooms, price, photos)
- [ ] Compliance gate prevents publishing without required docs
- [ ] Published listing appears in public search

#### Step 4: Yield Calculator Comparison

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 4.1 | Navigate to yield calculator | `/dashboard/landlord/tools/yield-calculator` | Calculator loads |
| 4.2 | Enter new property's purchase price (£180,000) | Calculator | Price input |
| 4.3 | See gross yield: £950 × 12 / £180,000 = 6.33% | Calculator | Calculation displayed |
| 4.4 | Compare against existing properties | Calculator | Multi-property comparison |

**QA Checkpoints:**
- [ ] Yield calculation formula is correct
- [ ] Can calculate for new property with just rent and purchase price
- [ ] Existing properties' data pre-fills from portfolio
- [ ] Comparison view ranks properties by yield

**UX Audit:**
- Does the calculator auto-pull rent from the property record?
- Is the comparison clear (which property is best/worst performing)?
- Can Tom input purchase price per property for accurate yield?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-10.3 | Missing Feature | P2 | No purchase price field on property record (needed for yield) |
| GAP-10.4 | Missing Feature | P2 | No mortgage cost tracking for net yield |

#### Step 5: Review Portfolio Analytics with New Property

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 5.1 | Navigate to analytics | `/dashboard/landlord/analytics` | Charts load |
| 5.2 | See new property included in portfolio breakdown | Analytics | Donut chart shows 3 properties |
| 5.3 | Review portfolio diversification | Analytics | Property type/location mix |

**QA Checkpoints:**
- [ ] `PortfolioAnalyticsCharts` includes new property in all charts
- [ ] Property type breakdown updates dynamically
- [ ] Charts handle mixed data (new property with 0 history vs established properties)

#### Step 6: Find Local Agent for Valuation

| # | Action | Route | Expected State |
|---|--------|-------|----------------|
| 6.1 | Navigate to find agent | `/dashboard/landlord/find-agent` | Agent search loads |
| 6.2 | Search for agents in Birmingham | Find agent | Results filtered by location |
| 6.3 | View agent profiles and reviews | Find agent | Agent details visible |
| 6.4 | Contact agent for valuation | Find agent | Contact action available |

**QA Checkpoints:**
- [ ] Find-agent page renders with search/filter
- [ ] Location search works (Birmingham postcode area)
- [ ] Agent profiles include: name, agency, specialization, reviews, contact
- [ ] Contact action works (messaging or external link)

**UX Audit:**
- Is the agent search pre-filtered to the new property's location?
- Can Tom see agent specialization (lettings vs sales)?
- Is there a "request valuation" action?

**Gap Analysis Flags:**
| Flag | Type | Severity | Detail |
|------|------|----------|--------|
| GAP-10.5 | Missing Feature | P2 | Find-agent may not be connected to marketplace providers |
| GAP-10.6 | Missing Feature | P3 | No "request valuation" quick action |
| GAP-10.7 | Missing Link | P2 | No link from find-agent back to property (assign agent to manage) |

### Scenario 10 Summary of Gaps

| ID | Type | Severity | Description |
|----|------|----------|-------------|
| GAP-10.1 | Missing Feature | P2 | No batch compliance upload |
| GAP-10.2 | Missing Link | P2 | No property creation → compliance link |
| GAP-10.3 | Missing Feature | P2 | No purchase price field on property |
| GAP-10.4 | Missing Feature | P2 | No mortgage cost for net yield |
| GAP-10.5 | Missing Feature | P2 | Find-agent not connected to marketplace |
| GAP-10.6 | Missing Feature | P3 | No request-valuation action |
| GAP-10.7 | Missing Link | P2 | No agent → property assignment link |

---

## Cross-Scenario Gap Analysis

### P0 Gaps (Blockers)

No P0 blockers identified — core flows appear functional at the page/route level. The system's foundation is solid.

### P1 Gaps (Critical) — Sorted by Impact

| ID | Scenario | Type | Description | Affected Scenarios |
|----|----------|------|-------------|-------------------|
| GAP-1.3 | S1 | Dead End | Empty dashboard without guidance | S1 |
| GAP-1.10 | S1 | Missing Feature | No MEES warning for EPC below E (legal requirement) | S1, S5 |
| GAP-1.12 | S1 | Missing Feature | No compliance gate before listing publish | S1, S10 |
| GAP-2.1 | S2 | Missing Feature | No automated reference checking | S2, S8 |
| GAP-2.7 | S2 | Missing Feature | No auto deposit creation with tenancy | S2, S8 |
| GAP-2.8 | S2 | Missing Feature | No 30-day deposit registration deadline | S2, S8 |
| GAP-3.1 | S3 | Data Gap | KPI aggregation performance at scale (12+ properties) | S3 |
| GAP-4.1 | S4 | Missing Feature | No push notifications for emergencies | S4, S7 |
| GAP-4.2 | S4 | Mobile Gap | Mobile responsiveness untested | S4, S7 |
| GAP-4.7 | S4 | Missing Link | No maintenance → expense creation link | S4, S7 |
| GAP-5.1 | S5 | Missing Feature | No EICR tracking (legally required since 2020) | S5 |
| GAP-6.1 | S6 | Missing Feature | No Section 8 pre-flight checklist | S6 |
| GAP-6.2 | S6 | Missing Feature | No How to Rent guide tracking | S6, S5 |
| GAP-6.4 | S6 | Missing Feature | No arrears auto-calculation from rent records | S6 |
| GAP-7.1 | S7 | Edge Case | Timezone handling for dates may be incorrect | S7 |
| GAP-7.5 | S7 | Missing Feature | No in-app messaging | S7, S4 |
| GAP-8.1 | S8 | Edge Case | Multi-tenancy per property (HMO) not fully supported | S8 |
| GAP-8.2 | S8 | Missing Feature | No room-level tracking | S8 |
| GAP-8.4 | S8 | Edge Case | Per-room inventory for HMO not supported | S8 |
| GAP-8.8 | S8 | Edge Case | Room-level listing not supported | S8 |
| GAP-8.10 | S8 | Edge Case | Per-tenant rent tracking in same property | S8 |
| GAP-9.1 | S9 | Missing Feature | No UK tax year preset (6 Apr - 5 Apr) | S9 |

### Missing Links (Cross-Feature Connections)

These are the most impactful architectural gaps — features that exist independently but aren't connected:

| From → To | Gap ID | Impact |
|-----------|--------|--------|
| Maintenance → Expense | GAP-4.7 | Resolved maintenance should link to cost logging |
| Tenancy → Deposit | GAP-2.9 | New tenancy should auto-create deposit record |
| Property → Compliance | GAP-10.2 | New property should prompt compliance upload |
| Compliance Alert → Fix Page | GAP-6.3 | Alert should link to resolution action |
| Compliance → Find Tradesperson | GAP-1.9 | Missing cert should link to finding an engineer |
| Listing → Compliance | GAP-1.14 | Listing publish should check compliance status |
| Analytics → Yield Calculator | GAP-3.7 | Analytics should link to yield comparison |
| Deposit → Inventory | GAP-8.7 | Deposit deductions need inventory evidence |
| Decision → Agreement | GAP-2.5 | Approved tenant should flow to agreement generation |
| Maintenance → Messaging | GAP-7.6 | Maintenance should allow tenant communication |

### HMO Support Gaps (Scenario 8 Cluster)

The HMO scenario reveals a systemic gap: the data model may assume 1 property = 1 tenancy. HMO support requires:

1. Room-level entity within property
2. Multiple concurrent tenancies per property
3. Per-room inventory and condition reports
4. Per-tenant rent collection within one property
5. Room-level listing (not whole-property only)
6. HMO license as a compliance document type

This is architectural and needs design before implementation.

### Notification Gaps

No notification system exists for:
- Emergency maintenance alerts (P1)
- Compliance certificate expiry warnings (P2)
- Rent overdue alerts (P2)
- Application received notifications (P2)
- Deposit registration deadline warnings (P1)

This cuts across Scenarios 3, 4, 5, and 7.

---

## Final Scorecard & Recommendations

### Scenario Readiness Summary

| # | Scenario | Persona | Ready for QA? | Blocking Gaps | Gap Count |
|---|----------|---------|---------------|---------------|-----------|
| 1 | Accidental Landlord | Sarah | Partial | Empty state UX, MEES, compliance gate | 14 |
| 2 | Tenant Screener | Marcus | Partial | Auto deposit, reference checks | 11 |
| 3 | Portfolio Commander | David | Partial | KPI performance at scale | 11 |
| 4 | Emergency Responder | Priya | Partial | Push notifications, mobile, maintenance→expense | 9 |
| 5 | Compliance Warrior | Ahmed | Partial | EICR tracking | 7 |
| 6 | Eviction Navigator | Janet | Partial | S8 pre-flight, arrears calc | 9 |
| 7 | Overseas Landlord | Chen | Partial | Timezone, messaging | 8 |
| 8 | HMO Landlord | Raj | Blocked | Multi-tenancy/room architecture | 11 |
| 9 | Tax Season Landlord | Emma | Partial | Tax year preset | 11 |
| 10 | Growth Landlord | Tom | Mostly Ready | Minor linking gaps | 7 |

### Top 10 Recommendations (Priority Order)

| # | Recommendation | Severity | Scenarios | Effort |
|---|---------------|----------|-----------|--------|
| 1 | **Add cross-feature navigation links** (maintenance→expense, tenancy→deposit, compliance→fix, etc.) | P1 | All | Low |
| 2 | **Implement compliance gate before listing publish** | P1 | S1, S10 | Medium |
| 3 | **Add UK tax year preset and custom date ranges** | P1 | S9 | Low |
| 4 | **Add EICR tracking to compliance system** | P1 | S5 | Low |
| 5 | **Implement first-run/empty-state guidance** (onboarding wizard or contextual CTAs) | P1 | S1 | Medium |
| 6 | **Add 30-day deposit registration deadline tracking** | P1 | S2 | Low |
| 7 | **Add MEES warning for EPC below E** | P1 | S1, S5 | Low |
| 8 | **Design HMO/multi-tenancy architecture** (room model) | P1 | S8 | High |
| 9 | **Test and fix mobile responsiveness** across all maintenance and emergency flows | P1 | S4, S7 | Medium |
| 10 | **Add in-app messaging** between landlord and tenant | P1 | S7, S4 | High |

### Coverage Verification

| Evaluation Dimension | Tested In Scenarios | Coverage |
|---------------------|---------------------|----------|
| Task Completion | All 10 | Full |
| Efficiency | S3 (2-minute check), S4 (emergency speed), S9 (tax export) | Full |
| Error Handling | S1 (upload fails), S6 (pre-flight checks), S2 (invalid transitions) | Full |
| Empty/Edge States | S1 (first run), S3 (12 properties), S8 (HMO), S7 (timezone) | Full |
| Information Architecture | S3 (navigation), S4 (mobile), S6 (guided flow), S9 (finance structure) | Full |
| Delight & Polish | S1 (celebrations), S2 (pipeline UX), S6 (confidence building) | Full |

### Testing Surface Coverage

| System Area | Primary Scenario | Secondary Scenarios | Unique? |
|-------------|-----------------|---------------------|---------|
| Onboarding & empty states | S1 | — | Yes |
| Application pipeline & tenant screening | S2 | S8 | Yes |
| Dashboard KPIs & portfolio overview | S3 | S1, S7 | Yes |
| Maintenance & emergency response | S4 | S7, S3 | Yes |
| Compliance certificates & expiry tracking | S5 | S1, S6, S10 | Yes |
| Legal notices & eviction | S6 | — | Yes |
| Timezone, async, remote management | S7 | — | Yes |
| HMO / multi-tenancy edge cases | S8 | — | Yes |
| Finance, tax, reporting & export | S9 | S7 | Yes |
| Property addition & growth workflow | S10 | S1 | Yes |

Each scenario has a unique primary testing surface — no duplication.

---

## Appendix A: Component × Scenario Matrix

| Component | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| KpiCard | X | | X | | | | X | | | |
| PortfolioGrid | X | | X | | | | | | | X |
| PropertyCard | X | | X | | | | | | | X |
| HealthScoreCard | X | | X | | | | | | | |
| ApplicationPipelineCard | | X | | | | | | X | | |
| ApplicationDetailActions | | X | | | | | | | | |
| TenantScreeningClient | | X | | | | | | X | | |
| LeasePreview | | X | | | | | | | | |
| TenancyAgreementPDF | | X | | | | | | | | |
| TenancyAgreementPDFWrapper | | X | | | | | | | | |
| TenancyAgreementUpload | | X | | | | | | | | |
| TenancyForm | | X | | | | | | X | | |
| TenancyStatusBadge | | X | | | | | | X | | |
| DepositCard | | X | | | | | | X | | |
| RentPaymentRow | | | X | | | | X | X | | |
| RentStatusIndicator | | | X | | | | X | | | |
| FinancialSummary | | | X | | | | X | | X | |
| IncomeExpenseChart | | | X | | | | | | X | |
| FinancialEntryForm | | | | X | | | | | X | |
| TaxSummaryExport | | | | | | | X | | X | |
| ComplianceExpiryCalendar | | | X | | X | | | | | |
| CertificateStatusTile | | | | | X | | | | | X |
| ComplianceAlert | X | | | | X | | | | | |
| ComplianceAlertBanner | | | | | X | | | | | |
| ComplianceUploadForm | X | | | | X | | | | | X |
| DocumentUpload | X | | | | | | | | | |
| DocumentList | X | | | | | | | | | |
| MaintenanceForm | | | | X | | | | | | |
| MaintenanceList | | | X | X | | | | | | |
| MaintenanceStatusBadge | | | X | X | | | | | | |
| MaintenancePriorityBadge | | | X | X | | | | | | |
| ProviderAssignment | | | | X | | | X | | | |
| TradesPersonAssignModal | | | | X | | | X | | | |
| Section21PreflightChecklist | | | | | | X | | | | |
| Section8NoticePDF | | | | | | X | | | | |
| Section21NoticePDF | | | | | | X | | | | |
| PDFErrorBoundary | | X | | | | X | | | X | |
| PropertyOverview | | | | | | | | X | | X |
| InventoryRoomForm | | X | | | | | | X | | |
| InventoryPdfButton | | X | | | | | | X | | |
| PortfolioAnalyticsCharts | | | X | | | | | | | X |
| LandlordSidebar | X | X | X | X | X | X | X | X | X | X |

---

## Appendix B: Service × Scenario Matrix

| Service | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|---------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| portfolio-service | X | | X | | | | X | | | X |
| document-service | X | | | | X | X | | | | X |
| tenant-application-service | | X | | | | | | X | | |
| tenancy-service | | X | | | | X | | X | | |
| deposit-service | | X | | | | X | | X | | |
| maintenance-service | | | X | X | | | X | | | |
| financial-service | | | X | X | | | X | | X | |
| inventory-service | | X | | | | | | X | | |
| legal-notice-service | | | | | | X | | | | |

---

## Appendix C: API Route × Scenario Matrix

| API Route | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| compliance/upload | X | | | | X | | | | | X |
| deposits | | X | | | | | | X | | |
| deposits/[id] | | X | | | | | | X | | |
| finance/entries | | | X | X | | | X | | X | |
| finance/entries/[id] | | | | | | | | | X | |
| inventory | | X | | | | | | X | | |
| inventory/[reportId] | | X | | | | | | X | | |
| maintenance | | | X | X | | | X | | | |
| maintenance/[id]/status | | | | X | | | | | | |
| maintenance/[id]/assign | | | | X | | | X | | | |
| maintenance/[id]/notes | | | | X | | | | | | |
| rent | | | X | | | | X | | | |
| rent/[entryId]/mark-paid | | | X | | | | X | X | | |
