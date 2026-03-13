# Phase 13: Seller Dashboard - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning
**Source:** Stitch design screens + britestatestyle.txt + user PRD

<domain>
## Phase Boundary

Phase 13 delivers the complete Seller Dashboard — 18 screens covering the full UK property sale journey from listing creation through to completion. This phase is UI-heavy with a 7-step listing wizard, real Supabase data wiring, AI description generation, and a sale progression tracker. The primary users are individual sellers (not estate agents — those have their own dashboard in Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Design System — LOCKED from Stitch screens
- **Primary colour**: `#1B4D3E` (deep forest green) for sidebar, CTAs, active nav items — matches britestatestyle.txt brand tokens
- **Fonts**: Plus Jakarta Sans (headings, logo), Inter (body) — import from Google Fonts
- **Sidebar**: 256px wide, dark forest green background (`bg-primary`), white text, white/10 icon bg, fixed inset
- **Layout pattern**: Fixed sidebar (left) + scrollable main content (right, `ml-64`)
- **Card style**: White bg, `rounded-2xl`, `shadow-sm border border-slate-200`, hover → `shadow-xl`
- **KPI cards**: Icon in coloured pill bg, large bold number (`text-3xl font-extrabold`), percentage badge in emerald for positive trends
- **Welcome banner**: `bg-primary rounded-2xl` with white text, abstract SVG decoration, personalized insight about listing performance

### Seller Dashboard - Home (Screen: be2e4e27)
- **Sidebar nav items**: Dashboard, My Listings, Enquiries, Viewings, Market Analytics, Settings
- **KPI row**: 4 cards — Active Listings, Total Views (+% badge), Enquiries (+% badge), Upcoming Viewings (+% badge)
- **Performance chart**: 30-day SVG line chart with area fill, `stroke="#1B4D3E"`, grid lines, period selector dropdown
- **Recent enquiries**: List below chart with avatar, name, message preview, time
- **Upcoming viewings**: Compact list with property thumb, address, datetime, type badge
- **All data from real Supabase queries** — no hardcoded arrays

### My Listings (Screen: c9bf8804)
- **Status tabs**: Active (12) / Under Offer (4) / Sold (89) / Drafts (2) — with counts from real data
- **Listing card layout**: Horizontal card with 288px image (left), content (centre), weekly mini bar chart + Edit/Archive buttons (right panel with left border separator)
- **Image**: `overflow-hidden rounded-xl`, hover scale transition `group-hover:scale-105 duration-500`
- **Stats row on card**: Views (blue icon), Saves (pink icon), Enquiries (orange icon) — each with icon in coloured pill + count
- **Actions dropdown**: More vert button → Edit, Update Price, Pause, Archive, Delete
- **"Create New Listing" button**: In header, orange/primary bg, plus icon

### Create Listing Step 1 - Address & Property Type (Screen: 150129e9)
- **Note**: Stitch uses orange `#ec5b13` as primary — actual implementation uses `#1B4D3E` per brand
- **Layout**: Centred 640px max-width form with stepper at top
- **Stepper**: "Step X of 7" label + percentage text + thin progress bar (`h-2`, filled with primary colour)
- **Postcode lookup**: Input + "Find Address" button side-by-side → populates address select dropdown
- **Property type grid**: 2-col mobile / 4-col desktop grid of icon cards (Detached, Semi-Detached, Terraced, Flat/Maisonette, Bungalow, Other)
- **Selected state**: `border-2 border-primary bg-primary/5` vs unselected `border-slate-200`
- **Tenure toggle**: Freehold / Leasehold pill buttons; if Leasehold → show "Years Remaining" number input in `bg-slate-100 rounded-xl` container
- **Footer**: Back button (left) + Continue button (right, primary with arrow icon, `shadow-lg shadow-primary/20`)
- **Floating help button**: Fixed bottom-right, `h-14 w-14 rounded-full bg-slate-900 text-white`

### Create Listing - AI Description (Screen: 4ed106ef)
- **Layout**: 2-column grid (2/3 input, 1/3 preview sidebar)
- **Tone selector**: Pill buttons — Professional / Warm / Luxury (selected = `border-primary bg-primary/10 text-primary font-bold`)
- **Textarea**: Min-height 300px, `rounded-xl`, character count bottom-right, readability score badge (`bg-green-100 text-green-700`)
- **"Generate with AI" button**: Next to label, `text-primary font-bold` with auto_awesome icon — calls Claude API
- **Key Selling Points**: Separate card below textarea with individual text inputs + add more button
- **Preview sidebar**: Sticky, shows live listing card preview with shimmer skeleton placeholders + expert tip panel
- **AI regeneration limit**: Max 3 per listing (enforce server-side)
- **Tone options map to prompts**: Professional (agent-style), Warm (lifestyle-focused), Luxury (premium language)

### Offers Received (Screen: 43639e431)
- **Property breadcrumb**: Header shows "Properties > 14 Elm Road — 3 Active Offers"
- **View toggle**: List View / Table View pill switcher + "Compare All" button
- **Offer card layout**: Avatar + buyer name + verified badge + chain status + offer time → offer amount (large, bold) + % vs asking price → Accept / Counter / Delete buttons
- **Buyer details shown**: Chain-free or in-chain (with count), cash buyer or mortgage, offer timestamp
- **Amount color coding**: Above asking → `text-green-600` with up arrow; at asking → `text-slate-500`; below → `text-red-600`
- **Accept flow**: Opens confirmation modal with offer details + solicitor details form
- **Counter flow**: Opens counter offer modal with amount input + message textarea
- **Reject/Delete**: Confirmation dialog before action

### Sale Progression Tracker (Screen: 63a0ccaf)
- **8 stages**: Offer Accepted → Solicitors Instructed → Searches → Survey → Mortgage Offer → Exchange → Completion (shown as horizontal stepper with connecting line)
- **Stage states**: Completed (green circle with check), Current (primary colour, pulsing rotate icon, ring), Future (slate/40 opacity)
- **Progress line**: Partial fill from left to current stage percentage
- **Current stage detail card**: `bg-primary/5 border border-primary/20`, shows expected date + days remaining as pill badges
- **Documents section**: List of important docs with status (uploaded/pending/missing)
- **Key contacts sidebar**: Solicitor, buyer's solicitor, mortgage broker — with action buttons
- **Share Progress button**: Generates shareable link

### Screens to Build (18 total)
1. **8.1 Dashboard Home** — KPIs, chart, enquiries list, viewings list
2. **8.2 My Listings** — Status tabs, listing cards with stats
3. **8.3 Create Listing Step 1** — Address & Property Type
4. **8.4 Create Listing Step 2** — Property Details (beds, baths, features, garden, parking)
5. **8.5 Create Listing Step 3** — Photos & Media Upload (drag-drop, reorder, floor plans, video)
6. **8.6 Create Listing Step 4** — AI Description (Claude API, 3 tones, key selling points)
7. **8.7 Create Listing Step 5** — Price & Listing Type (For Sale/Rent/Auction, qualifiers, AI valuation)
8. **8.8 Create Listing Step 6** — EPC Upload
9. **8.9 Create Listing Step 7** — Review & Publish (full preview, checklist, publish CTA)
10. **8.10 Listing Analytics** — Recharts line/pie, views/saves/enquiries/CTR, date range selector
11. **8.11 Manage Viewings** — Calendar + list, confirm/reschedule/cancel, feedback collection
12. **8.12 Offers Received** — Offer cards with buyer details, compare view
13. **8.13 Offer Accept/Reject/Counter** — Modal flows with solicitor details
14. **8.14 Sale Progression Tracker** — 8-stage pipeline, documents, contacts
15. **8.15 Instant Valuation** — AI estimate + Land Registry comparables
16. **8.16 Find an Estate Agent** — Search by area, AgentCard grid
17. **8.17 Agent Comparison** — Side-by-side comparison table (up to 3)
18. **8.18 Agent Profile View** — From seller context, request valuation CTA

### Route Structure — LOCKED
```
/dashboard/seller/
  page.tsx                     → 8.1 Dashboard Home
  listings/page.tsx            → 8.2 My Listings
  listings/create/page.tsx     → Multi-step wizard (steps 1-7 via URL query or state)
  listings/[id]/analytics/page.tsx → 8.10 Analytics
  listings/[id]/edit/page.tsx  → Edit listing
  viewings/page.tsx            → 8.11 Manage Viewings
  offers/page.tsx              → 8.12 Offers Received
  offers/[id]/page.tsx         → 8.13 Offer detail + actions
  sale-progress/[id]/page.tsx  → 8.14 Sale Progression
  valuation/page.tsx           → 8.15 Instant Valuation
  agents/page.tsx              → 8.16 Find Agent
  agents/compare/page.tsx      → 8.17 Agent Comparison
  agents/[id]/page.tsx         → 8.18 Agent Profile
```

### Backend/Data — LOCKED
- **Real Supabase data throughout** — no hardcoded mock arrays in final implementation
- **Supabase tables needed**: `seller_listings` (extends existing `properties`), `listing_analytics_events`, `viewings` (reuse from Phase 10), `offers` (reuse from Phase 10), `sale_progression_stages`, `agent_enquiries`
- **AI description**: Claude Haiku via Anthropic SDK, server-side route handler, max 3 regenerations stored in `listing_description_attempts`, rate-limited via Upstash Redis
- **Image upload**: Client-side compress (browser-image-compression) → Supabase Storage → sharp resize server-side (reuse Phase 2 pipeline)
- **Land Registry data**: UK Price Paid Data API (free public SPARQL endpoint) for valuation comparables

### Stitch Design References — Use as pixel-perfect reference
- **Seller Dashboard Home**: `be2e4e27405143949575b1a54b23cb56` — primary `#1B4D3E` sidebar variant
- **My Listings**: `c9bf8804de2f41edaccc1d1c244bcf70` — horizontal listing cards
- **Create Listing Step 1**: `150129e9a79d4331b0c6726fcf9c1c16` — stepper + postcode + property type grid
- **AI Description**: `4ed106ef5ab14334acefeaaefd423c50` — tone selector, AI button, preview sidebar
- **Offers Received**: `43639e431bc24076993126e8c20132e1` — buyer cards with accept/counter
- **Sale Progression**: `63a0ccaf52004a5e9ce241a5b3bb679f` — horizontal stepper with stages

### Quality Bar — FAANG level
- **All interactions animated**: 150-300ms transitions, hover lift shadows, scale on CTA press
- **Skeleton loaders**: Per-section, matching actual component shapes
- **Mobile responsive**: Sidebar becomes bottom nav, cards go full-width, wizard stays single-column
- **Zero layout shift**: Skeleton dimensions match final content
- **Error states**: Form validation inline, upload error recovery, API failure graceful degradation
- **Empty states**: Custom per-page with relevant CTAs (not generic "no data")

### Claude's Discretion
- Chart library: Recharts (already in tech stack) — use LineChart + AreaChart + PieChart
- Wizard state management: URL query params (`?step=2`) so back button works correctly
- Image reorder: React DnD or `@dnd-kit/core` for drag-and-drop photo ordering
- Postcode lookup: `postcodes.io` free API (reuse from Phase 2)
- Sale stage transitions: Server-enforced state machine (cannot skip stages)

</decisions>

<specifics>
## Specific Design Details from Stitch Screens

### Dashboard Home Sidebar (from be2e4e27)
```
Nav items: Dashboard | My Listings | Enquiries | Viewings | Market Analytics | Settings
User card at bottom: Avatar + "Alex Thompson" + "Premium Seller" label
```

### My Listings Card (from c9bf8804)
```
Image: w-72 h-48, position left
Content: address, price (text-2xl font-black), stats row
Right panel: mini bar chart (7 bars) + Edit/Archive buttons
Tab counts: Active(12) | Under Offer(4) | Sold(89) | Drafts(2)
```

### Sale Progression Stages (from 63a0ccaf)
```
1. Offer Accepted (green check)
2. Solicitors Instructed (green check)
3. Searches (current — pulsing orange)
4. Survey (pending)
5. Exchange (pending)
6. Completion (pending)
Note: Full 8-stage version adds: Mortgage Offer + Contracts Signed between Survey and Exchange
```

### Offer Card Details (from 43639e431)
```
Fields shown: Buyer name, Verified badge, chain status, buyer type, offer timestamp
Amount: £XXX,XXX (text-3xl font-black)
% vs asking: colored text with trending_up icon
Actions: Accept (primary) | Counter (outline) | Delete (ghost icon)
```

</specifics>

<deferred>
## Deferred Ideas

- **Vendor Report PDF**: Auto-generated PDF per listing — deferred (requires PDF lib setup)
- **CRM/Lead management**: Estate agent-level CRM — deferred to Agent Dashboard phase
- **Rightmove/Zoopla integration**: Property portal syndication — deferred (commercial partnerships)
- **Video tour upload**: S3 transcoding pipeline — deferred (cost/complexity)
- **Open House scheduling**: Advanced viewing management — deferred post-MVP

</deferred>

---

*Phase: 13-seller-dashboard*
*Context gathered: 2026-03-13 via PRD Express Path + Stitch designs*
*Stitch project: 5956704101394866719 (Britestate Homepage)*
