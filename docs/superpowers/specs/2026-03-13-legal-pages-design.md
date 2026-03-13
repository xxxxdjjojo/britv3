# Legal Pages — Design Spec
**Date:** 2026-03-13
**Status:** Approved
**Scope:** All 11 legal documents + Cookie Consent Banner/Modal + GDPR Rights form

---

## 1. Overview

Implement a full Legal Hub for Britestate covering 11 legal documents, a global cookie consent system, and a GDPR subject rights request form. The hub replaces the existing single-page `/legal` mega-page and the standalone `/terms` and `/privacy` placeholder pages with a scalable, SEO-optimised, per-document route structure matching the Stitch design reference.

---

## 2. Architecture

### 2.1 Route Structure

```
src/app/(main)/legal/
├── layout.tsx                    # Three-column shell — Server Component
├── page.tsx                      # /legal — hub index/overview page
├── terms/page.tsx                # 2.1 Terms of Service
├── privacy/page.tsx              # 2.2 Privacy Policy
├── cookies/page.tsx              # 2.3 Cookie Policy
├── acceptable-use/page.tsx       # 2.5 Acceptable Use Policy
├── gdpr-rights/page.tsx          # 2.6 GDPR Data Subject Rights
├── data-processing/page.tsx      # 2.7 Data Processing Agreement
├── accessibility/page.tsx        # 2.8 Accessibility Statement
├── complaints/page.tsx           # 2.9 Complaints Procedure
├── aml-policy/page.tsx           # 2.10 Anti-Money Laundering Policy
├── modern-slavery/page.tsx       # 2.11 Modern Slavery Statement
├── disclaimer/page.tsx           # 2.12 Disclaimer
```

### 2.2 Supporting Files

```
src/components/legal/
├── LegalLeftNav.tsx              # Categorised left nav — Client Component
├── LegalRightToc.tsx             # "On This Page" ToC — Client Component
├── CookieConsentBanner.tsx       # Global bottom banner — Client Component
├── CookieConsentModal.tsx        # Preferences modal — Client Component
└── GdprRequestForm.tsx           # Inline SAR form — Client Component

src/contexts/
└── CookieConsentContext.tsx      # consent state + updateConsent

src/app/api/legal/
└── gdpr-request/route.ts         # POST handler for GDPR subject access requests
```

### 2.3 Redirects (next.config.ts)

```
/terms        → /legal/terms        (301)
/privacy      → /legal/privacy      (301)
```

Old `/terms/page.tsx` and `/privacy/page.tsx` are deleted after redirects are confirmed.

### 2.4 Footer Update

All footer legal links updated to `/legal/*` routes. A "Cookie Preferences" link added to the footer that sets `#cookie-preferences` hash to re-open the modal.

---

## 3. Shared Layout — Three-Column Shell

