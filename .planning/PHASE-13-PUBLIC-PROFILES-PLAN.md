# Phase 13: Service Provider Public Profiles — CEO Plan Review

> Mode: **SCOPE EXPANSION** | CEO Review: 2026-03-17 | Eng Review: 2026-03-17 | Status: Ready for implementation

## ENG REVIEW CORRECTIONS (applied 2026-03-17)

| # | Issue | Decision |
|---|-------|----------|
| 1 | Service layer collision | Extend `services/marketplace/provider-service.ts` — do NOT create `services/providers/` |
| 2 | Wrong DB table names | Corrected throughout: `service_provider_details`, `provider_portfolio_items`, `provider_services` |
| 3 | Middleware safety | Add `/providers` to `PUBLIC_ROUTES` constant; feature flag check goes AFTER session refresh |
| 4 | PostHog view count (wrong approach) | Replace with `view_count` column on `service_provider_details`, incremented via fire-and-forget API call |
| 5 | ISR + suspension gap | Keep `revalidate=3600` + add `revalidatePath()` call in admin suspend action |
| 6 | Quote service naming collision | New file: `services/marketplace/public-enquiry-service.ts` |
| 7 | nuqs `shallow:true` contradiction | Remove `shallow:true` — tab switches do server fetch (SSR for each tab) |
| 8 | Wrong sanitization library | Use `isomorphic-dompurify` (already installed) — remove `@sanitize-html` reference |
| 9 | `types/providers.ts` overwrite | Extend existing Phase 16 `types/providers.ts` — add only missing types |
| 10 | Rate limiting package | Use `@upstash/ratelimit` (already installed) not manual `@upstash/redis` logic |
| 11 | Missing TAB_CONFIG test | Add unit test for TAB_CONFIG dispatch — all 5 ProviderTypes |
| 12 | Missing JSON-LD test | Add unit test for `buildJsonLd()` — especially aggregateRating when review_count=0 |
| 13 | Missing valuation + search tests | Add test spec headers for `ValuationModal` and `SearchService.search()` |
| 14 | Tab data over-fetch | Fetch profile + active tab only on server; other tabs lazy-load client-side via react-query |
| 15 | `@vercel/og` fonts + missing dep | Add `@vercel/og` to package.json; bundle Plus Jakarta Sans as base64 in OG route |
| 16 | Geocode caching | Cache geocode results per-postcode in search API route (in-memory Map or Redis 24h TTL) |

---

## DECISIONS LOCKED

| Decision | Choice |
|----------|--------|
| Prerequisite | Merge Phase 15 + 16 worktrees → main BEFORE any code |
| URL structure | `/providers/[type]/[slug]` |
| Tab routing | URL search params via `nuqs` (`?tab=reviews`) |
| Quote auth gate | Unauthenticated allowed (rate limited) |
| Estate Agent listings tab | Stub with empty state (Phase 2 not built yet) |
| Icon system | Lucide React only — do NOT copy Material Symbols from Stitch |

---

## PAGES IN SCOPE (13.1–13.14)

| Page | Route | Notes |
|------|-------|-------|
| 13.1 Tradesperson Public Profile | `/providers/tradesperson/[slug]?tab=overview` | Hero + shared shell |
| 13.2 Tradesperson Reviews Tab | `?tab=reviews` | AI summary + "be first to review" empty state |
| 13.3 Tradesperson Portfolio/Gallery | `?tab=portfolio` | Masonry lazy load |
| 13.4 Tradesperson Services & Pricing | `?tab=services` | |
| 13.5 Tradesperson Request Quote Modal | Overlay on any tab | Unauthenticated, rate limited |
| 13.6 Estate Agent Public Profile | `/providers/estate-agent/[slug]?tab=overview` | |
| 13.7 Estate Agent Active Listings Tab | `?tab=listings` | Empty state stub until Phase 2 |
| 13.8 Estate Agent Sold/Let Tab | `?tab=sold` | Empty state stub until Phase 2 |
| 13.9 Estate Agent Reviews Tab | `?tab=reviews` | |
| 13.10 Estate Agent Team Members Tab | `?tab=team` | |
| 13.11 Estate Agent Request Valuation | Overlay modal | Unauthenticated, rate limited |
| 13.12 Mortgage Broker Public Profile | `/providers/mortgage-broker/[slug]` | Overview only, no sub-tabs |
| 13.13 Conveyancer/Solicitor Public Profile | `/providers/conveyancer/[slug]` | Overview only, no sub-tabs |
| 13.14 Surveyor Public Profile | `/providers/surveyor/[slug]` | Overview only, no sub-tabs |

