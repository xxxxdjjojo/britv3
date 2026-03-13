# Feature Research

**Domain:** Buyer/Renter Dashboard — UK property portal (22 pages, milestone v3.1)
**Researched:** 2026-03-13
**Confidence:** HIGH (verified against Rightmove, Zoopla, Redfin, Zillow; cross-referenced with Britestate PRD)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **7.1 Dashboard Home — activity feed** | Every FAANG portal has a landing overview; Rightmove/Zoopla show recent activity inline | LOW | Aggregate from existing tables: saved_properties, viewings, offers, notifications. Single aggregated Supabase query, Redis-cached (5 min TTL). |
| **7.1 Dashboard Home — saved count + recommended** | Users need to know "where am I in my search" at a glance | LOW | Counts are cheap. Recommendations pull from AI match engine (Epic 6) if built, else sort by price/date match. |
| **7.2 Saved Properties — list + remove** | Heart/bookmark behaviour is universal; Rightmove and Zillow both offer this | LOW | Already wired in search (listing detail page). This page is just the grid view of `saved_properties` table. |
| **7.2 Saved Properties — sorting + filtering** | Rightmove added "Property Lists" (custom labels/folders) — users expect at minimum sort by date/price | MEDIUM | Sort by date saved, price, bedrooms. List grouping is a differentiator, not table stakes. |
| **7.2 Saved Properties — comparison** | Zillow and Redfin offer side-by-side compare for shortlisted properties | MEDIUM | Compare up to 4 properties. Key fields: price, beds, baths, sqft, EPC rating, council tax band. |
| **7.3 Saved Searches — list + edit + delete** | Rightmove "Searches and alerts" is their core retention feature; expected by all buyers | LOW | CRUD on `saved_searches` table. Show last-matched count and timestamp. |
| **7.4 Property Alerts — frequency setting** | Email digest (instant/daily/weekly) is the minimum; Rightmove offers instant mode | LOW | Three frequency options. Toggle per saved search. Updates `notification_preferences` JSONB. |
| **7.4 Property Alerts — notification channels** | Push + email is expected given mobile-first UX trend | MEDIUM | Email (Resend) + in-app (Supabase Realtime). Push notifications are a differentiator (browser push requires service worker). |
| **7.5 Viewing Schedule — calendar view of upcoming viewings** | ShowingTime (Zillow ecosystem) set the expectation for viewing calendars | MEDIUM | List + optional calendar grid. Pull from `viewings` table. Show status: confirmed/pending/cancelled. |
| **7.6 Viewing — Book** | Booking from listing page is universal; Redfin allows instant tour scheduling | MEDIUM | Time-slot picker, agent confirmation step. Requires available slots from agent/seller side. |
| **7.7 Viewing — Confirm / Reschedule / Cancel** | Standard booking lifecycle management | MEDIUM | State machine: pending → confirmed → completed/cancelled. Email + in-app notifications on transitions. |
| **7.8 Offers Sent — list of submitted offers** | Redfin "My Redfin: Offers" page is the direct equivalent; expected by active buyers | MEDIUM | Table: property, amount, status, date. Pull from `offers` table with JOIN to properties. |
| **7.9 Offer — Submit form** | The critical transaction entry point | HIGH | Price input, conditions (subject to survey, mortgage), message to seller. Attach AIP/proof-of-funds from document store. Status transitions trigger agent notifications. |
| **7.10 Offer — Status / Tracking** | Redfin Deal Room is the benchmark — step-by-step timeline of offer progress | HIGH | States: submitted → acknowledged → under consideration → accepted/rejected/countered. Counter-offer response flow included. |
| **7.11 Messages — Inbox** | Universal expectation; already built (Epic 5) | LOW | Reuse existing inbox component. Apply buyer-context filter (conversations about properties the user saved/viewed/offered on). |
| **7.12 Messages — Conversation Thread** | Already built (Epic 5) | LOW | Reuse existing thread component. No new work beyond routing. |
| **7.13 Documents — Upload (ID, AIP, proof of funds)** | Estate agents in the UK require AIP and proof of funds before serious offers; Redfin has "Pre-Approval Upload" | HIGH | File upload (Supabase Storage), document type tags, expiry date field for AIP. Secure share link for agents. GDPR: user owns documents, explicit share consent required. |
| **7.17 Affordability Calculator** | Calculators are table stakes on every UK portal (Rightmove, Zoopla, MoneySavingExpert) | MEDIUM | Already partially built (Epic 8). Front-end form: income, deposit, monthly outgoings → max borrowing + monthly payment. Use live BoE base rate if available. |
| **7.18 Mortgage Comparison Tool** | MoneySuperMarket/Uswitch set expectations; Zoopla/Rightmove embed comparison tools | HIGH | Table of mortgage deals filtered by LTV, term, type (fixed/tracker). Either embed a white-label API (Habito, Mojo) or build internal product data table. API integration is the pragmatic choice. |
| **7.19 Browse Mortgage Brokers** | Marketplace browse (Epic 4) covers pattern; broker listing is expected given UK market | LOW | Filter the existing provider marketplace by category = `mortgage_broker`. This is the Epic 4 marketplace filtered view. |
| **7.20 Browse Conveyancers / Solicitors** | Same as above — buyers expect to find a solicitor through the portal | LOW | Marketplace filtered by `conveyancing`. |
| **7.21 Browse Surveyors** | Same pattern | LOW | Marketplace filtered by `surveying`. |

