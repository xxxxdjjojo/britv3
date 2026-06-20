# Product Capability Matrix — TrueDeed (britv3)

> **Audit date:** 2026-06-20.
> **Source:** synthesis of `CODEBASE_DISCOVERY.md`, `ROUTE_AND_CTA_AUDIT.md`,
> `PRODUCT_DATA_SOURCE_MATRIX.md`, `EMAIL_DELIVERY_AUDIT.md`, plus build /
> typecheck / lint runs.
>
> Legend — Status: `working` · `partial` · `broken` · `absent` · `placeholder` · `unclear`.
> Priority: `P0` (blocks primary persona / revenue / data integrity) · `P1`
> (broken for secondary persona or clear wrong target) · `P2` (UX/SEO/content gap) · `P3` (polish).

---

## 1. Build / type / lint baseline

| Concern | Status | Evidence |
|---|---|---|
| `pnpm install --frozen-lockfile` | ✅ working | exit 0, lockfile up to date |
| `pnpm build` | ✅ working | exit 0, all ~290 routes compile, full route tree printed |
| `pnpm typecheck` | ✅ working | `tsc --noEmit` exit 0, no TS errors |
| `pnpm lint` | ❌ **broken** | exit 1 — 48 errors, 112 warnings |
| `pnpm test` (vitest) | **not run in this audit** | deferred — needs separate pass; CLAUDE.md claims 1400+ tests |
| `pnpm test:e2e` (playwright) | **not run in this audit** | deferred — needs running dev server + DB |
| `pnpm check:brand` | not run | script exists; rebrand incomplete (1322 refs) |

**The "estate-agent page does not compile" claim from the master prompt does
NOT reproduce on `main`.** The CHANGELOG (`- Agents page PGRST200 error —
removed broken profiles(...) JOIN`) shows this was fixed in an earlier commit.
The `/agents` route exists at `src/app/(main)/agents/page.tsx` and compiles.

## 2. Route & CTA status (summary — see ROUTE_AND_CTA_AUDIT.md §10)

| # | CTA | Source | Problem | Status | Priority |
|---|---|---|---|---|---|
| M1 | List New Property (seller sidebar) | `navigation.ts:599` | 404 — points to `/listings/new`; real route `/listings/create` | **broken** | **P0** |
| M2 | Add Property (landlord sidebar) | `navigation.ts:600` | 404 — points to `/listings/new`; real route `/properties/add` | **broken** | **P0** |
| M3 | New Listing (agent sidebar) | `navigation.ts:601` | 404 — points to `/listings/new`; real route `/listings/create` | **broken** | **P0** |
| M4 | Get Quotes (mega menu) | `navigation.ts:248` | auth-too-early — bounces anon → `/login`; should be `/post-a-job` | **broken** | **P1** |
| M5 | Compare service providers | master CTA list | API only; no UI page | **absent** | P2 |
| M6 | Auction centre | master CTA list | no route; PRD requirement unverified | **absent** | P2 |
| M7 | Service-provider landing | master CTA list | no public landing page | **absent** | P2 |
| M8 | Renter / Landlord / Agent guides | `navigation.ts:225,295,296` | blog-filter stand-in for dedicated page | **placeholder** | P2 |
| M9 | Footer "Commercial" | `navigation.ts:327` | `/search?type=commercial` — no commercial listing type | **unclear** | P2 |
| M10 | Homepage blog cards | `page.tsx:587` | hard-coded slugs unverified against `cms_articles` | **unclear** | P2 |
| M11 | Homepage `?status=` vs `?type=` | `page.tsx:321,327,333` | param-name inconsistency | **partial** | P3 |
| M12 | "List Property" header button | `AuthButtons.tsx:56` | label implies listing flow but lands on generic `/register` | **partial** | P3 |

## 3. Functional capability by surface

### 3.1 Property search & listings
| Capability | Route | Status | Notes |
|---|---|---|---|
| Buy search | `/search?type=buy` | ✅ working | Reads `search_listings` matview when `search_live_data` flag on |
| Rent search | `/search?type=rent` | ✅ working | Same pipeline, rental listing_type |
| Map search | `/search?view=map` + `/search/map` | ✅ working | MapLibre + MapTiler |
| Market map | `/search/market-map/[areaId]` | ✅ working | HMLR PPD + ONS boundaries |
| Property detail | `/properties/[slug]` | ✅ working | Local-area layers (schools, crime, transport, broadband, flood, mobility, EPC) |
| Saved searches / properties | `/dashboard/*/saved` | ✅ working (auth) | |
| Commercial listings | `/search?type=commercial` | ⚠️ unclear | No commercial schema; silently empty |
| Auction listings | — | ❌ absent | No schema, no data |
| **Mock fallback when DB empty** | `search/actions.ts:268` | ⚠️ **data integrity risk** | 8 fabricated London listings returned as if live; no "demo data" banner |