**Additional pages (from Stitch designs):**
- Search/directory page: `/providers` (Find a Tradesperson — Search screen)
- Compare tool: `/providers/compare?ids=abc,def,ghi`

---

## STITCH DESIGN REFERENCES

| Screen | Stitch ID | Screenshot |
|--------|-----------|------------|
| Find a Tradesperson — Search | `7f756b4d8c6d449497bcd6d5e70457bf` | `https://lh3.googleusercontent.com/aida/ADBb0uhhvq7aC6JPxb-4uQ69jUsgM4YwqZeScQQVen1ZQCoHxUA4Qh5KOPrWfd9jLRCig-56uiCXmKd6x6bgTxOASZRWujKTdfIHl09LD-_hZytVX49puzsaEdX5Xv0tiFia5ffTNLCoWpQug1Hp6S4cdPuJz8QFpViGC6SLCLKOiuZcDSp9FPmnG9t-wNZnOn7CU8lxYt8mo8QuCPKGgqAH8-YJMjMWHwXtBFuP0Jub6u4fhLqNDG9hV0-BWQ` |
| Tradesperson Job Board | `100eb9249b914ba38086280a5462caf6` | `https://lh3.googleusercontent.com/aida/ADBb0uirp5aCLkykhn_YoO2DFf3ehEij_7khUBX6gLFYj008dfSHUPwcglvG-cn7JtchfWNTyqDtESr3i5ShU381jfWdRtDD3ghOCTFmzIm_Src8u_CkC5sDxfO-BBK0hK2k22NDA1XEffrlHYjpuSfei0CC793CkQWgcf4r-N58R7ZNmRJ6OgcUBl92Xzexx7beC83nQJ7_uCtxxQ4yiz5B5iv1OMguRSqOclTc_l8rfckOw4vCqlKwhZjJMA` |
| Compare Providers | `16f3ca1d6ddd4b7f814868108874b371` | `https://lh3.googleusercontent.com/aida/ADBb0ui0Zgo_dlDVs8NppIYof6n5Dqz7o2dwXjBS5aXhGhAdZtZORfAYIV-Kgrvr-M_n1fh3ST1IPl8SAT4TSnDU3GVadG3VjhEGrcKjm6HMFpHnLRdVN8pUGGb_eGACLrMhX7ET1Bc4klLLfy9bWO8I454GDucGQrGuEXkRfoaSorTW3Lj07howNXYIOb6xCuYXy3-g7x0WTHy1c3EJPXS1l-PZWwcBIMPGiCbORZX9gUFTBKE9vWpVpklmKT4` |
| Plumbers in Isleworth | `4e76fc6571b44a6ea5ae046950212aef` | `https://lh3.googleusercontent.com/aida/ADBb0ugr4udcfktR76gKgeXV8PQurFaeAR-GAFtBVaHRC8_hc8EtndpjoXa9BV8lui-UHogeCS4YSWYC1cCg8qyUC5CMwpY_ywrQu5u4LZyB1tg0itgDOU0ujBG3kFQvxZzzw1oyKqWAMAsf7QfB5LP1NjcW62WV_DSi7fmQbnQRavWiKavsRemSWCwPorWLePFmrBHOowLt0bfyQHKCXB0JV5IEM-CcUA5t7JZjQF6NAzUQxlCZRqC4uBdT6g` |

**Stitch project ID:** `5956704101394866719` — Title: "Britestate Homepage"

---

## DESIGN SYSTEM (from `britestatestyle.txt`)

```
Primary:   #1B4D3E (deep forest green)
Secondary: #D4A853 (warm gold)
Accent:    #2563EB (action blue)
BG Light:  #F8F8FA
Error:     #DC2626
Success:   #16A34A

Fonts:
  Headings: "Plus Jakarta Sans" weight 600–700
  Body:     "Inter" weight 400–500

Icons: Lucide React ONLY (NOT Material Symbols from Stitch)
Components: Shadcn UI + Radix primitives
Radius: sm=6px, md=8px, lg=12px, xl=16px
```

---

## ARCHITECTURE

### Route Structure

```
app/
└── (main)/                     ← NEW route group (no auth middleware)
    └── providers/
        ├── layout.tsx           ← public layout
        ├── page.tsx             ← Search page
        ├── compare/
        │   └── page.tsx         ← Compare tool
        └── [type]/
            └── [slug]/
                └── page.tsx     ← All 14 profiles (type param drives tabs)

app/api/providers/
├── search/route.ts
├── [slug]/route.ts
├── [slug]/quote/route.ts        ← POST: quote request (rate limited)
└── compare/route.ts
```

