# Legal Pages — Design Spec
**Date:** 2026-03-13
**Status:** Approved
**Scope:** 11 legal documents + Cookie Consent Banner/Modal + GDPR Rights form

---

## 1. Overview

Implement a full Legal Hub for Britestate covering 11 legal documents, a global cookie consent system, and a GDPR subject rights request form. The hub replaces the existing single-page `/legal` mega-page and the standalone `/terms` and `/privacy` placeholder pages with a scalable, SEO-optimised, per-document route structure matching the Stitch design reference (project `5956704101394866719`, screen `6b02d6226ca64637903e8e7d1d1fe607`).

---

## 2. Architecture

### 2.1 Route Structure

```
src/app/(main)/legal/
├── layout.tsx                    # Thin pass-through wrapper — Server Component
├── page.tsx                      # /legal — hub index, card grid per category
├── terms/page.tsx                # 2.1 Terms of Service
├── privacy/page.tsx              # 2.2 Privacy Policy
├── cookies/page.tsx              # 2.3 Cookie Policy
├── acceptable-use/page.tsx       # 2.5 Acceptable Use Policy  (2.4 is banner — no page)
├── gdpr-rights/page.tsx          # 2.6 GDPR Data Subject Rights
├── data-processing/page.tsx      # 2.7 Data Processing Agreement
├── accessibility/page.tsx        # 2.8 Accessibility Statement
├── complaints/page.tsx           # 2.9 Complaints Procedure
├── aml-policy/page.tsx           # 2.10 Anti-Money Laundering Policy
├── modern-slavery/page.tsx       # 2.11 Modern Slavery Statement
├── disclaimer/page.tsx           # 2.12 Disclaimer
```

**Note on 2.4:** Cookie Consent Banner / Preferences Modal is a UI component system, not a page. It has no route.

### 2.2 Supporting Files

```
src/components/legal/
├── LegalPageShell.tsx            # Three-column layout wrapper — Server Component
├── LegalLeftNav.tsx              # Categorised left nav — Client Component ("use client")
├── LegalRightToc.tsx             # "On This Page" ToC — Client Component ("use client")
├── CookieConsentBanner.tsx       # Bottom banner + modal combined — Client Component
└── GdprRequestForm.tsx           # Inline SAR form — Client Component

src/contexts/
└── CookieConsentContext.tsx      # PECR cookie state for anonymous visitors

src/app/api/legal/
└── gdpr-request/route.ts         # POST handler for subject access requests
```

### 2.3 Three-Column Pattern (Issue 6 resolution)

`legal/layout.tsx` is a thin pass-through (renders `{children}` only — Next.js requires it to exist but it adds no shell). The three-column shell is instead handled by `LegalPageShell`, a Server Component that each individual page wraps its content with:

```tsx
// Each document page:
export default function TermsPage() {
  return (
    <LegalPageShell toc={sections}>
      {/* content */}
    </LegalPageShell>
  );
}
```

`LegalPageShell` accepts a `toc: { id: string; label: string }[]` prop and renders:
- Left column: `<LegalLeftNav />` (Client Component — `usePathname()` for active state)
- Center column: `{children}`
- Right column: `<LegalRightToc sections={toc} />` (Client Component — `IntersectionObserver`)

This avoids the Server Component limitation that prevents `layout.tsx` from receiving per-page props. `LegalPageShell` itself is a Server Component — it imports Client Components as leaves, which is the standard App Router pattern.

The hub index `/legal/page.tsx` does NOT use `LegalPageShell` — it renders a full-width card grid instead.

### 2.4 Redirects (next.config.ts)

```ts
async redirects() {
  return [
    { source: '/terms',          destination: '/legal/terms',         permanent: true },
    { source: '/privacy',        destination: '/legal/privacy',       permanent: true },
    { source: '/cookies',        destination: '/legal/cookies',       permanent: true },
    { source: '/accessibility',  destination: '/legal/accessibility', permanent: true },
    { source: '/complaints',     destination: '/legal/complaints',    permanent: true },
  ];
}
```

Old `src/app/(main)/terms/page.tsx` and `src/app/(main)/privacy/page.tsx` are deleted after redirects are confirmed working. The routes `/cookies`, `/accessibility`, and `/complaints` do not have existing page files — they are referenced in Footer links but were never implemented, so no deletion required; the redirects future-proof them if pages are ever created at those paths.

### 2.5 Footer Updates