### 3.2 Valuation & tools
| Capability | Route | Status | Notes |
|---|---|---|---|
| Value my property | `/value-my-property` (multi-step) | ✅ working | Address → details → result; address entry is the first step (matches Workstream 8.A) |
| Free instant valuation | `/valuation` | ✅ working | Separate one-shot entry — **works but is a duplicate of the canonical journey** |
| Stamp Duty calculator | `/tools/stamp-duty-calculator` | ✅ working | |
| Mortgage calculator | `/tools/mortgage-calculator` | ✅ working | Pure formula, no live rates |
| Affordability calculator | `/tools/affordability-calculator` | ✅ working | |
| Buy vs Rent calculator | `/tools/buy-vs-rent-calculator` | ✅ working | |
| Rental Yield calculator | `/tools/rental-yield-calculator` | ✅ working | |
| Remortgage calculator | `/tools/remortgage-calculator` | ✅ working | |
| Moving cost estimator | `/tools/moving-cost-estimator` | ✅ working | |
| Energy bill estimator | `/tools/energy-bill-estimator` | ✅ working | |
| First-time buyer guide | `/tools/first-time-buyer-guide` | ✅ working | |
| Mortgage comparison | `/tools/mortgage-comparison` | ✅ working | No live mortgage product data — comparison is rate-scenario only |
| Property comparison | `/compare` | ✅ working | Public route exists |
| Provider comparison | `/api/providers/compare` | ❌ absent (UI) | API endpoint only; no `/compare-providers` page |

### 3.3 Areas & market data
| Capability | Route | Status | Notes |
|---|---|---|---|
| Area guides | `/areas`, `/[city]/[area]` | ✅ working | |
| Sold prices | `/sold-prices`, `/[area]`, `/[area]/[slug]` | ✅ working | HMLR PPD monthly ingest via Inngest |
| Area prices | `/area-prices` | ✅ working | Market map features RPC |
| Market trends | `/market-trends`, `/national` | ✅ working | UK HPI monthly snapshot |
| Postcode-first sold-price page | `/sold-prices/[area]/[slug]` | ✅ working | Flat vs House + map (recent commit `547e1d11`) |
| Permitted-development layer | property detail | ✅ working | Recent commit `c03c9fe4` |

### 3.4 Services & marketplace
| Capability | Route | Status | Notes |
|---|---|---|---|
| Marketplace | `/marketplace`, `/[slug]` | ✅ working | Tradesperson discovery |
| Estate agents | `/agents`, `/[slug]` | ✅ working | Compile-OK on main |
| Mortgage brokers | `/mortgage-brokers`, `/[slug]` | ✅ working | Also `/services/mortgage-brokers` — **two routes for same intent** |
| Conveyancers & solicitors | `/conveyancers` | ✅ working | Combined page |
| Surveyors | `/surveyors`, `/[slug]` | ✅ working | |
| Architects | `/architects` | ✅ working | |
| Service category (trades) | `/services/tradespeople?category=…` | ✅ working | |
| Post a job | `/post-a-job` | ✅ working | Public, self-adapts to auth state |
| Get a quote | `/dashboard/rfqs/create` | ⚠️ broken (M4) | Auth-gated; should be `/post-a-job` |
| Provider landing | — | ❌ absent | No public `/providers` landing page |
| Provider CRM feed sync | scaffold | ❌ not implemented | Reapit/Alto/Jupix integration is stub-only |

### 3.5 Auth & user management
| Capability | Route | Status | Notes |
|---|---|---|---|
| Email/password register | `/register` | ✅ working | Currently collects first/last name (Workstream 2 wants this removed for consumers) |
| Google OAuth | `/auth/callback` | ✅ working | |
| Role select | `/register/role-select` | ✅ working | |
| Role onboarding | `/register/onboarding/[role]` | ✅ working | |
| Login | `/login` | ✅ working | |
| Password reset | `/reset-password` | ✅ working | Supabase native |
| 2FA | `/two-factor`, `/two-factor-setup` | ✅ working | |
| Email verification | `/verify-email`, `/confirmed` | ✅ working | Banner in protected layout |
| Account lock/suspend | `/account-locked`, `/account-suspended` | ✅ working | |
| Account deletion | `/account-deletion-confirm` | ✅ working | GDPR |
| Session expiry | `/session-expired` | ✅ working | |
| Rate limit page | `/rate-limited` | ✅ working | |

### 3.6 Dashboards
| Role | Dashboard | Status | Notes |
|---|---|---|---|
| homebuyer | `/dashboard/homebuyer` | ✅ working | |
| renter | `/dashboard/renter` | ✅ working | |
| seller | `/dashboard/seller` | ✅ working | Sidebar CTA dead (M1) |
| landlord | `/dashboard/landlord` | ✅ working | Sidebar CTA dead (M2) |
| agent | `/dashboard/agent` | ✅ working | Sidebar CTA dead (M3) |
| service_provider | `/dashboard/provider` | ✅ working | |
| mortgage_broker | `/dashboard/broker` | ✅ working | Outside `[role]` dynamic tree (PDR-007) |