### Tab Config Map

```typescript
const TAB_CONFIG: Record<ProviderType, TabDef[]> = {
  tradesperson:     [overview, reviews, portfolio, services],
  'estate-agent':   [overview, listings, sold, reviews, team],
  'mortgage-broker':[overview],
  conveyancer:      [overview],
  surveyor:         [overview],
}
```

`ProviderType = 'tradesperson' | 'estate-agent' | 'mortgage-broker' | 'conveyancer' | 'surveyor'`

### System Architecture Diagram

```
EXTERNAL                    NEXT.JS APP ROUTER              SUPABASE
──────────                  ──────────────────              ────────
Google/SEO ──▶ JSON-LD      app/
Visitor    ──▶ OG meta       (main)/                       ┌──────────────────┐
              │               providers/                   │  provider_profiles│
              │               ├── page.tsx (search)        │  portfolio_items  │
              │               ├── compare/page.tsx         │  services_pricing │
              │               └── [type]/[slug]/           │  provider_reviews │
              │                   └── page.tsx             │  quote_requests   │
              │                       (reads ?tab)         │  property_listings│
              │                                            │  (stub, Phase 2)  │
              │               src/                         └──────────────────┘
              │               ├── services/providers/             ▲
              │               │   ├── provider-service.ts ────────┘
              │               │   └── quote-service.ts
              │               ├── components/providers/
              │               │   ├── ProfileHero.tsx      ← shared
              │               │   ├── ProfileTabs.tsx      ← shared
              │               │   ├── StarRating.tsx       ← shared
              │               │   ├── VerificationBadge.tsx← shared
              │               │   ├── ProviderCard.tsx     ← search results
              │               │   ├── QuoteModal.tsx       ← 13.5
              │               │   ├── ValuationModal.tsx   ← 13.11
              │               │   ├── ReviewsTab.tsx       ← 13.2 / 13.9
              │               │   ├── PortfolioTab.tsx     ← 13.3
              │               │   ├── ServicesTab.tsx      ← 13.4
              │               │   ├── ActiveListingsTab.tsx← 13.7 (stub)
              │               │   ├── SoldLetTab.tsx       ← 13.8 (stub)
              │               │   ├── TeamTab.tsx          ← 13.10
              │               │   └── CompareTable.tsx
              │               └── lib/
              │                   └── rate-limit.ts (Upstash)
              │
Upstash ◀─── Rate limit (quote/valuation submissions: 5/IP/hr)
Resend  ◀─── Provider email on quote received
Anthropic◀── AI review summary (Claude Haiku, cached)
PostHog ◀─── Events: profile_viewed, quote_requested, compare_used
@vercel/og ← Dynamic OG images per provider
```

### Profile Shell Pattern (DRY enforcement)

```
ProfilePageShell (Server Component — 1 file serves all 14 profiles)
├── ProfileHero          (shared: avatar, name, title, rating, badges, CTAs)
│   ├── VerificationBadge
│   ├── StarRating
│   ├── "Viewed X times this week" counter   ← DELIGHT-1
│   ├── "Compare with similar" button        ← DELIGHT-2
│   └── Share button + OG image              ← DELIGHT-3
├── ProfileTabs          (shared: nuqs URL state, TAB_CONFIG drives render)
└── [TabContent]         (role-specific, injected via TAB_CONFIG)
```

---

## DATABASE

### Required Tables (post Phase 15+16 merge)

**CORRECTED names from actual Phase 15/16 schema (not assumed names):**

Run this after merge to verify:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Actual tables (confirmed from Phase 15/16 types):
- `service_provider_details` — slug, business_name, description, services[], service_postcodes[], base_location (PostGIS), years_experience, pricing (JSONB), website_url, is_active
- `provider_portfolio_items` — provider_id, image_url, title, description, display_order
- `provider_services` — provider_id, service_name, description, price_from, price_to, unit
- `reviews` — provider_id (or via marketplace service_request_id), reviewer_id, rating, body, created_at
- `provider_rating_stats` — provider_id, avg_rating, total_reviews, five_star…one_star (VIEW or materialized view)
- `agent_agency_profiles` — for Estate Agent public profiles (separate from tradesperson)
- `profiles` — joined via service_provider_details.user_id → profiles.id (full_name, avatar_url, provider_verification_status)

### New Table: `quote_requests`

