# Truedeed (britv3) — Performance Audit

**App:** britv3 (Next.js 16.2.1 App Router, React 19, Supabase)
**Date:** 2026-06-14
**Branch:** `perf/audit-and-fixes`
**Method:** Local **production** build (`next build && next start`, port 3004) measured with Chrome
DevTools performance traces under mobile emulation (412×915, DPR 2.625, **Slow 4G, 4× CPU**).
Dev numbers captured against `next dev` (port 3000). Backend = remote Supabase (AWS **eu-west-1**);
`search_live_data` flag is **off**, so `/search` and `/properties/[slug]` serve **mock data** (no DB)
in this configuration.

> Measurement-first changed the conclusions. Several static-analysis hypotheses were **debunked**
> by real numbers (see §6). Confirmed findings and debunked ones are kept separate on purpose.

---

## 1. Executive summary

1. **The "extremely slow" experience is `next dev`, not production.** Same machine, same routes:
   homepage **630 ms (dev) → 32 ms (prod)**; property detail **8.59 s (dev) → ~0.7 s (prod, in
   browser)**. Dev mode compiles routes on demand with un-minified, dev-mode React. **A demo must
   never be served from `next dev`.** This single fact addresses most of the perceived slowness.
2. **P0 production bug:** `/properties/[slug]` returns **HTTP 500 (`DYNAMIC_SERVER_USAGE`)** on a
   direct server request. A tester sharing/hard-loading a property URL gets an error page. Root
   cause: the page is SSG (`generateStaticParams`) yet renders with `cookies()`-backed Supabase
   auth. Must fix before any global demo.
3. **Production Core Web Vitals are already good** on the pages measured: homepage **LCP 902 ms,
   CLS 0.00**; detail **LCP 718 ms, CLS 0.00** (mobile, throttled). TTFB 30–32 ms warm.
4. **Images are already optimized on the wire** — `next/image` serves the hero as **WebP 31.7 KB**
   (not the 454 KB source JPEG). The "ship 3.9 MB of images" concern is **false at runtime**. AVIF
   is the only real (minor) image win — it is not currently enabled.
5. **Real, confirmed frontend win:** Recharts (**362 KB** minified chunk) is in the **property-detail
   client bundle** via `CrimeStatsChart`, inflating the page's hydration/render delay (688 ms of the
   718 ms LCP is render delay). Code-splitting it is the highest-value frontend change.
6. **Public pages render dynamically (`ƒ`)** instead of static, because shared code reads
   `cookies()`/auth during render. Making them static/ISR is the biggest *scalability* lever for a
   global audience (every request currently hits the origin).
7. **DB/API latency findings are real but unexercised locally** (mock mode). They matter once
   `search_live_data` is on and the app talks to eu-west-1; benchmarks for those require flipping
   the flag (see §7).

**Bottom line:** the product is far closer to "fast" than it felt. Priorities are (a) deploy to a
production target — Vercel + Cloudflare; (b) fix the detail-page 500; (c) make public pages
static/ISR; (d) code-split Recharts. Image conversion and font-weight trimming are **not** warranted.

---

## 2. Environment & methodology

| Item | Value |
|------|-------|
| Build | `pnpm build` (Next 16, **webpack**), exit 0 (warnings only) |
| Prod server | `pnpm start` on :3004 |
| Dev server | `next dev` on :3000 (pre-existing, prior session) |
| Emulation | Mobile 412×915 DPR 2.625, Slow 4G, 4× CPU throttle |
| Backend | Remote Supabase, DB pooler `aws-1-eu-west-1` |
| Data mode | `NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA=false` → search + detail use mock data |
| TypeScript compile (build) | 115 s |
| Static pages generated | 1086 (mostly `/services-near/[service]/[postcode]` SSG) |

Re-run steps live in `scripts/perf-baseline.md`.

---

## 3. Baseline metrics

### 3.1 Lab Core Web Vitals (production, mobile, throttled)

| Route | TTFB | LCP | CLS | LCP breakdown | Notes |
|-------|------|-----|-----|---------------|-------|
| `/` (homepage) | 32 ms | **902 ms** | **0.00** | load delay 763 ms, render 107 ms | hero WebP 31.7 KB; LCP image discovered late |
| `/properties/[slug]` | 30 ms | **718 ms** | **0.00** | render delay 688 ms | render delay = JS hydration (Recharts) |

