# Phase 17: Service Provider Public Profiles — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** User specification + Stitch reference designs (8 screens, Project 5956704101394866719)

<domain>
## Phase Boundary

Phase 17 delivers 14 public-facing pages (browsable by anyone, no login required) for all service provider types on Britestate: tradespeople, estate agents, mortgage brokers, conveyancers/solicitors, and surveyors. These are the "shop window" profiles that showcase a provider's verified credentials, reviews, portfolio, active listings, team, and services to prospective clients.

**In scope:**
- Pages 13.1–13.14 as specified by the user
- SSR (Server Components) for all pages — SEO-first
- Real Supabase data (zero mock data)
- Stitch-reference-quality UI matching britestatestyle.txt design system
- Compare modal and localized SEO category pages

**Out of scope (handled by other phases):**
- Provider dashboard/management (Phase 16)
- Marketplace RFQ pipeline internals (Phase 4)
- Auth flows (Phase 1)

</domain>

<decisions>
## Implementation Decisions

### Design Quality Bar
- **FAANG level** — every page must match or exceed the Stitch reference designs
- All 8 Stitch HTML reference files saved in `.planning/phases/17-service-provider-public-profiles/stitch/`
- Stitch project: 5956704101394866719

### Stitch Reference Mapping
| Stitch Screen | File | Phase Pages |
|---------------|------|-------------|
| Tradesperson Public Profile | `tradesperson-public-profile.html` | 13.1–13.5 |
| Agency Public Profile | `agency-public-profile.html` | 13.6–13.11 |
| Compare Service Providers | `compare-providers.html` | Compare modal |
| Tradesperson Search Results | `tradesperson-search-results.html` | Search context |
| Marketplace Search Home | `marketplace-search-home.html` | Marketplace landing |
| Localized Category Page (SEO) | `localized-category-page.html` | 13.15 SEO pages |
| Post a Job Wizard | (stitch ref) | 13.5 modal flow |
| Tradesperson Job Board | (stitch ref) | 13.16 public board |

### The 14 Pages to Implement

#### Tradesperson Profile Group (13.1–13.5)
- **13.1 Tradesperson — Public Profile**: Hero (cover photo, avatar, name, trade category, location, rating, review count, trust score, verified badges row), Overview tab (bio, qualifications, service areas map, recent reviews snippet), tab navigation
- **13.2 Tradesperson — Reviews Tab**: Paginated reviews list, star breakdown donut chart, sort by (most recent / highest / lowest), verified badge per review, provider response (indented), helpful count, "Write a Review" CTA (auth-gated)
- **13.3 Tradesperson — Portfolio / Gallery Tab**: Masonry grid of before/after project photos, category filter chips (Kitchen, Bathroom, etc.), lightbox on click, project title + description overlay, load more pagination
- **13.4 Tradesperson — Services & Pricing Tab**: Service cards with category icon, service name, description, price (hourly/fixed/quote-on-request), estimated duration, "Request Quote" primary CTA per service
- **13.5 Tradesperson — Request Quote Modal**: Multi-step: (1) job description + location + budget range + timeline, (2) contact details (pre-filled if logged in), (3) confirmation + "We'll connect you within 24 hours". Creates RFQ in Supabase marketplace pipeline

#### Estate Agent Profile Group (13.6–13.11)
- **13.6 Estate Agent — Public Profile**: Agency hero (logo, brand colour accent, cover photo), stat bar (active listings, properties sold in last 12 months, avg days to sell, avg % of asking price, rating), agent bio, tab shell
- **13.7 Estate Agent — Active Listings Tab**: PropertyCard grid of current for-sale/to-rent listings, filter by type (sale/rent), sort (price, newest), "View all listings" pagination
- **13.8 Estate Agent — Sold / Let Tab**: Sold properties grid with sold price, original asking price, date sold, % of asking — shows market expertise
- **13.9 Estate Agent — Reviews Tab**: Same reviews pattern as tradesperson but with property-specific context (address, sale/let)
- **13.10 Estate Agent — Team Members Tab**: Agent team cards (photo, name, role, specialisms, direct contact button)
- **13.11 Estate Agent — Request Valuation**: Slide-in form or modal: property address (autocomplete), property type, bedrooms, tenure, preferred contact time, name + phone + email. Submits to agent's lead pipeline.

#### Specialist Profiles (13.12–13.14)
- **13.12 Mortgage Broker — Public Profile**: FCA registration number + badge, whole-of-market or tied indicator, lender panel count, specialisms (first-time buyer, remortgage, BTL, commercial), fee structure (fee-free / fixed fee), reviews, contact CTA
- **13.13 Conveyancer / Solicitor — Public Profile**: SRA/CLC registration + badge, quoted fees for standard purchase/sale/remortgage, turnaround time, no-sale-no-fee policy badge, reviews, "Get a Quote" CTA
- **13.14 Surveyor — Public Profile**: RICS membership badge, survey types offered (RICS Level 1/2/3, HomeBuyer Report, Full Building Survey), turnaround, coverage area map, reviews, "Book Survey" CTA