```sql
CREATE TABLE quote_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES provider_profiles(id),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  description   TEXT NOT NULL,
  ip_hash       TEXT NOT NULL,  -- hashed, never raw IP
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS: service role only (never exposed to public SELECT)
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON quote_requests
  USING (auth.role() = 'service_role');
```

### New Table: `provider_ai_cache`

```sql
CREATE TABLE provider_ai_cache (
  provider_id   UUID PRIMARY KEY REFERENCES provider_profiles(id),
  summary_text  TEXT NOT NULL,
  review_count  INT NOT NULL,  -- invalidate when count changes
  generated_at  TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);
```

### Required Indexes

```sql
CREATE UNIQUE INDEX provider_profiles_slug_idx ON provider_profiles(slug);
CREATE INDEX provider_profiles_type_idx ON provider_profiles(provider_type);
CREATE INDEX provider_profiles_location_gist_idx ON provider_profiles USING GIST(location);
CREATE INDEX provider_reviews_provider_id_idx ON provider_reviews(provider_id);
CREATE INDEX portfolio_items_provider_display_idx ON portfolio_items(provider_id, display_order);
```

### RLS: Allow anon SELECT on public fields

```sql
-- provider_profiles: public can read active providers (exclude internal fields)
CREATE POLICY "public read active profiles" ON provider_profiles
  FOR SELECT TO anon
  USING (is_active = true)
  -- NOTE: columns internal_notes, admin_flags, bank_details must NOT be in SELECT list

-- provider_reviews: public read
CREATE POLICY "public read reviews" ON provider_reviews
  FOR SELECT TO anon USING (true);

-- portfolio_items: public read
CREATE POLICY "public read portfolio" ON portfolio_items
  FOR SELECT TO anon USING (true);

-- services_pricing: public read
CREATE POLICY "public read services" ON services_pricing
  FOR SELECT TO anon USING (true);
```

---

## SERVICE LAYER

### `provider-service.ts`

```typescript
// src/services/providers/provider-service.ts

export type ProviderType =
  | 'tradesperson'
  | 'estate-agent'
  | 'mortgage-broker'
  | 'conveyancer'
  | 'surveyor';

// Throws ProviderNotFoundError if not found OR if is_active = false
export async function getBySlug(type: ProviderType, slug: string): Promise<ProviderProfile>

// Returns empty array (never throws) for zero results
export async function search(params: SearchParams): Promise<ProviderProfile[]>

// Max 3 IDs. Returns array with null slots for not-found IDs
export async function getCompare(ids: string[]): Promise<(ProviderProfile | null)[]>

// Fetches all tab data in parallel (Promise.all — no N+1)
export async function getProfileWithTabs(providerId: string): Promise<ProfileWithTabs>
```

### `quote-service.ts`

```typescript
// src/services/providers/quote-service.ts

// IMPORTANT: DB write is source of truth. Resend email is fire-and-forget.
// Never log: name, email, phone. Log only: provider_slug, quote_id, ip_hash, timestamp.
export async function submitRequest(
  providerSlug: string,
  data: QuoteRequestInput,
  ipHash: string
): Promise<{ quote_id: string }>
```

### `rate-limit.ts`

```typescript
// src/lib/rate-limit.ts
// Uses Upstash Redis. Config via env: QUOTE_RATE_LIMIT_PER_HOUR (default: 5)
// CRITICAL: If Redis is unreachable, fail OPEN (allow request through) + log warning.
// Never silently block all quotes due to Redis outage.

export async function checkQuoteRateLimit(ipHash: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}>
```

---

## ERROR & RESCUE MAP

### All Named Exceptions

| Exception | Trigger | Action | User Sees |
|-----------|---------|--------|-----------|
| `ProviderNotFoundError` | slug not found OR is_active=false | `notFound()` | 404 page |
| `InvalidProviderTypeError` | type not in ProviderType union | `notFound()` | 404 page |
| `PostgrestError` (read) | Supabase query fails | error.tsx boundary | "Something went wrong" |
| `PostgrestError` (write) | INSERT quote_request fails | 500 JSON | "Couldn't submit — try again" |
| `RateLimitExceededError` | >5 quote requests/IP/hr | 429 JSON | "Too many requests. Try in 1 hour." |
| `ValidationError` (Zod) | Invalid form fields | 400 JSON with field errors | Inline field errors |
| `ResendError` | Email delivery fails | Log warn, continue (non-blocking) | Nothing (quote saved) |
| `GeocodeError` | Location not recognised | Return empty array | "Location not found" |
| `AnthropicTimeoutError` | Claude Haiku timeout | Log + skip AI summary | Profile loads without summary |
| `EmptyCompareError` | 0 IDs in compare URL | Redirect to /providers | Redirect |

