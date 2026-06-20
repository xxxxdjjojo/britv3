# Route & CTA Audit — TrueDeed (britv3)

> **Scope:** READ-ONLY inventory of every route under `src/app/` and every visible
> link/button surfaced via the global navigation (`Header`, `MegaMenu`, `MobileNav`,
> `Footer`, homepage CTAs, role-dashboards `Sidebar`, mobile `BottomTabBar`,
> `CommandPalette`). Canonical repo: `/Users/jojominime/Documents/britv3main/britv3`.
> Source files were **not** modified. Anything not verifiable is marked **unverified**.
>
> **Audit date:** 2026-06-20.

## 0. Method & legend

- Route existence verified by `find src/app -name page.tsx`.
- CTA destinations resolved against (a) the centralized config
  `src/config/navigation.ts` (`NAV_ITEMS`, `FOOTER_LINKS`, `ROLE_PRIMARY_CTA`,
  `TAB_CONFIG`, `COMMAND_PALETTE_ROUTES`), (b) the homepage
  `src/app/(main)/page.tsx`, and (c) the dashboard Sidebar
  `src/components/layout/Sidebar.tsx:231`.
- "Required destination" per PRD (`docs/brit estate prd 2026.txt`) and epic specs.
- **Auth model:** there is **no `middleware.ts`**. `(protected)/layout.tsx:14-19`
  redirects unauthenticated users to `/login`; `(admin)/layout.tsx` gates admin.
- **Status** values: `working` · `misrouted` · `dead-link` (target route does not
  exist) · `404` · `auth-too-early` (public CTA → protected route) · `placeholder`.
- **Severity:** P0 (broken for primary persona / data loss) · P1 (broken for
  secondary persona or clear wrong target) · P2 (UX/SEO friction) · P3 (polish).
- **Test coverage** column cites the E2E specs in `e2e/`.

---

## 1. Route inventory (summary)