Both pass the LCP < 2.5 s and CLS < 0.1 targets in production.

### 3.2 Dev vs Prod (server response time, same machine)

| Route | `next dev` warm | `next start` warm | Delta |
|-------|-----------------|-------------------|-------|
| `/` | 630 ms | 32 ms | ~20× |
| `/properties/[slug]` | **8.59 s** | 500 (bug) / ~0.7 s in browser | ~12×+ |

### 3.3 JavaScript bundle

| Item | Value |
|------|-------|
| Total `.next/static/chunks` | 14 MB (all routes) |
| Recharts chunk | `31013-*.js` = **362 KB** minified (~100 KB gzip) |
| Recharts on property-detail route | **Yes** — referenced by `page_client-reference-manifest.js` |
| Homepage images loaded on first paint | 4 (hero + 3 cards); below-fold lazy-loaded ✓ |

### 3.4 Images (on the wire, via `/_next/image`)

| Asset | Source on disk | Served (browser Accept) | Format |
|-------|----------------|--------------------------|--------|
| `hero/hero-bg.jpg` | 454 KB | **31.7 KB** @ w=1200 q75 | WebP |
| `properties/property-1.jpg` | 542 KB | **54.6 KB** @ w=640 q75 | WebP |
| AVIF availability | — | falls back to PNG when only `image/avif` offered | **AVIF disabled** |

---

## 4. Root-cause table

| # | Symptom | Evidence | Confirmed cause | Metric | Severity | Fix | Test | Expected impact | Risk | Rollback |
|---|---------|----------|-----------------|--------|----------|-----|------|-----------------|------|----------|
| R1 | "Extremely slow" locally | dev 8.59 s vs prod 0.7 s detail | Served via `next dev` (on-demand compile, dev React) | perceived/all | **P0** | Demo from `next start`/Vercel, never `next dev` | re-measure prod CWV | ~10–20× faster | none | n/a |
| R2 | Detail URL → HTTP 500 | `DYNAMIC_SERVER_USAGE`, 3/3 curls | SSG page (`generateStaticParams`) renders with `cookies()` auth (`page.tsx:75,275,280`) | correctness/TTFB | **P0** | Make route dynamic OR move auth-dependent reads into a streamed/`Suspense` client island; keep static shell | e2e: `GET /properties/<slug>` == 200 | unblocks demo + SEO | medium (touches render path) | revert page change |
| R3 | Recharts in detail bundle | `page_client-reference-manifest.js` refs `31013` (362 KB) | `CrimeStatsChart` eager-imported (`page.tsx:51`) | TBT/render delay | **P1** | `next/dynamic({ssr:false})` client wrapper, below-fold | bundle-budget test: recharts NOT in detail first-load | lower render delay/TBT | low | revert import |
| R4 | All public pages `ƒ` dynamic | build route table | shared code reads `cookies()`/auth during render | TTFB/scale | **P1** | static/ISR for truly public pages; isolate auth to islands | route-type assertion / TTFB | origin offload, global speed | medium | revert |
| R5 | AVIF not served | curl AVIF→PNG fallback | `images.formats` defaults to WebP only | LCP (minor) | **P2** | `images.formats=['image/avif','image/webp']` | image-format test | ~20–30% smaller images | low | revert config |
| R6 | Hero LCP load delay 763 ms | trace LCPDiscovery | LCP image request starts late | LCP (minor) | **P2** | add `sizes`/preload hint to hero | LCP budget | small LCP gain | low | revert |
| R7 | N+1 + uncached detail queries; middleware auth per request; `count:"exact"` | `property-detail-service.ts:312-327`, `middleware.ts:177-299`, `listing-service.ts:315` | confirmed in code; **not exercised in mock mode** | TTFB (live) | **P1 (live only)** | join agent query; wire existing Redis; trim middleware; drop exact count | query-count + p95 tests w/ `search_live_data=on` | big TTFB win to eu-west-1 | medium | revert + down migration |
| R8 | No long-lived cache headers asserted | next.config has none | platform defaults only | cache correctness | **P2** | `headers()` for static; never cache authed HTML | header contract tests | CDN efficiency | low | revert |