### CRITICAL RULE: Quote Submit Flow

```
DB write FIRST → email SECOND (non-blocking)
Never rollback DB write due to email failure.
Quote is saved or it isn't. Email is best-effort.
```

---

## SECURITY REQUIREMENTS

### HIGH SEVERITY — Must implement before shipping

1. **XSS in review content**
   - Phase 15/16 dashboards: sanitize review body at write time (use `@sanitize-html`)
   - Public profile render: always escape review content (React does this by default — never use `dangerouslySetInnerHTML` for review text)

2. **PII in logs**
   - Quote service must log ONLY: `{ provider_slug, quote_id, ip_hash, timestamp, rate_limit_remaining }`
   - NEVER log: `name`, `email`, `phone`, `description`

### Other Security Requirements

- **Rate limiting**: 5 quote requests per IP per hour via Upstash. Use `CF-Connecting-IP` (Cloudflare) not raw `X-Forwarded-For`.
- **Honeypot field**: Add invisible `company` field to quote form. If filled, reject silently (bot detection).
- **RLS**: `quote_requests` table: service role only. `provider_profiles` anon SELECT excludes `internal_notes`, `admin_flags`, bank details.
- **Inactive providers**: Return 404 (same as not found). Never reveal "suspended" status to public.
- **CSRF**: Quote API validates `Content-Type: application/json`. No cookie auth on public endpoints.

---

## QUOTE REQUEST DATA FLOW

```
User fills QuoteModal
    │
    ├── CLIENT Zod validation
    │   name required, email valid, description ≥ 10 chars
    │
    ▼
POST /api/providers/[slug]/quote
    │
    ├── Slug lookup → not found → 404
    │
    ├── Rate limit check (Upstash)
    │   exceeded → 429 {"error": "Too many requests", "retry_after": 3600}
    │
    ├── SERVER Zod validation → invalid → 400 {errors: {field: msg}}
    │
    ├── DB INSERT quote_requests → fails → 500 (log PostgrestError code)
    │
    ├── Resend email (non-blocking, fire-and-forget)
    │   fails → log warn {provider_slug, quote_id, resend_error_code} — NOT returned to user
    │
    └── 201 {"quote_id": "...", "message": "Request sent!"}
```

---

## INTERACTION EDGE CASES

| Interaction | Edge Case | Handler |
|-------------|-----------|---------|
| Quote modal submit | Double-click | Disable button + spinner on first click |
| Quote modal submit | Network timeout >10s | AbortController + error message |
| Quote modal submit | Invalid email | Client + server Zod (both) |
| Compare page | 0 providers in URL | Redirect to /providers |
| Compare page | >3 providers in URL | Truncate to 3 |
| Compare page | Provider ID not found | "Provider unavailable" slot |
| Search page | Zero results | Empty state + "Broaden your search" |
| Search page | Location not recognised | Inline "Location not found" |
| Search page | 500+ results | Cursor-based pagination, 12/page |
| Profile page | Suspended provider | 404 (same as not found — no info leak) |
| Profile page | Zero reviews | "Be the first to review [Name]" CTA |
| Profile page | Zero portfolio items | Empty state with provider upload CTA |
| Profile page | Very long bio | Truncate at ~300 chars + "Read more" |
| Reviews tab | 500 reviews | Paginate 12/page, load more |
| Portfolio gallery | Corrupt image URL | `onError` fallback to placeholder |
| Portfolio gallery | 100+ items | Masonry with Intersection Observer lazy load |

---

## PERFORMANCE REQUIREMENTS

### No N+1 Queries

```typescript
// WRONG:
const profile = await getProvider(slug)
const reviews = await getReviews(profile.id)    // separate query
const portfolio = await getPortfolio(profile.id) // separate query

// CORRECT: parallel fetch
const [profile, reviews, portfolio, services] = await Promise.all([
  getProvider(slug),
  getReviews(providerId, { limit: 12 }),
  getPortfolio(providerId),
  getServices(providerId),
])
```

### Caching Strategy

| Route | Strategy | TTL |
|-------|----------|-----|
| Profile page | ISR (`revalidate = 3600`) | 1 hour |
| Search page | ISR (`revalidate = 300`) | 5 min |
| Compare page | No cache (dynamic URL params) | — |
| AI review summary | `provider_ai_cache` table | 7 days |

