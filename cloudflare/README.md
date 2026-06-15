# Cloudflare in front of Vercel — Truedeed (britv3)

> Decided infra: **Vercel + Cloudflare**. No Nginx, no Hostinger. See PERFORMANCE_AUDIT.md §8.

## Why Vercel + Cloudflare (and not Nginx/Hostinger)

- Next.js 16 App Router (SSR + RSC streaming + ISR + per-route caching) runs **natively on
  Vercel's global edge**. A single Hostinger/VPS+Nginx origin is one region, no edge, and forces
  manual ISR/cache wiring — worse global CWV for more ops.
- **Nginx load-balancing is unjustified**: there is one origin and the origin is not the
  bottleneck (the measured bottlenecks were a render bug + JS weight, both fixed in-app).
- Cloudflare sits **in front** for DNS, WAF, bot mitigation, TLS, HTTP/2+3, and static-asset
  caching. Vercel still owns HTML/SSR/ISR caching.

## Cache policy (safe + specific)

| Path | Cloudflare cache | TTL | Why safe |
|------|------------------|-----|----------|
| `/_next/static/*` | Cache (Eligible) | 1 year, `immutable` | content-hashed filenames |
| `/images/*`, `/_next/image*` | Cache | 1 year | optimized, content-addressed |
| `/favicon.ico`, `/robots.txt`, fonts | Cache | 1 day–1 year | static |
| **Everything else (HTML/SSR/RSC)** | **Bypass** | — | may be per-user; Vercel owns it |
| Any request with `Cookie: sb-*` (Supabase auth) | **Bypass** | — | never cache authed HTML |

**Never** enable Cloudflare "Cache Everything" on HTML — it would serve one user's authed page to
another. Authed responses must stay `private`/uncached.

## Cloudflare dashboard settings

1. **DNS:** proxied (orange cloud) CNAME → Vercel target. Keep Vercel's own domain config.
2. **SSL/TLS:** Full (strict).
3. **Speed → Optimization:** Brotli **on**; HTTP/2 + HTTP/3 (QUIC) **on**; Early Hints optional.
4. **Caching → Cache Rules** (create in this order):
   - Rule 1 — *Bypass auth*: If `http.cookie contains "sb-"` → **Bypass cache**.
   - Rule 2 — *Static long-life*: If URI path matches `/_next/static/*` OR `/_next/image*` OR
     `/images/*` → **Eligible for cache**, Edge TTL **1 year**, Browser TTL respect origin.
   - Rule 3 — *Default*: everything else → **Bypass cache** (let Vercel decide).
5. **Tiered Cache:** on (Smart Tiered Caching).
6. **WAF:** managed ruleset on; rate-limit auth/form endpoints (`/api/*`, `/login`, `/register`).

> Static-asset caching is already correct at the origin once the `perf/cache-headers` work lands
> (long-lived `immutable` on `/_next/static/*`). Cloudflare then simply honors it.

## Verify after deploy

Run `cloudflare/verify-cache.sh https://<staging-domain>` and confirm:
- `/_next/static/...` → `cf-cache-status: HIT` (after warmup) + `cache-control: ...immutable`.
- an authed page (with an `sb-` cookie) → `cf-cache-status: BYPASS`/`DYNAMIC`.