- **Public marketing/portal (`(main)/`):** ~95 `page.tsx` — search, properties,
  areas, sold-prices, market-trends, area-prices, valuation, value-my-property,
  compare, tools/* (10 calculators), services (+ tradespeople + category pages),
  agents / mortgage-brokers / conveyancers / surveyors / architects (list + `[slug]`),
  marketplace (+ `[slug]`), reviews, blog, help, legal/*, pricing, fee-transparency,
  sellers / developers / traders, post-a-job, how-it-works, about/careers/contact/
  press/investors/partners/jobs, sitemap-page, services-near/[service]/[postcode].
- **Auth (`(auth)/`):** login, register (+ `role-select`, `onboarding/[role]`),
  signup (invite-only seed), forgot/reset password, two-factor(-setup),
  verify-email(+confirmed), welcome, account-{deletion-confirm,locked,suspended}.
- **Protected (`(protected)/`):** dashboard (root + `[role]/*` + dedicated
  `seller/`, `landlord/`, `agent/`, `provider/`, `broker/`, `bookings/`, `rfqs/`,
  `reviews/`, `saved/` trees), settings/{account,security,privacy,preferences,
  notifications}, inbox(+`[conversationId]`), notifications, profile(+settings),
  milestones/{transaction,job}.
- **Admin (`(admin)/`):** ~33 pages — users, roles, verifications, cms
  (blog/help/landing), feature-flags, sdr, gdpr, subscriptions, promo-codes,
  reports/reported/reviews/moderation/fraud, audit-log, seo, team, system-health,
  truedeed/{disputes,rebuttals,invoice-candidates}, pricing-review, email-campaigns,
  analytics/{behaviour,platform,revenue,search}, api-usage.
- **API routes:** ~230 `route.ts` under `src/app/api/` (see CODEBASE_DISCOVERY §8).
- **Edge pages (top-level):** `/overview`, `/maintenance`, `/offline`, `/forbidden`,
  `/rate-limited`, `/session-expired`, `/unsubscribe`, `/auth/callback`.

## 2. Top navigation CTAs (MegaMenu / Header / MobileNav)

Source: `src/config/navigation.ts:178-304` (`NAV_ITEMS`), rendered by
`src/components/layout/MegaMenu.tsx` and `src/components/layout/MobileNav.tsx`.

| # | CTA label | Rendering component | Actual href | Required (PRD) | Auth | Status | Severity | Test coverage |
|---|---|---|---|---|---|---|---|---|
| 1 | Buy → Property Search | MegaMenu `navigation.ts:189` | `/search?type=buy` | `/search?type=buy` | public | **working** | — | `homepage-link-audit.spec.ts`, `checklist-link-render.spec.ts` |
| 2 | Buy → New Builds | `navigation.ts:190` | `/search?type=new-builds` | same | public | **working** | — | `link-render-routes.ts:30` |
| 3 | Buy → Map Search | `navigation.ts:191` | `/search?view=map&type=buy` | unverified | public | **working** (search reads `view`) | — | `link-render-routes.ts:31` |
| 4 | Buy → Sold Prices | `navigation.ts:195` | `/sold-prices` | `/sold-prices` | public | **working** | — | `link-render-routes.ts` "Sold Prices" |
| 5 | Buy → UK Sold Price Map | `navigation.ts:196` | `/search/map` | `/search/map` | public | **working** | — | `link-render-routes.ts` |
| 6 | Buy → Area Prices | `navigation.ts:197` | `/area-prices` | `/area-prices` | public | **working** | — | `link-render-routes.ts` |
| 7 | Buy → Market Trends | `navigation.ts:198` | `/market-trends` | `/market-trends` | public | **working** | — | `link-render-routes.ts` |
| 8 | Buy → Mortgage Calculator | `navigation.ts:202` | `/tools/mortgage-calculator` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 9 | Buy → Stamp Duty Calculator | `navigation.ts:203` | `/tools/stamp-duty-calculator` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 10 | Buy → Affordability Calculator | `navigation.ts:204` | `/tools/affordability-calculator` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 11 | Buy → First-Time Buyer Guide | `navigation.ts:207` | `/tools/first-time-buyer-guide` | tools ✓ | public | **working** | — | unverified (not in fixture) |
| 12 | Buy → Buying Advice | `navigation.ts:208` | `/blog?category=buying` | content ✓ | public | **working** (blog category filter) | P3 | unverified |
| 13 | Rent → Rental Search | `navigation.ts:215` | `/search?type=rent` | `/search?type=rent` | public | **working** | — | `link-render-routes.ts:29` |
| 14 | Rent → Map Search (rent) | `navigation.ts:216` | `/search?view=map&type=rent` | unverified | public | **working** | — | `link-render-routes.ts:33` |
| 15 | Rent → Buy vs Rent Calculator | `navigation.ts:220` | `/tools/buy-vs-rent-calculator` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 16 | Rent → Rental Yield Calculator | `navigation.ts:221` | `/tools/rental-yield-calculator` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 17 | Rent → Renter's Guide | `navigation.ts:225` | `/blog?category=renting` | **dedicated `/renter-guide` (PRD intent, unverified)** | public | **placeholder** — no dedicated guide page, only blog filter | P2 | unverified |
| 18 | Rent → Tenancy Rights | `navigation.ts:226` | `/blog?category=tenant-rights` | content ✓ | public | **working** (blog filter) | P3 | unverified |
| 19 | Services → Estate Agents | `navigation.ts:233` | `/agents` | `/agents` (PRD §690) | public | **working** | — | `link-render-routes.ts` |
| 20 | Services → Mortgage Brokers | `navigation.ts:234` | `/mortgage-brokers` | `/dashboard/broker` exists; public landing `/mortgage-brokers` ✓ | public | **working** | — | `link-render-routes.ts` |
| 21 | Services → Conveyancers & Solicitors | `navigation.ts:235` | `/conveyancers` | `/conveyancers` | public | **working** | — | `link-render-routes.ts` |
| 22 | Services → Surveyors | `navigation.ts:236` | `/surveyors` | `/surveyors` | public | **working** | — | `link-render-routes.ts` |
| 23 | Services → Architects | `navigation.ts:237` | `/architects` | `/architects` | public | **working** | — | `link-render-routes.ts` |
| 24 | Services → Browse All Trades | `navigation.ts:241` | `/marketplace` | `/marketplace` | public | **working** | — | `link-render-routes.ts` |
| 25 | Services → Plumbers / Electricians / Builders | `navigation.ts:242-244` | `/services/tradespeople?category={plumber\|electrician\|builder}` | same | public | **working** | — | `link-render-routes.ts:38-40` |
| 26 | **Services → Post a Job** | `navigation.ts:247` | `/post-a-job` | **PRD §687 `/post-a-job` wizard** | public (page self-adapts: `post-a-job/page.tsx` checks auth) | **working** | — | `link-render-routes.ts` "Post a Job" |
| 27 | **Services → Get Quotes** | `navigation.ts:248` | **`/dashboard/rfqs/create`** | public "get a quote" intent (matches master CTA list) | **protected** (`(protected)/layout.tsx` → `/login`) | **auth-too-early** — anonymous users get bounced to `/login`; should point to public `/post-a-job` (same RFQ form family) | **P1** | unverified |
| 28 | Services → Read Reviews | `navigation.ts:252` | `/reviews` | `/reviews` | public | **working** | — | `link-render-routes.ts` |
| 29 | Tools → Value My Property | `navigation.ts:259` | `/value-my-property` | `/value-my-property` | public | **working** | — | `link-render-routes.ts` (valuation suite) |
| 30 | Tools → Free Instant Valuation | `navigation.ts:260` | `/valuation` | `/valuation` | public | **working** | — | `property-valuation-flow.spec.ts` |
| 31 | Tools → Calculators (8) | `navigation.ts:264-271` | `/tools/{mortgage,stamp-duty,affordability,buy-vs-rent,rental-yield,remortgage,moving-cost,energy-bill}-calculator` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 32 | Tools → Compare Properties | `navigation.ts:275` | `/compare` | `/compare` | public | **working** | — | `link-render-routes.ts` |
| 33 | Tools → Mortgage Comparison | `navigation.ts:276` | `/tools/mortgage-comparison` | tools ✓ | public | **working** | — | `link-render-routes.ts` |
| 34 | Tools → Area Guides | `navigation.ts:280` | `/areas` | `/areas` (PRD §416) | public | **working** | — | `link-render-routes.ts` |
| 35 | Advice → Blog & Guides | `navigation.ts:288` | `/blog` | `/blog` | public | **working** | — | `link-render-routes.ts` |
| 36 | Advice → How It Works | `navigation.ts:289` | `/how-it-works` | **PRD §1141 `/how-it-works`** | public | **working** | — | `link-render-routes.ts` |
| 37 | Advice → Help Centre | `navigation.ts:290` | `/help` | `/help` | public | **working** | — | `link-render-routes.ts` |
| 38 | Advice → Area Guides | `navigation.ts:291` | `/areas` | `/areas` | public | **working** | — | (dup of #34) |
| 39 | **Advice → Agent Resources** | `navigation.ts:295` | `/blog?category=agents` | **dedicated agent-resources hub (PRD intent, unverified)** | public | **placeholder** — blog filter only; no `/agent-resources` page | P2 | unverified |
| 40 | **Advice → Landlord Guides** | `navigation.ts:296` | `/blog?category=landlords` | **dedicated landlord guide / onboarding (PRD intent, unverified)** | public | **placeholder** — blog filter only; no `/landlord-guide` | P2 | unverified |
| 41 | List/Sell → Sell Your Home | `navigation.ts:300` | `/sellers` | `/sellers` | public | **working** | — | `link-render-routes.ts` |
| 42 | List/Sell → Get a Valuation | `navigation.ts:301` | `/valuation` | `/valuation` | public | **working** | — | (dup of #30) |
| 43 | List/Sell → Find an Estate Agent | `navigation.ts:302` | `/agents` | `/agents` | public | **working** | — | (dup of #19) |
| 44 | List/Sell → List a Rental | `navigation.ts:306` | `/dashboard/landlord/properties` | landlord dashboard | **protected** | **auth-too-early** for a top-nav CTA (acceptable if intended as a logged-in shortcut) | P2 | unverified |
| 45 | List/Sell → Landlord Dashboard | `navigation.ts:307` | `/dashboard/landlord` | `/dashboard/landlord` (PRD §565) | protected | **working** (when authed) | — | `dashboard-navigation.spec.ts` |
| 46 | List/Sell → Developers | `navigation.ts:311` | `/developers` | `/developers` | public | **working** | — | unverified |
| 47 | List/Sell → Traders | `navigation.ts:312` | `/traders` | `/traders` | public | **working** | — | unverified |
| 48 | List/Sell → Agent Dashboard | `navigation.ts:316` | `/dashboard/agent` | `/dashboard/agent` (PRD §593) | protected | **working** (when authed) | — | `dashboard-navigation.spec.ts` |
| 49 | List/Sell → Pricing & Plans | `navigation.ts:317` | `/pricing` | `/pricing` | public | **working** | — | `pricing-links.spec.ts` |

## 3. Header right-rail CTAs

Source: `src/components/layout/AuthButtons.tsx`, `src/components/layout/MobileNav.tsx:121-135`, `src/components/layout/SearchTrigger.tsx`.

| CTA | Component | href | Auth | Status | Severity |
|---|---|---|---|---|---|
| Sign In (logged-out) | `AuthButtons.tsx:53` | `/login` | public | **working** | — |
| **List Property** (logged-out, desktop) | `AuthButtons.tsx:56` | `/register` | public | **working** (label is "List Property" but lands on generic register — messaging mismatch only) | P3 |
| Saved badge (logged-in) | `AuthButtons.tsx:22` | role-aware saved path | authed | **working** | — |
| Notifications bell (logged-in) | `AuthButtons.tsx:24` | `/notifications` | authed | **working** | — |
| Avatar → dashboard | `AuthButtons.tsx:38` | `/dashboard` | authed | **working** (`dashboard/page.tsx` redirects by `active_role`) | — |
| Get Started (mobile, logged-out) | `MobileNav.tsx:131` | `/register` | public | **working** | — |
| Sign In (mobile) | `MobileNav.tsx:125` | `/login` | public | **working** | — |
| Search trigger | `SearchTrigger.tsx` | `/search` (Cmd+K palette) | public | **working** | — |

## 4. Homepage CTAs (`src/app/(main)/page.tsx`)

| Line | CTA label | href | Status | Severity | Test |
|---|---|---|---|---|---|
| `page.tsx:243` | Buy tab | `/search?type=buy` | **working** | — | `homepage-link-audit.spec.ts` |
| `page.tsx:249` | Rent tab | `/search?type=rent` | **working** | — | " |
| `page.tsx:255` | Find Services tab | `/search?type=find-services` | **working** (search accepts arbitrary `type`) | P3 | unverified (not in fixture) |
| `page.tsx:264` | Hero search box / Ask AI | `/search` | **working** | — | " |
| `page.tsx:321` | For Sale tab | `/search?status=for-sale` | **working** | P3 | unverified (`status` vs `type` param mixing) |
| `page.tsx:327` | To Rent tab | `/search?status=to-rent` | **working** | P3 | unverified (same) |
| `page.tsx:333` | New Builds tab | `/search?status=new-builds` | **working** | P3 | unverified (uses `status` not `type` — inconsistent with MegaMenu #2) |
| `page.tsx:345` | View all properties | `/search` | **working** | — | " |
| `page.tsx:114-152` | Service cards: Plumbers/Electricians/Builders/Agents/Mortgage Brokers/Surveyors | `/services/tradespeople?category=…`, `/agents`, `/services/mortgage-brokers`, `/services/surveyors` | **working** | — | `link-render-routes.ts` |
| `page.tsx:415` | Browse all services | `/services` | **working** | — | " |
| `page.tsx:574` | Read more on our blog | `/blog` | **working** | — | " |
| `page.tsx:587` | Blog post cards | `/blog/{slug}` (hard-coded slugs) | **dead-link risk** — slugs `uk-property-market-forecast-2026`, `first-time-buyer-checklist`, `eco-friendly-upgrades` are literals; **unverified** they exist in `cms_articles` | P2 | unverified |
| `page.tsx:635` | **List Your Property** | `/register?role=seller` | **working** — `RegisterForm.tsx:76` reads `?role=` (and `?professional=`) and pre-selects role | — | unverified |
| `page.tsx:641` | Find a Professional | `/services` | **working** | — | " |

**Param-consistency finding (P3):** homepage mixes `?type=` (hero tabs) with `?status=` (featured-properties tabs) for what is conceptually the same filter. MegaMenu standardizes on `?type=`. The search page reads both but the inconsistency is a maintainability/SEO smell.

## 5. Footer CTAs

Source: `src/config/navigation.ts:310-389` (`FOOTER_LINKS`).

| CTA | href | Status | Severity |
|---|---|---|---|
| Buy / Rent / New Builds | `/search?type={buy\|rent\|new-builds}` | **working** | — |
| **Commercial** | `/search?type=commercial` | **unverified** — no commercial listing type in schema observed; search page may render empty | P2 |
| Sold Prices | `/sold-prices` | **working** | — |
| Find Tradespeople | `/marketplace` | **working** | — |
| Sellers / Developers / Traders / Estate Agents | `/sellers`, `/developers`, `/traders`, `/agents` | **working** | — |
| Tools: Stamp Duty / Mortgage / Valuation / Area Guides / Market Trends | `/tools/*`, `/valuation`, `/areas`, `/market-trends` | **working** | — |
| Company: About / Pricing / Fee Transparency / Careers / Contact / Blog / Help | `/about`, `/pricing`, `/fee-transparency`, `/careers`, `/contact`, `/blog`, `/help` | **working** | — |
| Legal hub + 7 legal sub-pages | `/legal/*` | **working** (all `page.tsx` exist under `(main)/legal/`) | — |
| Popular Areas (London…Cambridge) | `/areas/{city}` | **working** (dynamic `[city]` route; cities unverified seeded) | P3 |
| Social (Twitter/LinkedIn/Instagram/Facebook) | external `truedeed.*` URLs | **working** (external, not audited for HTTP 200) | P3 |

## 6. Role-dashboard primary CTAs (`ROLE_PRIMARY_CTA` — Sidebar bottom button)

**Source:** `src/config/navigation.ts:596-604`, rendered at
`src/components/layout/Sidebar.tsx:231`. These appear for **logged-in** users in
their role dashboard.

| Role | CTA label | Actual href | Real route | Status | Severity | Evidence |
|---|---|---|---|---|---|---|
| homebuyer | Book a Viewing | `/search` | `/search` ✓ | **working** | — | — |
| renter | Find a Rental | `/search` | `/search` ✓ | **working** | — | — |
| **seller** | List New Property | **`/dashboard/seller/listings/new`** | `/dashboard/seller/listings/create` | **dead-link (404)** — `listings/new` directory does not exist; only `listings/create/page.tsx` | **P0** | `find src/app/(protected)/dashboard/seller/listings/new` → none; `ls …/create/page.tsx` exists |
| **landlord** | Add Property | **`/dashboard/landlord/listings/new`** | `/dashboard/landlord/properties/add` | **dead-link (404)** — no `landlord/listings/new`; canonical add page is `landlord/properties/add/page.tsx` | **P0** | `find …/landlord/listings/new` → none; `…/properties/add/page.tsx` exists |
| **agent** | New Listing | **`/dashboard/agent/listings/new`** | `/dashboard/agent/listings/create` | **dead-link (404)** — no `agent/listings/new`; only `agent/listings/create/page.tsx` | **P0** | `find …/agent/listings/new` → none; `…/listings/create/page.tsx` exists |
| service_provider | Find Work | `/dashboard/provider/jobs/leads` | `/dashboard/provider/jobs/leads` ✓ | **working** | — | — |
| mortgage_broker | New Lead | `/dashboard/broker/leads` | `/dashboard/broker/leads` ✓ | **working** | — | — |

> The `/listings/new` vs `/listings/create` (seller) and `/listings/new` vs
> `/properties/add` (landlord) drift suggests the Sidebar CTA was never updated
> after the create-route was renamed/relocated. **Three P0 dead CTAs on the
> primary creation action for the three biggest professional personas.**

## 7. Mobile bottom-tab bar (`TAB_CONFIG`) — spot check

Source: `navigation.ts:610-660`. All hrefs match existing routes (Search, role
Saved, role Applications/Listings/etc., `/inbox`, `/profile`). The landlord tab
`/dashboard/landlord/properties` exists; the agent `/dashboard/agent/listings`
exists; provider `/dashboard/provider/jobs/leads` exists; broker
`dashboardPathForRole("mortgage_broker","leads")` → `/dashboard/broker/leads`
exists. **No dead tabs observed.**

## 8. Command Palette (`COMMAND_PALETTE_ROUTES`) — spot check

Source: `navigation.ts:666-784`. All public entries resolve to existing pages
covered above. Dashboard entries are role-gated (the palette filters by
`roles:[]`). Notable: the palette **omits** a "Get Quotes" entry that would
otherwise duplicate the misrouted mega-menu CTA (#27) — i.e. the palette is
cleaner than the mega menu here.

## 9. Master-prompt CTA checklist (explicit coverage)

| Required CTA (master prompt) | Resolved route | Status | Notes |
|---|---|---|---|
| Post a job | `/post-a-job` | ✅ working | PRD §687 |
| **Get a quote** | **`/dashboard/rfqs/create`** (mega menu #27) | ⚠ **auth-too-early** | Public equivalent is `/post-a-job`; the named CTA bounces anon users to `/login` |
| Value my property | `/value-my-property` | ✅ working | Multi-step journey |
| Free instant valuation | `/valuation` | ✅ working | |
| Compare properties | `/compare` | ✅ working | |
| Compare service providers | `/api/providers/compare` (API only) | ⚠ **no UI page** | `providers/compare/route.ts` exists; no `/compare-providers` page renders it | P2 |
| Rental search | `/search?type=rent` | ✅ working | |
| Buy search | `/search?type=buy` | ✅ working | |
| Find estate agent | `/agents` | ✅ working | PRD §690 |
| Find mortgage advisor | `/mortgage-brokers` | ✅ working | |
| Find conveyancer | `/conveyancers` | ✅ working | |
| Find solicitor | `/conveyancers` (combined) | ✅ working | Same page serves solicitors |
| **Auction centre** | — | ❌ **missing** | No `/auction-centre` route; not found in PRD either — requirement **unverified** | P2 |
| Market trends | `/market-trends` (+ `/national`) | ✅ working | |
| Area prices | `/area-prices` | ✅ working | |
| Area guides | `/areas` (+ `/[city]/[area]`) | ✅ working | PRD §416-417 |
| **Renter guide** | `/blog?category=renting` | ⚠ placeholder | No dedicated page | P2 |
| **Landlord guide** | `/blog?category=landlords` | ⚠ placeholder | No dedicated page; "Landlord onboarding" likely intended at `/register/onboarding/landlord` (exists) | P2 |
| **Agent resources** | `/blog?category=agents` | ⚠ placeholder | No `/agent-resources` hub | P2 |
| Seller plans | `/sellers` (links to `/pricing?tab=sellers`) | ✅ working | `sellers/page.tsx:34,57` |
| How it works | `/how-it-works` | ✅ working | PRD §1141 |
| Calculators | `/tools` (+ 10 calculators) | ✅ working | |
| Landlord onboarding | `/register/onboarding/landlord` | ✅ working (auth) | Onboarding route exists; not a public CTA surface |
| Buyer dashboard | `/dashboard/homebuyer` | ✅ working (auth) | PRD §503 |
| **Service-provider landing** | — | ❌ **missing** | No public `/providers` or `/service-providers` landing page; only `/dashboard/provider/*` (authed) and `/marketplace` (trades) | P2 |

## 10. Misrouted / dead / risk CTAs — consolidated register

| # | CTA | Source | Problem | Severity |
|---|---|---|---|---|
| M1 | List New Property (seller sidebar) | `navigation.ts:599` → `Sidebar.tsx:231` | href `/dashboard/seller/listings/new` **404**; real route `/dashboard/seller/listings/create` | **P0** |
| M2 | Add Property (landlord sidebar) | `navigation.ts:600` → `Sidebar.tsx:231` | href `/dashboard/landlord/listings/new` **404**; real route `/dashboard/landlord/properties/add` | **P0** |
| M3 | New Listing (agent sidebar) | `navigation.ts:601` → `Sidebar.tsx:231` | href `/dashboard/agent/listings/new` **404**; real route `/dashboard/agent/listings/create` | **P0** |
| M4 | Get Quotes (mega menu) | `navigation.ts:248` | public CTA → protected `/dashboard/rfqs/create`; bounces to `/login`. Should be `/post-a-job` | **P1** |
| M5 | Compare service providers | master CTA list | API only (`/api/providers/compare`); no UI page | P2 |
| M6 | Auction centre | master CTA list | no route; PRD requirement unverified | P2 |
| M7 | Service-provider landing | master CTA list | no public landing page | P2 |
| M8 | Renter / Landlord / Agent-resources guides | `navigation.ts:225,295,296` | blog-category filter stands in for a dedicated page | P2 |
| M9 | Footer "Commercial" | `navigation.ts:327` | `/search?type=commercial` — commercial type unverified in schema | P2 |
| M10 | Homepage blog cards | `page.tsx:587` | hard-coded slugs unverified against `cms_articles` | P2 |
| M11 | Homepage `?status=` vs `?type=` | `page.tsx:321,327,333` | param-name inconsistency with the rest of the nav | P3 |
| M12 | "List Property" header button | `AuthButtons.tsx:56` | label implies listing flow but lands on generic `/register` | P3 |

## 11. Test-coverage gaps for CTAs

- The three P0 sidebar dead-links (M1–M3) are **not** asserted by
  `e2e/dashboard-navigation.spec.ts` or `dashboard-upgrade-links.spec.ts`
  (the fixture would fail otherwise) — **add explicit 404-assertion tests**.
- `e2e/fixtures/link-render-routes.ts` covers the **public** surface well but
  does **not** exercise the role-sidebar `ROLE_PRIMARY_CTA` hrefs.
- No spec asserts that `/dashboard/rfqs/create` redirects anon → `/login`
  (M4) — so the auth-too-early regression is silent.