### Image Performance

- Profile hero cover: `<Image priority={true}>` (LCP element)
- Provider avatars: 80×80px WebP, `sizes` prop set
- Portfolio gallery: `loading="lazy"` + Intersection Observer

---

## OBSERVABILITY

### Structured Log Events (no PII)

```typescript
logger.info('provider_profile_viewed', {
  provider_slug, provider_type, tab, referrer_domain
})

logger.info('quote_request_submitted', {
  provider_slug, quote_id, ip_hash, rate_limit_remaining
})

logger.warn('quote_email_delivery_failed', {
  provider_slug, quote_id, resend_error_code
})

logger.warn('quote_rate_limit_exceeded', {
  ip_hash, provider_slug
})

logger.warn('redis_rate_limit_unavailable', {
  error_code  // Redis down → allow request + log
})
```

### PostHog Events

```typescript
posthog.capture('provider_profile_viewed', { type, slug, source })
posthog.capture('provider_tab_switched', { type, slug, from_tab, to_tab })
posthog.capture('quote_modal_opened', { type, slug })
posthog.capture('quote_form_submitted', { type, slug, success })
posthog.capture('compare_initiated', { provider_count, types })
posthog.capture('search_performed', { query, location, result_count })
```

### Day-1 Alerts

- Quote API 5xx > 5% → Slack/PagerDuty
- Redis connection failure → immediate Slack (all rate limiting broken)
- Resend delivery failure > 10% → Slack warning

---

## DEPLOYMENT

### Rollout Order

```
1. git merge phase-15-agent-dashboard → main
2. git merge phase-16-tradesperson-dashboard → main
3. pnpm build → verify clean
4. supabase db push (quote_requests, provider_ai_cache, indexes, RLS policies)
5. Set FEATURE_PUBLIC_PROFILES=false in prod env
6. Deploy app code
7. Smoke test via direct URL in staging
8. Set FEATURE_PUBLIC_PROFILES=true → public launch (no redeploy needed)
```

### Rollback Plan

```
1. Set FEATURE_PUBLIC_PROFILES=false → routes go dark instantly
2. OR: git revert deploy commit → removes (main)/providers routes
3. Tables remain (additive, cause no harm)
4. Time to rollback: < 5 minutes, zero data loss
```

### Post-Deploy Verification

```bash
# Profile loads
curl https://britestate.com/providers/tradesperson/[known-slug] → 200

# 404 for unknown
curl https://britestate.com/providers/tradesperson/does-not-exist → 404

# Quote submit works
curl -X POST https://britestate.com/api/providers/[slug]/quote \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","description":"Need a plumber for leak"}' → 201

# Compare tool works
curl https://britestate.com/providers/compare?ids=abc,def → 200

# Search works
curl "https://britestate.com/providers?type=tradesperson&location=islington" → 200
```

---

## BUILD WAVES

### Wave 0 — Prerequisites (before writing any Phase 13 code)

- [ ] Merge Phase 15 worktree (`phase-15-agent-dashboard`) → main
- [ ] Merge Phase 16 worktree (`phase-16-tradesperson-dashboard`) → main
- [ ] Run `pnpm build` — verify clean after merge
- [ ] Audit merged schema: confirm table names for `provider_profiles`, `portfolio_items`, `provider_reviews`, `services_pricing`
- [ ] Add env vars: `QUOTE_RATE_LIMIT_PER_HOUR=5`, `FEATURE_PUBLIC_PROFILES=false`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Wave 1 — Foundation

**New files:**
```
src/types/providers.ts
src/services/providers/provider-service.ts
src/services/providers/quote-service.ts
src/lib/rate-limit.ts
src/app/(main)/providers/layout.tsx
src/app/(main)/providers/[type]/[slug]/page.tsx   ← shell only
src/app/api/providers/search/route.ts
src/app/api/providers/[slug]/route.ts
src/app/api/providers/[slug]/quote/route.ts
src/app/api/providers/compare/route.ts
supabase/migrations/[timestamp]_phase13_public_profiles.sql
```

**Deliverable:** Profile shell renders (may 404 until data exists). Quote API accepts and saves requests. Rate limiter operational.

### Wave 2 — Tradesperson Profile (13.1–13.5) + Shared Components