### 3.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (site-wide, unchanged)                               │
├──────────────┬──────────────────────────────┬───────────────┤
│  Left Nav    │  Article Content             │  On This Page │
│  280px fixed │  max-w-[800px] centered      │  240px fixed  │
│  sticky      │  flex-1                      │  sticky       │
│              │                              │               │
│  Categories  │  Breadcrumb                  │  Section ToC  │
│  with icons  │  H1 + last updated           │  active state │
│              │  Yellow info callout         │  via          │
│  Active doc  │  Numbered H2/H3 sections     │  Intersection │
│  highlighted │  Prose + tables + lists      │  Observer     │
└──────────────┴──────────────────────────────┴───────────────┘
│  FOOTER (site-wide, unchanged)                               │
└─────────────────────────────────────────────────────────────┘
```

Grid: `grid-cols-1 lg:grid-cols-[280px_1fr_240px]`

### 3.2 Mobile Layout

- Both sidebars hidden on `< lg`
- Left nav becomes a horizontal scrollable pill row below the breadcrumb
- Right ToC omitted on mobile

### 3.3 Left Nav Categories

| Category | Documents |
|----------|-----------|
| User Agreements | Terms of Service, Acceptable Use Policy |
| Privacy & Data Protection | Privacy Policy, Cookie Policy, GDPR Data Subject Rights, Data Processing Agreement |
| Compliance | AML Policy, Modern Slavery Statement |
| Platform | Accessibility Statement, Complaints Procedure, Disclaimer |

- `LegalLeftNav` is a Client Component using `usePathname()` to highlight active document
- Each item has a Material Symbols icon matching the Stitch design

### 3.4 Right ToC (`LegalRightToc`)

- Accepts `sections: { id: string; label: string }[]` prop from each page
- Uses `IntersectionObserver` to track active section as user scrolls
- Active item shown with left border highlight (`border-l-2 border-primary`)
- Hidden on pages with no sections (hub index)

### 3.5 Typography

- Headings: `font-display` (Plus Jakarta Sans)
- Body: `font-body` (Inter)
- Body font size: `text-[16px] md:text-[17px]` with `leading-[1.7]`
- H2: `text-2xl font-bold font-display`
- H3: `text-xl font-bold font-display`

---

## 4. Document Content

All documents share the same content structure:

```
Breadcrumb → H1 + "Last updated: [date]" → Yellow info callout → Numbered H2 sections → H3 subsections
```

### 4.1 Terms of Service (`/legal/terms`)
Migrated and expanded from `/legal#terms`.
Sections: Introduction, User Accounts, Acceptable Use (summary), Intellectual Property, Disclaimers, Limitation of Liability, Governing Law (England & Wales), Changes to Terms.

### 4.2 Privacy Policy (`/legal/privacy`)
Migrated and expanded from `/legal#privacy`.
Sections: Introduction, Data We Collect, Legal Basis for Processing (table: purpose → lawful basis), How We Use Your Data, Data Sharing, Data Retention, International Transfers, Your Rights, Cookies, DPO Contact, Changes.

### 4.3 Cookie Policy (`/legal/cookies`)
Migrated from `/legal#cookies`.
Sections: What Are Cookies, Categories (Essential / Analytics / Marketing), Cookie Table, How to Manage Cookies, "Manage Preferences" button that opens `CookieConsentModal`.

### 4.4 Acceptable Use Policy (`/legal/acceptable-use`)
New document.
Sections: Permitted Uses, Prohibited Conduct (fraudulent listings, impersonation, scraping, malware, harassment), Content Standards, Enforcement & Suspension, Appeals Process, Applicable UK Law references (Fraud Act 2006, Computer Misuse Act 1990, Online Safety Act 2023).

### 4.5 GDPR Data Subject Rights (`/legal/gdpr-rights`)
New document.
Sections: Your Rights Under UK GDPR (8 rights with plain-English explanation each), How to Submit a Request (inline form — see Section 6), Response Timelines (30 days, extendable to 3 months for complex requests), Exemptions, ICO Complaint Right.

### 4.6 Data Processing Agreement (`/legal/data-processing`)
New document — targeted at service providers.
Sections: Definitions (Controller / Processor / Data Subject), Subject Matter & Duration, Nature & Purpose of Processing, Types of Personal Data, Obligations of the Processor, Sub-Processors (table), Security Measures, Data Breach Notification, Audit Rights, Termination.

### 4.7 Accessibility Statement (`/legal/accessibility`)
Migrated from `/legal#accessibility`.
Sections: Compliance Status (WCAG 2.1 AA), Known Limitations, Feedback & Contact, Enforcement (EHRC), Technical Information, Preparation of Statement.

### 4.8 Complaints Procedure (`/legal/complaints`)
Migrated from `/legal#complaints`.
Sections: Overview, Step 1 — Contact Support (1 day acknowledge / 5 day resolve), Step 2 — Formal Escalation (10 day resolve), Step 3 — External Resolution (TPO / ICO / ADR), Registered Address.