- All legal links updated to `/legal/*` routes
- "Cookie Preferences" link added as a `<button>` that calls `openPreferences()` from `CookieConsentContext` — **not** a hash-based approach (unreliable post-consent)
- Footer must be a Client Component or the Cookie Preferences button extracted as a `"use client"` sub-component

### 2.6 SEO — Canonical URLs (Issue 9 resolution)

`.env.example` already defines `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Use this existing variable — do not introduce a second `NEXT_PUBLIC_SITE_URL`. Each page's `generateMetadata()` uses:

```ts
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://britestate.co.uk';
```

---

## 3. Shared Layout — Three-Column Shell (`LegalPageShell`)

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

Grid class: `grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-8 xl:gap-16`

### 3.2 Mobile Layout

- Both sidebars hidden on `< lg`
- Left nav becomes a horizontal scrollable pill row below the breadcrumb on mobile
- Right ToC omitted on mobile

### 3.3 Left Nav Categories and Items

| Category | Documents |
|----------|-----------|
| User Agreements | Terms of Service, Acceptable Use Policy |
| Privacy & Data Protection | Privacy Policy, Cookie Policy, GDPR Data Subject Rights, Data Processing Agreement |
| Compliance | AML Policy, Modern Slavery Statement |
| Platform | Accessibility Statement, Complaints Procedure, Disclaimer |

`LegalLeftNav` uses `usePathname()` to apply active highlight. It is a Client Component (`"use client"`) imported into `LegalPageShell` (Server Component) — this is valid App Router usage; Client Components can be children of Server Components.

### 3.4 Right ToC (`LegalRightToc`)

- Accepts `sections: { id: string; label: string }[]` prop — passed from `LegalPageShell` which receives it from each page
- `IntersectionObserver` tracks active section (threshold 0.4)
- Active item: `border-l-2 border-primary font-medium text-primary`
- Inactive item: `border-l-2 border-transparent text-gray-500 hover:text-primary`

### 3.5 Hub Index Page (`/legal/page.tsx`)

Full-width (no `LegalPageShell`). Shows:
- Hero: "Legal Hub" H1 + subtitle "Britestate's legal documents, policies, and compliance information."
- Four category sections, each with a heading and a card grid (`grid-cols-1 md:grid-cols-2`)
- Each card: icon + document title + one-line description + "Read →" link to the document route
- No right ToC, no left nav (the index IS the navigation)

### 3.6 Typography

- Headings: `font-display` (Plus Jakarta Sans)
- Body: `font-body` (Inter)
- Body size: `text-[16px] md:text-[17px]` with `leading-[1.7]`
- H2: `text-2xl font-bold font-display`
- H3: `text-xl font-bold font-display`
- Yellow callout: `bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4`

---

## 4. Document Content

All documents share this structure: breadcrumb → H1 + "Last updated: [date]" → yellow info callout → numbered H2 sections → H3 subsections.

### 4.1 Terms of Service (`/legal/terms`)
Migrated and expanded from `/legal#terms`.
Sections: 1. Introduction, 2. User Accounts, 3. Acceptable Use (summary), 4. Intellectual Property, 5. Disclaimers, 6. Limitation of Liability, 7. Governing Law (England & Wales), 8. Changes to Terms.

### 4.2 Privacy Policy (`/legal/privacy`)
Migrated and expanded from `/legal#privacy`.
Sections: 1. Introduction, 2. Data We Collect, 3. Legal Basis for Processing (table: purpose → lawful basis under UK GDPR Art. 6), 4. How We Use Your Data, 5. Data Sharing, 6. Data Retention, 7. International Transfers, 8. Your Rights, 9. Cookies (link to Cookie Policy), 10. DPO Contact, 11. Changes.

### 4.3 Cookie Policy (`/legal/cookies`)
Migrated from `/legal#cookies`. Adds "Manage Preferences" button that calls `openPreferences()` from context.
Sections: 1. What Are Cookies, 2. Categories (Essential / Analytics / Marketing / Third Party), 3. Cookie Table (name, purpose, duration, type), 4. How to Manage Cookies, 5. Manage Preferences (button).

### 4.4 Acceptable Use Policy (`/legal/acceptable-use`)
New document.
Sections: 1. Introduction, 2. Permitted Uses, 3. Prohibited Conduct (fraudulent listings, impersonation, scraping, malware, harassment, money laundering), 4. Content Standards, 5. Enforcement & Suspension, 6. Appeals Process. References: Fraud Act 2006, Computer Misuse Act 1990, Online Safety Act 2023.

