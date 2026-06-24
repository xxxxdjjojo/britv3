# Performance baseline — reproducible re-run

Run this identically before and after every perf change so numbers are comparable.
**Never measure `next dev`** — it is not representative. Always measure a production build.

## 1. Build + serve (production)

```bash
cd britv3
pnpm build                 # webpack; exit 0 expected (warnings ok)
PORT=3000 pnpm start       # production server
```

## 2. Quick server-timing sanity (curl)

```bash
for r in "/" "/properties/modern-2-bed-flat-clifton-bristol-sale" "/search?type=buy"; do
  curl -s -o /dev/null -w "%{http_code}  %{time_total}s  $r\n" "http://localhost:3000$r"
done
```
Acceptance: every route returns **200** (a 500 on `/properties/[slug]` is the known
`DYNAMIC_SERVER_USAGE` bug — see PERFORMANCE_AUDIT.md R2).

## 3. Core Web Vitals (Chrome DevTools MCP)

Mobile profile: viewport `412x915x2.625,mobile,touch`, network `Slow 4G`, CPU `4x`.
For each of `/`, `/properties/<slug>`:
1. `new_page` → URL
2. `emulate` (viewport + Slow 4G + cpuThrottlingRate 4)
3. `performance_start_trace` (reload=true, autoStop=true)
4. Record **LCP, CLS, TTFB, render delay**.

Budgets: LCP < 2500 ms, CLS < 0.1, TBT < 200 ms.

## 4. Image payload (on the wire)

```bash
curl -s -H "Accept: image/avif,image/webp,image/*" -o /dev/null \
  -w "ctype=%{content_type} bytes=%{size_download}\n" \
  "http://localhost:3000/_next/image?url=%2Fimages%2Fhero%2Fhero-bg.jpg&w=1200&q=75"
```

## 5. JS bundle (recharts in detail route?)

```bash
grep -rl recharts .next/static/chunks | xargs ls -la | sort -k5 -n | tail
# Confirm whether the recharts chunk is referenced by:
#   .next/server/app/(main)/properties/[slug]/page_client-reference-manifest.js
```

## 6. Live-data DB path (optional, for R7)

Set `NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA=true`, rebuild, repeat §2–§3 for `/search` and a
real listing slug. Expect higher TTFB (network to Supabase eu-west-1).

## Baseline snapshot (2026-06-14, prod, mobile/Slow4G/4xCPU)

| Route | TTFB | LCP | CLS |
|-------|------|-----|-----|
| `/` | 32 ms | 902 ms | 0.00 |
| `/properties/[slug]` | 30 ms | 718 ms (browser) / 500 on direct GET | 0.00 |

Dev (`next dev`): homepage 630 ms, detail **8.59 s** — for contrast only.
