# Coming Soon — Waitlist Splash & Referral Queue

## Overview

A standalone "coming soon" launch surface with a viral referral loop. Two public
routes:

- `/coming-soon` — the splash page. A cinematic hero, the value proposition, and
  an email capture form. Public and indexable.
- `/queue` — the per-user referral page shown after signup. Displays the user's
  queue position, their shareable referral link, and reward tiers. Per-user and
  **not** crawlable (disallowed in `robots.ts`).

The feature is **additive**: the existing homepage (`/`) is untouched. `/coming-soon`
lives on its own and can later be promoted to `/` (see "Promoting to `/`" below)
once launch is ready.

## Architecture

| Concern | Location |
|---------|----------|
| Routes | `src/app/(splash)/` route group (`coming-soon/page.tsx`, `queue/page.tsx`) |
| Components | `src/components/coming-soon/` |
| A/B copy | `src/components/coming-soon/variants.ts` |
| Service | `src/services/waitlist/waitlist-service.ts` |
| Config / constants | `src/lib/coming-soon/config.ts` |
| Experiment resolver | `src/lib/experiments.ts` (`resolveComingSoonHeadline`) |
| API — signup | `POST /api/waitlist` |
| API — lookup | `GET /api/waitlist/[code]` |
| Welcome email | `src/emails/waitlist-welcome.tsx` |
| Hero media | `public/videos/coming-soon-hero.mp4`, `public/images/coming-soon/hero-poster.jpg` |

The `(splash)` route group keeps the splash routes isolated from the main app
layout/chrome so they can render as a standalone full-bleed experience.

## Database

Table `waitlist_signups`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `email` | citext | unique — case-insensitive |
| `referral_code` | text | unique — the code embedded in the user's share link |
| `referred_by` | text | soft reference to another row's `referral_code` (nullable) |
| `variant` | text | the A/B headline variant active at signup |
| `created_at` | timestamptz | defaults to `now()`; used for queue ordering |

`referred_by` is a **soft** reference (no FK constraint) so a signup is never
blocked by a stale or malformed inbound code; the referral is still resolvable
by joining on `referral_code`.

**RLS:** enabled on the table. There are **no** anon/auth policies — all access
goes through the **service role** from server-side code (the API routes and the
service layer). The public never reads or writes the table directly.

Migration: `supabase/migrations/*_waitlist_signups.sql`. Create it with
`supabase migration new waitlist_signups` (full 14-digit UTC prefix) per the
repo migration rules.

## Referral / Queue Math

Constants live in `src/lib/coming-soon/config.ts`:

- `REFERRAL_BOOST = 100` — positions moved up per successful referral.
- Reward tiers at `3`, `10`, and `25` referrals.
- `WAITLIST_BASELINE` — see "Configurable baseline" below.

Given a signup row:

```
rawPosition   = count of rows created at or before yours (1-based)
position      = max(1, rawPosition + WAITLIST_BASELINE - referralCount * REFERRAL_BOOST)
total         = realCount + WAITLIST_BASELINE
```

- `rawPosition` is the true ordinal of the row by `created_at` (the first
  signup is `1`).
- Each successful referral moves the user up `REFERRAL_BOOST` places; `max(1, …)`
  clamps so a heavy referrer never shows a position below `1`.
- `total` is the real number of signups plus the baseline head-start, so the
  displayed "X of Y" stays internally consistent.

## Configurable Baseline

`WAITLIST_BASELINE` is read from the env var `NEXT_PUBLIC_WAITLIST_BASELINE`
(default `0` when unset). It is a **queue-position head-start**, not a fabricated
user count: it offsets where new joiners *appear* in line and the displayed
`total`, but it never invents fake signup rows in the database. The real row
count is always the source of truth for analytics.

Set it in Vercel (Project → Settings → Environment Variables) or in `.env.local`
for local runs:

```
NEXT_PUBLIC_WAITLIST_BASELINE=500
```

Because it is `NEXT_PUBLIC_`, it is bundled into the client — that is intended,
since the queue page renders position client-side.

## Social Proof

`SOCIAL_PROOF_MIN_DISPLAY = 50` (in `config.ts`). Below this signup count the UI
shows generic copy (e.g. "Be one of the first to join"); at or above it the UI
shows the numeric count. This avoids the awkward "3 people have joined" early
phase. The only hard-numeric marketing claim reused is the site's existing,
real **"25,000+ verified listings"** — no other counts are fabricated.

## A/B Test

PostHog feature flag: **`coming_soon_headline`**, a 3-way split.

| Variant | Theme | Role |
|---------|-------|------|
| A | Disruption | challenger |
| B | Empowerment | **control** |
| C | Exclusivity | challenger |

Wiring:

- Copy per variant: `src/components/coming-soon/variants.ts`.
- Resolver: `resolveComingSoonHeadline(client)` in `src/lib/experiments.ts` —
  returns the control (`B`) when PostHog is unavailable or returns an unknown
  value.
- Exposure: posted to `POST /api/experiments/exposure` with
  `{ flag: "coming_soon_headline", variant }`. The flag is allowlisted in that
  route's `KNOWN_FLAGS`.
- Conversion: on successful signup, capture the `waitlist_signup` event with
  `{ variant }` (the variant is also persisted on the row).

### How to read results in PostHog

1. Create the `coming_soon_headline` flag as a multivariate flag with a 3-way
   rollout (A / B / C), control = `B`.
2. Build a funnel or trend on the `waitlist_signup` event, broken down by
   `$feature_flag_response` (i.e. the variant). The page emits an exposure
   (`$feature_flag_called`) on view and the conversion event on signup, so the
   conversion rate per variant is signup ÷ exposure.
3. Compare conversion across A/B/C; `B` is the baseline to beat.

## Hero Media

- Video: `public/videos/coming-soon-hero.mp4`.
- Poster / fallback still: `public/images/coming-soon/hero-poster.jpg`.

Under `prefers-reduced-motion: reduce` the component does not autoplay the video
and renders the poster image instead.

## Deployment / DB Apply

This repo pushes DB changes **manually**. The `waitlist_signups` migration must
be applied to prod via the documented manual flow in
`supabase/migrations/README.md` (it is not auto-applied on deploy).

Required / optional env vars:

| Var | Scope | Required | Purpose |
|-----|-------|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | server | yes (already set) | service-role access to `waitlist_signups` |
| `RESEND_API_KEY` | server | optional | welcome email; signup is best-effort and never fails if absent |
| `NEXT_PUBLIC_WAITLIST_BASELINE` | client | optional | queue head-start (default `0`) |

The welcome email is best-effort: if `RESEND_API_KEY` is unset or the send
fails, signup still succeeds.

## Promoting to `/` later

When ready to make the splash the front door, either:

- Swap the home route to render the splash (move/import the splash page into
  `src/app/(main)/page.tsx`, or have it render the same component), or
- Add a redirect from `/` to `/coming-soon` (Next.js `redirects()` in
  `next.config` or a middleware rule).

Either way `/queue` stays as-is, and the existing homepage component can be
restored in one step when the real product launches.