### 4.5 GDPR Data Subject Rights (`/legal/gdpr-rights`)
New document. Includes inline SAR form (see Section 6).
Sections: 1. Introduction, 2. Your Eight Rights (one H3 per right: Access, Erasure, Portability, Rectification, Restriction, Objection, Withdraw Consent, Lodge Complaint — each with plain-English explanation), 3. Submit a Request (inline form), 4. Response Timelines (30 days, extendable to 3 months), 5. Exemptions, 6. ICO Complaint Right.

### 4.6 Data Processing Agreement (`/legal/data-processing`)
New document — targeted at service providers.
Sections: 1. Definitions (Controller / Processor / Data Subject), 2. Subject Matter & Duration, 3. Nature & Purpose of Processing, 4. Types of Personal Data Processed, 5. Obligations of the Processor, 6. Sub-Processors (table: name, purpose, location), 7. Security Measures, 8. Data Breach Notification (72-hour requirement), 9. Audit Rights, 10. Termination.

### 4.7 Accessibility Statement (`/legal/accessibility`)
Migrated from `/legal#accessibility`. Sections: 1. Compliance Status (WCAG 2.1 AA), 2. Known Limitations, 3. Feedback & Contact, 4. Enforcement (EHRC), 5. Technical Information, 6. Preparation of Statement.

### 4.8 Complaints Procedure (`/legal/complaints`)
Migrated from `/legal#complaints`. Sections: 1. Overview, 2. Step 1 — Contact Support, 3. Step 2 — Formal Escalation, 4. Step 3 — External Resolution (TPO / ICO / ADR), 5. Registered Address.

### 4.9 AML Policy (`/legal/aml-policy`)
New document.
Sections: 1. Policy Statement, 2. Risk Assessment Approach, 3. Customer Due Diligence (CDD), 4. Enhanced Due Diligence (EDD) triggers, 5. Suspicious Activity Reporting (SAR obligations), 6. Record Keeping (5-year requirement), 7. Staff Training, 8. MLRO Contact. References: Proceeds of Crime Act 2002, Money Laundering Regulations 2017.

### 4.10 Modern Slavery Statement (`/legal/modern-slavery`)
New document.
Sections: 1. Organisation & Supply Chains, 2. Policies in Relation to Slavery, 3. Due Diligence Processes, 4. Risk Assessment, 5. KPIs & Effectiveness, 6. Training, 7. Board Approval. References: Modern Slavery Act 2015.

### 4.11 Disclaimer (`/legal/disclaimer`)
New document.
Sections: 1. No Professional Advice, 2. Accuracy of Information, 3. Third-Party Links, 4. Platform as Intermediary, 5. Limitation of Liability, 6. Jurisdiction.

---

## 5. Cookie Consent System

### 5.1 Relationship to Existing Consent System (Issue 1 resolution)

The codebase already has `useConsent` (hook) and `consent-service.ts` (server-side) that manage `consent_records` in the database for **authenticated users**. The existing `ConsentType = "marketing" | "analytics" | "third_party"`.

`CookieConsentContext` is the **PECR-required pre-consent layer for anonymous visitors** — it does not replace the existing system. The two layers work together:

| User state | Consent storage | What manages it |
|-----------|----------------|-----------------|
| Anonymous | `brite_cookie_consent` cookie | `CookieConsentContext` |
| Authenticated | `consent_records` DB table | `useConsent` hook |

The modal UI exposes **three toggles** matching `ConsentType` exactly: Analytics, Marketing, Third Party.

Cookie structure: `{ analytics: boolean, marketing: boolean, third_party: boolean, version: number }`.

On login: DB records are authoritative for authenticated users. `useConsent` reads from DB, ignoring the cookie. The cookie remains as a fallback only. No migration of anonymous cookie → DB is needed (signup flow already calls `initializeConsent`).

`CookieConsentContext.updateConsent()` for an **authenticated user** calls `useConsent.updateConsent()` to sync to DB in addition to writing the cookie. For anonymous users, cookie only.

### 5.2 Placement (Issue 4 resolution)

`CookieConsentBanner` and `CookieConsentContext` are placed in `src/app/(main)/layout.tsx` — **not** the root layout. This scopes the banner to public pages only, keeping it away from `/dashboard/*`, `/(auth)/*`, and `/(admin)/*`.