### Technical Architecture (Locked)
- **All routes public** — no middleware auth required for these pages
- **Server Components** everywhere — no "use client" except for interactive islands (quote modal, tab switching, lightbox)
- **SSR + generateMetadata** — dynamic title/description/OG per provider
- **JSON-LD structured data** — LocalBusiness + Review schema for SEO
- **ISR for SEO category pages** — revalidate: 3600 (1 hour)
- **Route structure**:
  - `/services/[category]/[slug]` — Tradesperson profile
  - `/agents/[slug]` — Estate agent profile
  - `/mortgage-brokers/[slug]` — Mortgage broker profile
  - `/conveyancers/[slug]` — Conveyancer profile
  - `/surveyors/[slug]` — Surveyor profile
  - `/services/[category]/[location]` — SEO category landing pages
  - `/compare` — Compare providers page

### Design System (from britestatestyle.txt)
- Brand primary: #1B4D3E (deep forest green) for trust indicators
- Brand secondary: #D4A853 (warm gold) for premium/verified badges
- Brand accent: #2563EB (action blue) for CTAs
- Plus Jakarta Sans 700 headings, Inter 400/500 body
- Shadcn/UI components (Card, Badge, Avatar, Tabs, Dialog, Sheet)
- Lucide React icons
- Radius-lg (12px) cards, shadow-sm default → shadow-md hover

### Verified Badge Design (Critical Trust Signal)
- Britestate Verified: brand-primary shield with checkmark
- Gas Safe: official flame colours
- NICEIC: electrical orange
- FCA Regulated: navy blue
- RICS: forest green
- SRA/CLC: professional blue
- Insured: green shield
- All badges show tooltip on hover with expiry date and what was verified

### Request Quote / Contact CTAs
- "Request Quote" → opens Request Quote Modal (13.5) for tradespeople
- "Request Valuation" → submits to agent lead pipeline (13.11)
- "Get a Quote" → email/call for specialist profiles
- "Book Survey" → email/form for surveyors
- All CTAs create a lead record in Supabase with provider_id, lead_type, contact details

### Compare Feature
- Max 3 providers side by side
- "Add to Compare" button on search results and profile pages
- Comparison table rows: Rating, Reviews count, Verified, Response time, Price range, Coverage area, Qualifications
- Stored in localStorage (no auth required)

### Claude's Discretion
- Tab active state persistence via URL hash (#reviews, #portfolio, etc.) — enables shareable deep links
- Lazy loading for portfolio images (Intersection Observer)
- Skeleton loaders for each tab panel on initial load
- Mobile: tabs become horizontal scroll strip, sticky below hero on scroll
- Image optimization via next/image with blur placeholder

</decisions>

<specifics>
## Specific Ideas

### Hero Section Structure (13.1 Tradesperson)
```
[Cover photo — full width, 280px tall, gradient overlay]
[Avatar — 96px, 4px brand-primary ring, positioned bottom-left of cover]
[Verified badge overlay on avatar]
  Name (H2, Plus Jakarta Sans 700)
  Trade category + Location (neutral-600)
  ★ 4.8 (127 reviews) — brand-secondary stars
  [Trust Score pill: 94/100 — brand-primary bg]
  [Verified badges row: Gas Safe | Insured | NICEIC | Britestate Verified]
  [CTA buttons: "Request a Quote" (primary) | "Call" (outline) | "Message" (ghost) | "Save" (heart)]
```

### Agency Hero (13.6)
```
[Agency cover photo]
[Agency logo — 80px, white bg card]
[Agency name (H2) + "Est. YYYY"]
[Stat bar: 42 Active | 287 Sold | 18 avg days | 98.5% asking | ★ 4.9]
[Tab nav: Overview | Listings | Sold | Reviews | Team]
```

### SEO Category Pages (/services/plumbers/london)
- H1: "Plumbers in London — Verified & Reviewed"
- Intro paragraph (generated from template with location/category)
- Filter + sort bar
- Provider card grid (TradespersonCard component from britestatestyle.txt)
- Breadcrumb: Home > Services > Plumbers > London
- FAQ section (schema markup)
- Related categories

### Localized URL Structure for SEO
- `/services/plumbers/london`
- `/services/electricians/manchester`
- `/services/builders/birmingham`
- Static params generated from provider location data
- ISR revalidation: 3600s

</specifics>

<deferred>
## Deferred Ideas

- Real-time availability booking calendar on tradesperson profile (Phase 16 handles this)
- Video introduction on profiles — infrastructure scope, v3.7 if needed
- Provider Q&A section (post/answer questions publicly) — v3.7
- AI-generated profile summary from review sentiment — v3.7
- Comparison history / saved comparisons — v3.7

</deferred>

---

*Phase: 17-service-provider-public-profiles*
*Context gathered: 2026-03-13*
*Stitch Project: 5956704101394866719 (8 screens downloaded to stitch/ folder)*