**New files:**
```
src/components/providers/ProfileHero.tsx         ← shared
src/components/providers/ProfileTabs.tsx         ← shared (nuqs)
src/components/providers/StarRating.tsx          ← shared utility
src/components/providers/VerificationBadge.tsx   ← shared utility
src/components/providers/ContactCTA.tsx          ← shared CTA button
src/components/providers/ProviderCard.tsx        ← search result card
src/components/providers/QuoteModal.tsx          ← 13.5
src/components/providers/ReviewsTab.tsx          ← 13.2 (AI summary + empty state)
src/components/providers/PortfolioTab.tsx        ← 13.3
src/components/providers/ServicesTab.tsx         ← 13.4
```

**Delight items in this wave:**
- `ProfileHero`: "Viewed X times this week" badge (PostHog count)
- `ReviewsTab`: "Be the first to review [Name]" empty state with CTA
- `ReviewsTab`: AI review summary callout (Claude Haiku, `provider_ai_cache`)

### Wave 3 — Estate Agent Profile (13.6–13.11) + Search + Compare

**New files:**
```
src/components/providers/ActiveListingsTab.tsx   ← 13.7 (empty state stub)
src/components/providers/SoldLetTab.tsx          ← 13.8 (empty state stub)
src/components/providers/TeamTab.tsx             ← 13.10
src/components/providers/ValuationModal.tsx      ← 13.11
src/components/providers/CompareTable.tsx
src/app/(main)/providers/page.tsx                ← Search page
src/app/(main)/providers/compare/page.tsx        ← Compare tool
```

### Wave 4 — Specialist Profiles + SEO + Delight (13.12–13.14)

**New files:**
```
src/app/api/og/providers/[slug]/route.tsx        ← @vercel/og dynamic OG images
```

**Updates to existing files:**
```
src/app/(main)/providers/[type]/[slug]/page.tsx  ← add JSON-LD, OG meta, feature flag
src/components/providers/ProfileHero.tsx         ← add Share button, "Compare with similar"
src/middleware.ts                                ← FEATURE_PUBLIC_PROFILES gate
```

**Specialist profiles** (13.12–13.14) use the same `page.tsx` — TAB_CONFIG for `mortgage-broker`, `conveyancer`, `surveyor` returns `[overview]` only. No new page files needed.

**SEO items in this wave:**
- JSON-LD `LocalBusiness` schema on every profile page
- Dynamic `generateMetadata()` with provider name, trade, location
- `@vercel/og` dynamic OG images (provider photo + name + rating)
- Feature flag middleware gate

---

## DELIGHT ITEMS (all BUILD NOW)

| Item | Where | Effort | Notes |
|------|-------|--------|-------|
| AI review summary | ReviewsTab | S (~30 min) | Claude Haiku, cache in `provider_ai_cache`. Skip gracefully if no reviews or API fails. |
| JSON-LD structured data | page.tsx | S (~45 min) | LocalBusiness schema. Star ratings in Google results. |
| Feature flag | middleware.ts | S (~20 min) | `FEATURE_PUBLIC_PROFILES` env var. |
| "Viewed X times" counter | ProfileHero | S (~20 min) | PostHog event count for `profile_viewed` in last 7 days. |
| "Compare with similar" button | ProfileHero | S (~45 min) | Queries 2 similar providers (same type + nearest location) → pre-populates compare URL. |
| Dynamic OG image | api/og route | S (~1 hr) | `@vercel/og`. Provider photo + name + rating + trade. |
| Share button | ProfileHero | S (~20 min) | `navigator.clipboard.writeText(url)` + toast. |
| "Be first to review" empty state | ReviewsTab | S (~30 min) | Empty state with CTA that opens review modal. |

---

## NOT IN SCOPE (deferred to TODOS.md)

| Item | Reason | Priority |
|------|--------|----------|
| Review submission form (write) | Separate feature from display | P2 |
| Provider subscription/featured badge | Requires Stripe (Phase 18) | P2 |
| AI review summary cache refresh cron | Needs AI summary live first | P2 |
| Provider analytics dashboard widget | Needs real traffic first | P2 |
| Response rate badge | Needs Phase 3 messaging data | P2 |
| Sitemap.xml generation | After profiles indexed by Google | P2 |
| Provider booking calendar | Future phase | P3 |
| Admin moderation of public profiles | Phase 20 admin back-office | P3 |

---

## TODOS.md ADDITIONS