### 3.7 Email
| Capability | Status | Notes |
|---|---|---|
| 19 React Email templates | ✅ present | `src/emails/*.tsx` |
| Resend integration | ✅ present | **Two duplicate services** (PDR-004) |
| Webhook handler | ✅ present | Svix-signed, updates email_logs |
| Suppression list awareness | ⚠️ partial | Statuses recorded; no pre-send check |
| Dead-letter queue | ❌ absent | |
| Welcome email | ✅ wired | `/auth/callback/route.ts:3` |
| RFQ/dispute/invoice/intro emails | ⚠️ Inngest-gated | Silently skip if Inngest not running |
| Valuation completion email | ❌ unclear | No `sendValuation*` export found |
| Landlord onboarding email | ❌ unclear | No `sendLandlordOnboarding*` found |
| Professional invitation email | ❌ unclear | No `sendInvitation*` found |

### 3.8 Payments & billing
| Capability | Status | Notes |
|---|---|---|
| Stripe Connect | ✅ working | 2.5% platform commission |
| Pricing page (7 segments) | `/pricing` | ✅ working |
| Fee transparency | `/fee-transparency` | ✅ working |
| Referral conversions | ⚠️ partial | TODO comments in `stripe-event-processor.ts:245,261,282` |

### 3.9 Compliance & legal
| Capability | Status | Notes |
|---|---|---|
| Legal hub | `/legal/*` | ✅ working | 14 pages |
| GDPR export/delete | `/api/gdpr/*` | ✅ working | |
| Cookie consent | banner | ✅ working | |
| Unsubscribe | `/unsubscribe` | ✅ working | |
| KYC/Identity verification | ⚠️ stub/dev | `stripe` or `didit` in prod, `stub` in dev |
| Tenant referencing (credit) | ❌ mock only | `REFERENCING_PROVIDER=mock` |
| Insurance integration | ❌ not implemented | Document upload only |

### 3.10 Content
| Capability | Route | Status | Notes |
|---|---|---|---|
| Blog / CMS | `/blog` | ✅ working | `cms_articles` table, admin CMS at `/admin/cms/blog` |
| Help centre | `/help` | ✅ working | `cms_help_articles` |
| Reviews | `/reviews`, `/[area]/[provider]` | ✅ working | |
| How it works | `/how-it-works` | ✅ working | |
| Renter guide | — | ❌ placeholder | Blog filter stand-in |
| Landlord guide | — | ❌ placeholder | Blog filter stand-in |
| Agent resources | — | ❌ placeholder | Blog filter stand-in |
| Auction centre | — | ❌ absent | |
| Build your credit | — | ❌ absent | |
| Renters insurance | — | ❌ absent | |
| Programmatic SEO | `/services-near/[service]/[postcode]` | ✅ working | SSG, ≥500 routes |

### 3.11 Infrastructure
| Capability | Status | Notes |
|---|---|---|
| Sentry error tracking | ✅ configured | `sentry.{edge,server}.config.ts` |
| PostHog analytics | ✅ configured | |
| Upstash rate limiting | ✅ configured | |
| Vercel deploy | ✅ configured | `.vercel/project.json` |
| Cloudflare cache layer | ✅ configured | `cloudflare/` |
| GitHub Actions CI | ✅ configured | `app-ci.yml`, `mobility-backfill.yml`, `perf-budget.yml` |
| PWA service worker | ✅ configured | Serwist |
| Web push notifications | ✅ configured | `web-push` |

## 4. Top-priority workstreams (P0 / P1)

1. **Fix 3 dead sidebar CTAs** (M1-M3) — `navigation.ts:599-601` hrefs.
2. **Fix Get Quotes auth-too-early** (M4) — repoint to `/post-a-job`.
3. **Fix `pnpm lint` regressions** — 48 errors block CI even though build passes.
4. **Collapse the two email services** — silent-failure risk.
5. **Remove the mock-listing fallback** OR add a clear "demo data" banner.
6. **Rotate the leaked Stitch API key** (security) and move to env var.
7. **Rebrand completion** — 1,322 "Britestate" references still.

## 5. Top-priority product gaps (P2)

1. Renter guide hub (Workstream 5.C).
2. Landlord guide hub (Workstream 9).
3. Agent resources hub (Workstream 9).
4. Auction centre (Workstream 6).
5. Build Your Credit page (Workstream 5.D).
6. Renters insurance page (Workstream 5.E).
7. Service-provider public landing (Workstream 7.D).
8. Provider comparison UI (currently API-only).

## 6. Known unknowns (need operator input)

- Is `truedeed.co.uk` a verified sending domain in Resend? **(email root cause)**
- Are Supabase Auth confirmation emails enabled in Supabase dashboard?
- Is Inngest actually running in production (not just dev)?
- Are the homepage blog-card slugs actually present in `cms_articles`?
- Is there an approved commercial listing type in the schema?
- Is `mortgage_broker`'s separate dashboard tree intentional?
- Fresh Stitch API key for fetching approved screens.
- Re-upload of the rental-filter screenshots (`/mnt/data/…` paths).