### Differentiators (Competitive Advantage)

Features that set Britestate apart. Not required by users, but create meaningful competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **7.1 Dashboard Home — AI-recommended listings with match score %** | Rightmove shows "similar properties"; Britestate shows *why* (score breakdown: price match 90%, location 85%, size 70%) | HIGH | Requires Epic 6 AI engine (pgvector embeddings, preference vector). Match score breakdown is the differentiator — not just ranked listings but explainable AI scores. |
| **7.3 Saved Searches — map view overlay** | Rightmove added map view for saved searches. Makes spatial understanding immediate | MEDIUM | MapTiler + MapLibre already in stack. Plot all matching listings for a saved search on map. |
| **7.4 Property Alerts — "Hot market" urgency signal** | If a new listing matches and is in a fast-moving postcode (based on Britestate's own data), flag it as "Act fast" | MEDIUM | Requires market velocity data per postcode. Adds context Rightmove does not provide. |
| **7.14 Moving Checklist / Timeline** | Zillow has a generic moving checklist PDF. Britestate generates a *personalised* checklist based on the user's transaction state (offer accepted, surveyor booked, etc.) | HIGH | Dynamic checklist that auto-checks items when portal events occur (e.g., viewing booked → tick "Arrange viewings"). UK-specific stages: search → offer → legal → exchange → completion → move-in. |
| **7.15 AI Property Match — Preferences editor** | Rightmove filters are static. Britestate offers a structured preference profile (deal-breakers vs. nice-to-haves, lifestyle inputs) that feeds the AI engine | MEDIUM | Preference schema: location, price, size, commute tolerance, school catchment, deal-breakers (e.g., no leasehold), nice-to-haves. Stored in `user_preferences` JSONB. |
| **7.16 AI Property Match — Results with explanations** | Showing ranked results with reasoning ("This property scores 94% — it matches your commute requirement and is freehold") | HIGH | Each result card shows score + 2-3 reason chips. Requires Claude API call per result or pre-computed embedding similarity. Cache results in Redis (30 min TTL). |
| **7.10 Offer tracking — UK conveyancing pipeline** | Redfin Deal Room tracks milestones. Britestate maps the *UK-specific* stages: offer accepted → solicitor instructed → searches ordered → survey → exchange → completion | MEDIUM | 7-stage UK conveyancing pipeline. Each stage shows expected duration and what action buyer needs to take. Far more relevant to UK users than US-modelled tools. |
| **7.22 Referral Tracker** | Platform referral programs drive viral growth. Users can see who they have referred and what rewards they have earned | MEDIUM | Referral link generation, referred user tracking, reward status (pending/paid). Requires referral_code on user signup and a reward_events table. |
| **7.13 Documents — Secure share to agent/solicitor** | Buyers need to share AIP and proof-of-funds with agents. Currently done by email (insecure). A secure share link with expiry is meaningfully better | HIGH | Generate time-limited signed URLs (Supabase Storage). Share log with timestamp for audit trail. GDPR-compliant. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time mortgage rates from all UK lenders** | Seems like obvious value for the mortgage comparison tool | Lender rate APIs are either expensive, unreliable, or unavailable. Building rate scraping violates ToS and creates maintenance liability. Rates change daily. | Embed a white-label tool (Mojo Mortgages, Habito) or link to MoneySuperMarket with pre-filled parameters. Delivers 90% of the value at 5% of the cost. |
| **Full offer-to-completion transaction management** | Users want to manage everything in one place | UK conveyancing is legally complex. Britestate is not a regulated solicitor. Building a full case management system creates regulatory exposure and scope creep. | Build tracking/visibility only — show milestone status updated by the agent/solicitor. Not a replacement for legal case management. |
| **Renter tenancy management on this page set** | Renters have tenancy management needs too | Tenancy management is a separate domain with rent payment, maintenance, and legal notice workflows. Building it here bloats the milestone scope. | Defer to a dedicated renter tenancy section. This milestone covers search/application journey only. |
| **Social sharing of saved properties** | Users want to share interesting properties with partners/family | Creates privacy issues if property details are shared publicly. Rightmove tried this and it raised data concerns. | Build a "Share with co-applicant" feature (invite a partner email to view your saved list) — private, explicit, and far safer. Defer to v1.x. |
| **AVM (Automated Valuation Model) per saved property** | Knowing if a property is under/over-priced is genuinely valuable | AVMs require significant data science infrastructure and ongoing maintenance. Error rates of 10-15% can mislead buyers and create trust issues. | Show "average sold price in this postcode" using Land Registry data instead — factual, defensible, and nearly as useful. |
| **Inline mortgage application** | Conversion opportunity; Zillow (via Rocket Mortgage) does this | Britestate is not an FCA-regulated lender or mortgage broker. Initiating applications creates regulatory liability. | Refer to verified mortgage brokers in the marketplace with a clear "not financial advice" disclaimer. |

---

## Feature Dependencies

```
7.6 Viewing — Book
    └──requires──> Agent/Seller has availability slots (seller dashboard feature)
    └──requires──> 7.5 Viewing Schedule (display layer)

7.9 Offer — Submit
    └──requires──> 7.13 Documents — Uploads (AIP attachment)
    └──requires──> Property has active listing status

7.10 Offer — Status / Tracking
    └──requires──> 7.9 Offer — Submit (offers must exist)
    └──enhances──> 7.14 Moving Checklist (offer accepted activates checklist)

7.14 Moving Checklist
    └──requires──> 7.10 Offer — Status (needs offer state to auto-check items)
    └──enhances──> 7.13 Documents (checklist items link to document uploads)

7.16 AI Match — Results
    └──requires──> 7.15 AI Match — Preferences (preferences must be set first)
    └──requires──> Epic 6 AI engine (pgvector embeddings, already built)

7.1 Dashboard Home — AI Recommendations
    └──requires──> 7.15 AI Match — Preferences (or fallback to search-history heuristics)

7.19 Browse Mortgage Brokers
    └──requires──> Epic 4 Marketplace (already built — filtered view only)

7.20 Browse Conveyancers / Solicitors
    └──requires──> Epic 4 Marketplace (already built — filtered view only)

7.21 Browse Surveyors
    └──requires──> Epic 4 Marketplace (already built — filtered view only)

7.11 Messages — Inbox
    └──requires──> Epic 5 Messaging (already built — routing + filter only)

7.12 Messages — Conversation Thread
    └──requires──> Epic 5 Messaging (already built — routing only)

7.22 Referral Tracker
    └──requires──> referral_code captured on user signup (verify Epic 1 includes this)
    └──requires──> reward_events table (new, simple)
```

### Dependency Notes

- **7.9 Offer Submit requires 7.13 Documents:** UK estate agents require AIP before accepting serious offers. Build documents upload before or in parallel with offer submit — they must ship in the same sprint.
- **7.10 Offer Tracking enhances 7.14 Moving Checklist:** When an offer is accepted, the moving checklist activates with the UK conveyancing timeline pre-populated. This creates the "platform as transaction partner" value proposition unique to Britestate.
- **7.16 AI Results requires 7.15 Preferences:** Preferences editor is the input; results are the output. Build in the same sprint, preferences first.
- **7.19–7.21 Browse pages reuse Epic 4 marketplace:** These three pages are filtered views of existing provider marketplace infrastructure. LOW complexity because the backend is already built.
- **7.11–7.12 Messages reuse Epic 5:** Inbox and thread are routing + context filtering only, not net-new messaging infrastructure. Ship these early as they validate existing work.
- **7.22 Referral Tracker dependency on signup:** Check whether `referral_code` was added to the profiles table in Epic 1. If not, this requires a small migration before the tracker UI can be built.

---

## MVP Definition

### Launch With (v1 — all 22 pages in this milestone)

Every page must ship to constitute a usable buyer/renter dashboard.

- [ ] **7.1 Dashboard Home** — activity feed (viewings, offers, alerts), recommended listings (heuristic if AI not ready), saved/search counts
- [ ] **7.2 Saved Properties** — grid view, sort, remove, basic compare (2 properties)
- [ ] **7.3 Saved Searches** — list, edit criteria, delete, alert frequency toggle
- [ ] **7.4 Property Alerts / Notification Settings** — per-search frequency, channel toggles (email + in-app)
- [ ] **7.5 Viewing Schedule** — list of upcoming/past viewings with status
- [ ] **7.6 Viewing — Book** — time-slot picker, confirmation email
- [ ] **7.7 Viewing — Confirm/Reschedule/Cancel** — state transitions with notifications
- [ ] **7.8 Offers Sent** — list with property, amount, date, status
- [ ] **7.9 Offer — Submit** — price, conditions, message, AIP attachment
- [ ] **7.10 Offer — Status Tracking** — UK conveyancing stages, current state, next action
- [ ] **7.11 Messages — Inbox** — reuse Epic 5, buyer-filtered
- [ ] **7.12 Messages — Thread** — reuse Epic 5
- [ ] **7.13 Documents — Upload** — ID, AIP, proof of funds; secure share link to agent
- [ ] **7.14 Moving Checklist** — static checklist with offer-state auto-checking
- [ ] **7.15 AI Match — Preferences** — preference editor (deal-breakers + nice-to-haves)
- [ ] **7.16 AI Match — Results** — scored results with 2-3 reason chips per property
- [ ] **7.17 Affordability Calculator** — income + deposit → max borrowing + monthly payment
- [ ] **7.18 Mortgage Comparison** — embed Mojo/Habito widget or filtered product table
- [ ] **7.19 Browse Mortgage Brokers** — marketplace filtered view
- [ ] **7.20 Browse Conveyancers/Solicitors** — marketplace filtered view
- [ ] **7.21 Browse Surveyors** — marketplace filtered view
- [ ] **7.22 Referral Tracker** — referral link, referred users list, reward status

### Add After Validation (v1.x)

- [ ] **Co-applicant sharing** — invite partner to shared saved list (trigger: user feedback on searching with partners)
- [ ] **Push notifications** — browser push for instant alerts (trigger: mobile engagement metrics)
- [ ] **Full 4-property comparison** — extend compare from 2 to 4 (trigger: user requests)
- [ ] **Calendar sync (Google/Outlook)** — export viewings to external calendar (trigger: low adoption of viewing schedule page)
- [ ] **"Hot market" urgency signals** — fast-moving postcode flags on alerts (trigger: market velocity data available)
- [ ] **Land Registry sold price overlay** — "average sold price in this postcode" on offer submit page

### Future Consideration (v2+)

- [ ] **AI-generated offer price recommendation** — "Based on comparable sales, we suggest offering £X" — requires AVM confidence and legal review
- [ ] **Full conveyancing case management** — requires regulated partner integration
- [ ] **Renter tenancy application tracker** — separate feature set for renters in active application phase

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 7.1 Dashboard Home | HIGH | LOW | P1 |
| 7.2 Saved Properties | HIGH | LOW | P1 |
| 7.3 Saved Searches | HIGH | LOW | P1 |
| 7.4 Property Alerts | HIGH | LOW | P1 |
| 7.5 Viewing Schedule | HIGH | MEDIUM | P1 |
| 7.6 Viewing — Book | HIGH | MEDIUM | P1 |
| 7.7 Viewing — Confirm/Reschedule/Cancel | HIGH | MEDIUM | P1 |
| 7.8 Offers Sent | HIGH | MEDIUM | P1 |
| 7.9 Offer — Submit | HIGH | HIGH | P1 |
| 7.10 Offer — Status Tracking | HIGH | HIGH | P1 |
| 7.11 Messages — Inbox | MEDIUM | LOW | P1 |
| 7.12 Messages — Thread | MEDIUM | LOW | P1 |
| 7.13 Documents — Upload | HIGH | HIGH | P1 |
| 7.14 Moving Checklist | HIGH | MEDIUM | P1 |
| 7.15 AI Match — Preferences | HIGH | MEDIUM | P1 |
| 7.16 AI Match — Results | HIGH | HIGH | P1 |
| 7.17 Affordability Calculator | MEDIUM | MEDIUM | P1 |
| 7.18 Mortgage Comparison | MEDIUM | HIGH | P1 |
| 7.19 Browse Mortgage Brokers | MEDIUM | LOW | P1 |
| 7.20 Browse Conveyancers/Solicitors | MEDIUM | LOW | P1 |
| 7.21 Browse Surveyors | MEDIUM | LOW | P1 |
| 7.22 Referral Tracker | MEDIUM | MEDIUM | P2 |

**Priority key:**
- P1: Must have for this milestone launch
- P2: Should have, build if bandwidth allows
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Rightmove (MyRightmove) | Redfin (Deal Room) | Zillow (Super App) | Britestate Approach |
|---------|-------------------------|-------------------|-------------------|---------------------|
| Saved properties | Heart/save + Property Lists (folders) | Save + notes | Save + Zestimate on each | Grid view + compare up to 4 |
| Saved searches | Searches and Alerts with frequency settings | Saved filters | Saved searches + notifications | CRUD with per-search frequency setting |
| Property alerts | Instant/daily/weekly email | Email + push | Email + push + app | Email (Resend) + in-app Realtime + push (v1.x) |
| Viewing booking | No — hands off to agent | Instant self-schedule via ShowingTime | ShowingTime integration | Time-slot picker, agent-confirmed |
| Offer submission | No — completely off-platform | Full in-platform offer with e-signature | Online offer tool (Zillow Offers defunct) | Submit + AIP attach, UK legal disclaimer |
| Offer tracking | No | Deal Room (detailed milestone tracking) | Basic status | UK-specific conveyancing pipeline stages |
| Document upload | No | Pre-approval upload + Deal Room docs | No | ID, AIP, proof-of-funds; secure share link |
| Moving checklist | No | Generic resource articles | Generic checklist PDF | Dynamic, offer-state aware, UK-specific stages |
| AI recommendations | "Similar properties" (no score) | Behavior-based personalised recommendations | "Homes you may like" | Scored with explanation chips (Epic 6 engine) |
| Mortgage tools | Calculator only | Rocket Mortgage integration (in-app apply) | Zillow Home Loans (in-app apply) | Calculator + comparison table + broker browse |
| Service marketplace | No | No | No | Filtered browse: brokers, conveyancers, surveyors |
| Referral program | No | No | No | Referral tracker with reward status |

---

## Sources

- [MyRightmove features — Rightmove Help Centre](https://faq.rightmove.co.uk/support/solutions/articles/7000048780-what-can-i-do-with-a-myrightmove-account-)
- [Rightmove Property Alerts — Help Centre](https://faq.rightmove.co.uk/support/solutions/articles/7000048758-how-to-register-for-property-alerts)
- [Rightmove Property Lists — News](https://www.rightmove.co.uk/news/articles/property-news/property-lists/)
- [Rightmove Sent Enquiries tracking — Guides](https://www.rightmove.co.uk/guides/keep-track-of-your-sent-enquiries-to-estate-agents/)
- [Redfin Deal Room overview — Support](https://support.redfin.com/hc/en-us/articles/360001454251-Finding-the-Deal-Room-and-Owner-Dashboard)
- [Redfin Pre-Approval Upload — Support](https://support.redfin.com/hc/en-us/articles/360001454391-Pre-Approval-Upload)
- [Redfin Document Upload — Support](https://support.redfin.com/hc/en-us/articles/360001432272-Upload-and-Download-Documents-from-the-Deal-Room-or-Owner-Dashboard)
- [Zillow + ShowingTime ecosystem — Real Estate Skills](https://www.realestateskills.com/blog/redfin-vs-zillow)
- [Zoopla affordability matching — The Negotiator](https://thenegotiator.co.uk/news/land-new-homes/zoopla-matches-buyers-with-affordable-new-builds/)
- [UK property portal UX best practices 2026 — Revival Pixel](https://www.revivalpixel.com/blog/mobile-first-ui-ux-best-practices-property-search-apps-2026/)
- [UK conveyancing timeline — Homemove](https://homemove.com/content/conveyancing-process-timeline-uk-guide/)
- [UK house buying timeline — Pauzible](https://www.pauzible.com/knowledge-hub/uk-home-buying-timeline-steps-2025)
- [AIP and proof of funds requirements UK — Property Buyers Today](https://propertybuyerstoday.co.uk/send-proof-of-funds/)
- [Solicitor proof of funds timing — GetAgent](https://www.getagent.co.uk/blog/properties/solicitor-check-proof-of-funds)
- [AI property recommendations — Numalis](https://numalis.com/ai-revolutionizing-property-search-and-recommendation/)
- [Personalized AI property recommendations — Idea Usher](https://ideausher.com/blog/personalized-property-recommendations-ai/)
- [Mortgage comparison tools UK — MoneySuperMarket](https://www.moneysupermarket.com/mortgages/)
- [Best UK mortgage brokers 2025 — Nuts About Money](https://www.nutsaboutmoney.com/mortgages/best-online-mortgage-brokers)
- [Propertymark UK referral network — Propertymark](https://www.propertymark.co.uk/resource/propertymark-powers-new-uk-wide-referral-network.html)
- Britestate PRD 2026 — Section 3.4 Role-Specific Dashboards (homebuyer + renter)
- Britestate Epic 3 spec — Dashboard implementation guide

---

*Feature research for: Britestate v3.1 — Buyer/Renter Dashboard (22 pages)*
*Researched: 2026-03-13*