```markdown
## TODO: AI Review Summary Cache Refresh Cron
Priority: P2 | Effort: M | Depends: AI review summary live + Phase 3 messaging
Weekly Supabase Edge Function cron regenerates stale AI summaries for providers
who received new reviews since last generation. Cache in provider_ai_cache table.
Start: Supabase Edge Function cron docs + provider_ai_cache expires_at column.

## TODO: Provider Subscription Tiers (Featured Profiles + Search Placement)
Priority: P2 | Effort: L | Depends: Stripe (Phase 18), public profiles live
Providers pay £X/mo for featured badge + top placement in search.
Primary monetisation of provider marketplace.
Start: provider_subscriptions table + Stripe billing integration.

## TODO: Provider Analytics Dashboard Widget
Priority: P2 | Effort: M | Depends: PostHog events from public profiles, Phase 15/16
Show providers: profile views, quote requests, search appearances, completeness score
in their own dashboard. Drives profile completion (LinkedIn-style).
Start: PostHog query API for profile_viewed events grouped by provider_id.

## TODO: Provider Response Rate Badge
Priority: P2 | Effort: S | Depends: Phase 3 messaging system
"Responds within 2 hours average" on profile hero.
Computed from time-to-first-reply in messaging table.
Start: Query messages table for avg(first_reply_at - received_at) per provider_id.

## TODO: Sitemap.xml for Provider Profiles
Priority: P2 | Effort: S | No dependencies
Dynamic sitemap.xml including /providers/[type]/[slug] for all active providers.
Start: app/sitemap.ts in Next.js App Router + Supabase query for active provider slugs.
```

---

## FAILURE MODES REGISTRY

| Codepath | Failure Mode | Rescued? | Test? | User Sees | Logged? |
|----------|--------------|----------|-------|-----------|---------|
| Profile page load | Provider not found | Y → notFound() | Y | 404 page | Y |
| Profile page load | Provider suspended | Y → notFound() | Y | 404 page (no info leak) | Y |
| Profile page load | Supabase timeout | Y → error.tsx | Y | "Something went wrong" | Y |
| Quote submit | Rate limit exceeded | Y → 429 | Y | "Try again in 1 hour" | Y |
| Quote submit | Zod validation fail | Y → 400 | Y | Inline field errors | Y |
| Quote submit | DB INSERT fail | Y → 500 | Y | "Couldn't submit" | Y |
| Quote submit | Resend email fail | Y → continue | Y | Nothing (quote saved) | Y (warn) |
| Redis down | Rate limit check fails | Y → fail OPEN | Y | Nothing (request allowed) | Y (warn) |
| AI summary | Anthropic timeout | Y → skip | Y | Profile without summary | Y |
| AI summary | Empty reviews | Y → skip | Y | Profile without summary | N/A |
| Compare page | 0 IDs in URL | Y → redirect | Y | /providers search page | N |
| Compare page | ID not found | Y → null slot | Y | "Provider unavailable" | Y |
| Search | Zero results | Y → empty array | Y | Empty state UI | N |
| Search | Geocode fails | Y → GeocodeError | Y | "Location not found" | Y |

---

## IMPLEMENTATION NOTES

### nuqs for Tab State

```typescript
// In profile page.tsx (Server Component reads searchParams)
// In ProfileTabs.tsx (Client Component uses nuqs)
import { useQueryState } from 'nuqs'

const [tab, setTab] = useQueryState('tab', {
  defaultValue: 'overview',
  shallow: true,  // no server roundtrip on tab change
})
```

### AI Review Summary Pattern

```typescript
// src/services/providers/ai-review-service.ts
export async function getReviewSummary(providerId: string): Promise<string | null> {
  // 1. Check cache (provider_ai_cache) — return if not expired
  // 2. If cache miss/expired: fetch last 20 reviews from DB
  // 3. If 0 reviews: return null (skip silently)
  // 4. Call Claude Haiku with review texts
  // 5. On AnthropicTimeoutError: log + return null (non-blocking)
  // 6. On success: upsert cache, return summary
}
```

### JSON-LD Pattern

```typescript
// In page.tsx generateMetadata or as a <script> tag in the page
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": provider.name,
  "description": provider.bio,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": provider.average_rating,
    "reviewCount": provider.review_count,
  },
  "address": { "@type": "PostalAddress", "addressLocality": provider.location },
  "priceRange": provider.hourly_rate ? `£${provider.hourly_rate}/hr` : undefined,
}
```

### Feature Flag Pattern

```typescript
// src/middleware.ts
if (
  request.nextUrl.pathname.startsWith('/providers') &&
  process.env.FEATURE_PUBLIC_PROFILES !== 'true'
) {
  return NextResponse.rewrite(new URL('/404', request.url))
}
```

---

*Plan reviewed and approved 2026-03-17. All 5 architectural decisions locked. Ready for Wave 0 execution.*