### 5.3 Banner

- Fixed bottom bar, full-width, `z-50`, above footer
- Shown only if `brite_cookie_consent` cookie is absent
- Buttons: "Accept All", "Reject Non-Essential", "Manage Preferences"
- Any choice sets `brite_cookie_consent` and hides banner
- "Manage Preferences" calls `openPreferences()` to open modal

### 5.4 Preferences Modal (Issue 5 resolution)

The modal is always mounted (not conditionally rendered based on banner visibility) as a sibling to the banner in `CookieConsentBanner.tsx`. `openPreferences()` from context controls modal open state independently of banner visibility. This allows the footer link to open the modal even after the banner has been dismissed.

Three toggle rows: Essential (locked on, disabled), Analytics, Marketing, Third Party.
Each row: toggle + name + description + which cookies it controls.
"Save Preferences" writes consent to cookie + syncs to DB if authenticated.

### 5.5 Consent Cookie

- Name: `brite_cookie_consent`
- Value: `{ analytics: boolean, marketing: boolean, third_party: boolean, version: 1 }`
- Duration: 1 year
- SameSite: Lax, Secure

### 5.6 Context API

`CookieConsentContext` provides:
```ts
{
  consent: { analytics: boolean, marketing: boolean, third_party: boolean } | null,
  // prefs is a partial record — only supply the keys being changed
  updateConsent(prefs: Partial<Record<ConsentType, boolean>>): void,
  openPreferences(): void,
}
```

`updateConsent` in the context iterates over `prefs` and calls the existing `useConsent.updateConsent(type, value)` for each key when the user is authenticated (the existing hook takes `(type: ConsentType, granted: boolean)`). For anonymous users it writes to the cookie only.
`null` = cookie not yet set (banner should show).
PostHog and marketing scripts initialised only if `consent.analytics === true`.

### 5.7 Footer Cookie Preferences Link (Issue 5 resolution)

Footer "Cookie Preferences" is a `<button onClick={openPreferences}>` using `CookieConsentContext`. Footer needs to be either a Client Component or wrap only this button in a `"use client"` sub-component (`CookiePreferencesButton.tsx`). Prefer the sub-component approach to keep Footer as a Server Component.

---

## 6. GDPR Rights Form

### 6.1 Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| Full Name | text | required, min 2 chars |
| Email Address | email | required, valid email |
| Account Email (if different) | email | optional, valid email |
| Right Type | select | required — Access / Erasure / Portability / Rectification / Restriction / Objection / Withdraw Consent / Lodge Complaint |
| Description | textarea | required, min 20 chars, max 1000 chars |

### 6.2 API Route — `POST /api/legal/gdpr-request`

1. Validate with Zod schema
2. Rate-limit via Upstash Redis (Issue 2 resolution):
   - Primary: 3 requests per contact email per 30 days (sliding window)
   - Secondary: 10 requests per IP per day (prevents throwaway email abuse)
3. Generate reference: `SAR-YYYYMMDD-` + `nanoid(6)` — URL-safe random suffix. No DB state needed; collision probability is negligible for an email-based system (~68B combinations per day prefix).
4. Send admin email via Resend to `privacy@britestate.co.uk` with full request details + reference
5. Send confirmation email to requester with reference number and 30-day response reminder
6. Return `{ success: true, reference: string }`

### 6.3 UX States

- Default → form
- Submitting → loading spinner on button, form fields disabled
- Success → confirmation panel (reference number, "We'll respond within 30 days", ICO link)
- Rate limited → inline error "You have already submitted a request recently. Please wait before submitting again."
- Other error → inline error, form preserved

---

## 7. SEO

- Each page exports `generateMetadata()` with unique `title`, `description`, and `openGraph`
- Canonical URL: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://britestate.co.uk'}/legal/[slug]` (uses existing `NEXT_PUBLIC_APP_URL` env var)
- `robots: { index: true, follow: true }` on all pages
- JSON-LD `LegalDocument` schema on each document page (type, name, dateModified, publisher)
- 301 redirects from `/terms` and `/privacy` preserve existing backlink equity

---

## 8. Out of Scope

- Actual legal counsel review of content (placeholder text flagged with `// TODO: legal review`)
- PDF download of documents (Stitch design shows "Download PDF" — deferred)
- Version history / changelog for documents
- Storing GDPR requests in the database (email-based flow is sufficient for launch)