### 4.9 AML Policy (`/legal/aml-policy`)
New document.
Sections: Policy Statement, Risk Assessment Approach, Customer Due Diligence (CDD), Enhanced Due Diligence (EDD) triggers, Suspicious Activity Reporting (SAR) obligations, Record Keeping (5-year requirement), Staff Training, MLRO Contact. References: Proceeds of Crime Act 2002, Money Laundering Regulations 2017.

### 4.10 Modern Slavery Statement (`/legal/modern-slavery`)
New document.
Sections: Organisation & Supply Chains, Policies in Relation to Slavery, Due Diligence Processes, Risk Assessment, KPIs, Training, Board Approval. References: Modern Slavery Act 2015.

### 4.11 Disclaimer (`/legal/disclaimer`)
New document.
Sections: No Professional Advice, Accuracy of Information, Third-Party Links, Platform as Intermediary, Limitation of Liability, Jurisdiction.

---

## 5. Cookie Consent System

### 5.1 Banner

- Fixed bottom bar, full-width, `z-50`, above footer
- Rendered by `CookieConsentBanner` in root `layout.tsx`
- Shown only if `brite_cookie_consent` cookie is absent
- Buttons: "Accept All", "Reject Non-Essential", "Manage Preferences"
- "Manage Preferences" opens `CookieConsentModal`
- Any choice sets `brite_cookie_consent` and hides banner

### 5.2 Preferences Modal

- Three toggle rows: Essential (locked on, disabled), Analytics, Marketing
- Each row shows: toggle + category name + description + cookies it controls
- "Save Preferences" button writes consent JSON to cookie
- Consent structure: `{ analytics: boolean, marketing: boolean, version: number }`

### 5.3 Consent Cookie

- Name: `brite_cookie_consent`
- Value: JSON string `{ analytics: true, marketing: false, version: 1 }`
- Duration: 1 year
- SameSite: Lax, Secure

### 5.4 Context

`CookieConsentContext` provides:
- `consent: { analytics: boolean, marketing: boolean } | null` (null = not yet set)
- `updateConsent(prefs): void` — writes cookie + updates state
- `openPreferences(): void` — opens modal programmatically

PostHog and marketing scripts wrapped in consent checks — only initialised if `consent.analytics === true`.

### 5.5 Footer Re-open

Footer "Cookie Preferences" link sets `window.location.hash = '#cookie-preferences'`. `CookieConsentBanner` listens for this hash and opens the modal.

---

## 6. GDPR Rights Form

### 6.1 Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| Full Name | text | required, min 2 chars |
| Email Address | email | required, valid email |
| Account Email (if different) | email | optional |
| Right Type | select | required — Access / Erasure / Portability / Rectification / Restriction / Objection / Withdraw Consent / Lodge Complaint |
| Description | textarea | required, min 20 chars, max 1000 chars |

### 6.2 API Route — `POST /api/legal/gdpr-request`

1. Validate input (Zod schema)
2. Rate-limit via Upstash Redis: 3 requests per email per 30 days
3. Send email via Resend to `privacy@britestate.co.uk` with structured request details
4. Send confirmation email to requester
5. Return `{ success: true, reference: string }` — reference = `SAR-YYYYMMDD-XXXX`

### 6.3 UX States

- Default → form
- Submitting → loading state on button
- Success → confirmation message with reference number, 30-day response reminder
- Error → inline error message, form preserved

---

## 7. SEO

- Each page exports `generateMetadata()` with unique `title`, `description`, and `canonical` URL
- `robots: { index: true, follow: true }` on all pages
- JSON-LD `LegalDocument` structured data on each page (type, name, dateModified, publisher)
- 301 redirects from `/terms` and `/privacy` preserve any existing backlink equity

---

## 8. Out of Scope

- Actual legal counsel review of content (placeholder text flagged with `// TODO: legal review`)
- PDF download of documents (Stitch design shows a "Download PDF" button — deferred)
- Version history / changelog for documents
- Authenticated GDPR request tracking in database (email-based flow is sufficient for launch)