---

## 5. Bottleneck ranking (by impact on the global demo)

1. **R1** Serve production, not dev (free, biggest perceived win).
2. **R2** Fix `/properties/[slug]` 500 (blocks the core demo flow).
3. **R4** Make public pages static/ISR (global scalability via edge).
4. **R3** Code-split Recharts (TBT/render delay on the key page).
5. **R7** API/DB latency — only once live data is on (eu-west-1 round-trips).
6. **R5/R6/R8** AVIF, hero preload, cache headers (minor polish).

---

## 6. Debunked / reframed hypotheses (honesty section)

| Original hypothesis | Verdict | Why |
|---------------------|---------|-----|
| F1: ~3.9 MB unoptimized images shipped | **Debunked (runtime)** | `next/image` serves WebP 31–55 KB; source size ≠ wire size |
| F10: drop Plus Jakarta Sans weight 500 | **Rejected** | `font-medium` used in 466 files incl. headings → visual regression risk for ~15 KB |
| "Images are the #1 LCP problem" | **Debunked** | LCP 902 ms with CLS 0; images already optimized |
| F2: Recharts eager on detail | **Confirmed** | 362 KB chunk in detail client manifest |
| F3/F4/F5/F8: DB/middleware costs | **Confirmed in code, unmeasured** | mock mode bypasses DB; needs `search_live_data=on` |

---

## 7. Measuring the live-data (DB) path

To benchmark R7 honestly, set `NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA=true` locally (talks to
eu-west-1), rebuild, and trace `/search` + `/properties/[slug]`. Expect TTFB to jump from ~30 ms
(mock) to tens–hundreds of ms per query (network to eu-west-1), amplifying the N+1 and uncached-query
costs. Index/`EXPLAIN ANALYZE` verification should run against a safe (non-prod) database.

---

## 8. Infrastructure recommendation (summary)

**Vercel + Cloudflare.** Next.js 16 App Router (SSR/RSC streaming/ISR/per-route caching) runs
natively on Vercel's global edge. A single Hostinger/VPS+Nginx origin gives one region, manual ISR
wiring, and no edge — worse global CWV for more ops. Nginx load-balancing is unjustified (one
origin; the origin is not the bottleneck). Cloudflare sits in front for DNS/WAF/TLS; cache only
`/_next/static/*` and `/images/*` long-lived; **never** cache authed HTML (bypass on `sb-*` cookies).
Detail to be added with the cdn-config commit.

---

## 9. Change log (this engagement)

| Commit | Status | Before → After |
|--------|--------|----------------|
| `perf-audit: baseline` | ✅ done | this document + re-run harness |
| `fix(properties): detail dynamic` | ✅ done | `/properties/[slug]` **500 → 200** (e2e route-status green) |
| `perf(properties): code-split Recharts` | ✅ done | Recharts 362 KB chunk **initial → async** (vitest budget green) |
| `perf(cdn): Cloudflare config` | ✅ done | none → documented config + verify script |
| `perf(ci): perf-budget workflow` | ✅ done | none → report-only LHCI + bundle/route gates |

### Deferred (agreed: out of scope this pass — prod already fast; cost-bounded)

| Item | Why deferred | Next step |
|------|--------------|-----------|
| R5 AVIF | needs a rebuild; ~20–30% on already-small images | add `images.formats=['image/avif','image/webp']` to `next.config.ts` |
| R8 cache headers | needs a rebuild | add `headers()` for `/_next/static/*` immutable; keep authed HTML `private` |
| R4 static/ISR for public pages | large refactor; not needed for a working demo | isolate `cookies()`/auth into per-user islands so public pages prerender |
| R7 DB/API (N+1, Redis, indexes) | only exercised with `search_live_data=on` (hits prod Supabase) | benchmark + fix against a non-prod Supabase; see §7 |

### Definition of Done (this engagement)

- [x] Demo-blocking P0 (detail 500) fixed and guarded by a test.
- [x] Biggest frontend bundle weight (Recharts) removed from the key route's first load.
- [x] Evidence-based baseline documented; debunked hypotheses recorded.
- [x] CDN plan + report-only CI perf gate committed.
- [x] Each change isolated in its own commit with a rollback note; pre-existing WIP untouched.
