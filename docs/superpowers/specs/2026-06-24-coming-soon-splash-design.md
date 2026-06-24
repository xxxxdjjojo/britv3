# Coming Soon Splash — Design Spec

**Date:** 2026-06-24
**Status:** Approved

## Context & Goal

TrueDeed needs a pre-launch capture surface to build a waitlist and drive
organic growth through referrals, without disturbing the live product. The goal
is a standalone, on-brand "coming soon" splash with a real viral loop and a real
A/B test on the headline, so we can both grow the list and learn which message
converts — while keeping the existing homepage fully intact.

## Locked Decisions

- **On-brand dark green, not navy.** The splash uses the public-side green
  system (deep green + lighter brand greens), consistent with the marketing
  surface; no blue, no rainbow accents.
- **Standalone routes.** `/coming-soon` (public splash) and `/queue` (per-user
  referral page) live in a `(splash)` route group. The homepage is untouched
  and the splash can be promoted to `/` later.
- **Full real viral loop.** Each signup gets a unique referral code and share
  link; successful referrals improve the referrer's queue position. No fake loop.
- **Real PostHog A/B.** Headline experiment `coming_soon_headline` with a true
  3-way split (A = Disruption, B = Empowerment [control], C = Exclusivity),
  exposure + conversion captured server- and client-side.
- **Generated cinematic hero with reduced-motion fallback.** An MP4 hero with a
  poster still; `prefers-reduced-motion` falls back to the poster, no autoplay.
- **Live count + configurable baseline, no fabricated numbers.** Displayed
  totals derive from the real `waitlist_signups` row count plus a configurable
  `NEXT_PUBLIC_WAITLIST_BASELINE` head-start. Social proof stays generic below
  `SOCIAL_PROOF_MIN_DISPLAY` (50). The only reused hard claim is the site's real
  "25,000+ verified listings."

## Architecture Summary

- Routes: `src/app/(splash)/coming-soon/page.tsx`, `src/app/(splash)/queue/page.tsx`.
- Components: `src/components/coming-soon/` (with A/B copy in `variants.ts`).
- Service: `src/services/waitlist/waitlist-service.ts`.
- API: `POST /api/waitlist` (signup), `GET /api/waitlist/[code]` (lookup).
- Email: `src/emails/waitlist-welcome.tsx` (Resend, best-effort).
- Config/constants: `src/lib/coming-soon/config.ts`
  (`REFERRAL_BOOST = 100`, reward tiers 3/10/25, `WAITLIST_BASELINE`,
  `SOCIAL_PROOF_MIN_DISPLAY = 50`).
- Experiment resolver: `resolveComingSoonHeadline` in `src/lib/experiments.ts`;
  exposure allowlisted in `/api/experiments/exposure`.
- DB: `waitlist_signups` table (email citext unique, referral_code unique,
  referred_by soft-ref, variant, created_at), RLS enabled, service-role-only;
  migration applied manually per `supabase/migrations/README.md`.
- SEO: `/coming-soon` added to `sitemap.ts` (indexable); `/queue` disallowed in
  `robots.ts` (per-user, noindex).

Queue math:

```
rawPosition = count of rows created at or before yours (1-based)
position    = max(1, rawPosition + WAITLIST_BASELINE - referralCount * REFERRAL_BOOST)
total       = realCount + WAITLIST_BASELINE
```

## Verification Approach

1. **TDD first.** Write failing render/link tests (RED) — the splash renders the
   resolved headline variant, the form posts to `/api/waitlist`, the queue page
   renders position and share link, and the route links resolve — then implement
   to green.
2. **Full gates.** `pnpm lint` (0 errors), `pnpm build` (exit 0), `pnpm test`,
   and `pnpm check:migrations` for the new migration.
3. **Playwright screenshots.** Capture `/coming-soon` and `/queue` at the
   standard breakpoints (320 / 768 / 1024 / 1440), verify the reduced-motion
   poster fallback, and confirm no layout overflow.
