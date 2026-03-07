# Phase 7: Production Readiness - Research

**Researched:** 2026-03-07
**Domain:** PWA, Admin Panel, Monitoring, Security Verification, Launch Readiness
**Confidence:** HIGH

## Summary

Phase 7 combines three epics (9, 10, 11) into a single production-hardening phase. The work divides cleanly into: (1) PWA infrastructure -- manifest, service worker with Serwist, Web Push via VAPID/web-push, offline caching, deferred install prompt, mobile bottom nav, responsive/touch polish; (2) Admin panel -- a route group `(admin)/` with is_admin middleware guard, user management, post-moderation, provider verification queue, review moderation, static help/contact pages; (3) Launch readiness -- Sentry error tracking, PostHog analytics, structured logging, GitHub Actions migration CI, feature flags via env vars, RLS audit, Dependabot, OWASP ZAP scan, Artillery load test, UAT, cross-browser testing, backup verification, legal review, and launch/support runbooks.

The entire phase uses zero new infrastructure cost. All tools are free-tier or open source. The project already has Resend (email), Upstash Redis (rate limiting), and Supabase (auth, DB, storage) in the stack, so the admin panel and push subscriptions plug into existing services.

**Primary recommendation:** Execute in 3 waves -- (1) PWA infrastructure + admin database schema + monitoring integration, (2) admin panel UI + push notifications + security hardening, (3) load testing + UAT + launch prep. Keep plans focused: PWA and admin are feature work; monitoring/security/launch are operational checklists.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOB-01 | Web App Manifest with installable standalone mode | Next.js built-in `app/manifest.ts` + Serwist for SW |
| MOB-02 | Deferred install prompt after 2nd visit | `beforeinstallprompt` event + localStorage visit counter |
| MOB-03 | Push notifications via Web Push API + VAPID keys | `web-push` npm + Supabase `push_subscriptions` table |
| MOB-04 | Notification deep linking to relevant pages | SW `notificationclick` handler with URL payload |
| MOB-05 | Push notification preferences | Extend existing notification preferences with push channel |
| MOB-06 | Offline access to saved properties, recent views, appointments | Serwist caching strategies + IndexedDB for structured data |
| MOB-07 | Static page caching (stale-while-revalidate) | Serwist precache + runtime caching strategies |
| MOB-08 | Responsive verification across 320px-1280px | Tailwind responsive utilities audit + Chrome DevTools |
| MOB-09 | Touch optimization (44px targets, swipe, pull-to-refresh) | CSS touch-action, min-h/w-11 utilities, gesture libraries |
| MOB-10 | Role-specific bottom tab bar on mobile | Client component reading active role from auth context |
| MOB-11 | Core Web Vitals targets | Lighthouse audit, Next.js Image/font optimization |
| ADM-01 | Admin route group with sidebar layout, middleware protection | `(admin)/` route group + middleware `is_admin` check |
| ADM-02 | is_admin boolean on profiles | ALTER TABLE profiles ADD COLUMN is_admin |
| ADM-03 | Admin dashboard with 5 count cards | Server Components with COUNT queries |
| ADM-04 | User management (search, view, suspend/activate) | Supabase ILIKE search + `.range()` pagination |
| ADM-05 | Post-moderation of listings | Profanity word list + price anomaly + duplicate detection |
| ADM-06 | Provider verification queue with document review | Signed URLs for document viewing + status workflow |
| ADM-07 | Review moderation queue | Shared profanity filter + content_reports table |
| ADM-08 | Static help page with FAQ from MDX | MDX files + Shadcn Accordion component |
| ADM-09 | Contact form with rate limiting | Resend email + Upstash rate limiting + Zod validation |
| ADM-10 | External dashboard links | Static links in admin sidebar (Stripe, Sentry, PostHog, Supabase) |
| LCH-01 | Sentry Free for error tracking | `@sentry/nextjs` with source map upload |
| LCH-02 | PostHog Free for product analytics | `posthog-js` + `@posthog/next` provider |
| LCH-03 | Structured JSON logger | Simple `lib/logger.ts` utility outputting to console |
| LCH-04 | GitHub Action for Supabase migration | `.github/workflows/migrate.yml` with `supabase db push` |
| LCH-05 | Feature flags via env vars | `lib/features.ts` reading `NEXT_PUBLIC_ENABLE_*` vars |
| LCH-06 | Full RLS policy audit | SQL query to find unprotected tables + manual review |
| LCH-07 | Dependabot vulnerability scanning | Enable in GitHub repo settings |
| LCH-08 | OWASP ZAP automated scan | Docker-based ZAP scan against staging URL |
| LCH-09 | Artillery load test | YAML scenario: 100 VUs, 5 endpoints, <2s avg |
| LCH-10 | Manual UAT with seeded staging data | Seed script + test scenarios per role |
| LCH-11 | Cross-browser testing | Manual verification on Chrome/Firefox/Safari/Edge/iOS/Android |
| LCH-12 | Supabase PITR backup verification | Dashboard verification + test restore |
| LCH-13 | Final legal/compliance review | GDPR audit, disclaimers, terms review |
| LCH-14 | Launch runbook | `docs/launch-runbook.md` with deploy/rollback steps |
| LCH-15 | Internal support runbook | `docs/support-runbook.md` with common issue resolutions |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| serwist | ^9.5.6 | Service Worker runtime (caching strategies, precaching) | Modern Workbox replacement, active maintenance, Next.js support |
| @serwist/next | ^9.5.4 | Next.js integration for Serwist (SW generation, config) | Official Next.js adapter, handles App Router |
| @serwist/window | ^9.2.3 | Client-side SW registration and update management | Companion to serwist for SW lifecycle |
| web-push | latest | Server-side Web Push via VAPID (no third-party service) | Standard Node.js push library, $0 cost |
| @sentry/nextjs | latest | Error tracking (client + server + edge) | Official Sentry SDK for Next.js, free tier 5K errors/mo |
| posthog-js | latest | Client-side product analytics | Official PostHog JS SDK |
| @posthog/next | latest | Next.js App Router provider for PostHog | Server + client integration, auto pageview tracking |
| artillery | latest | Load testing (CLI tool, YAML scenarios) | Open source, runs locally, no cloud dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mdx-js/react | latest | MDX rendering for help page FAQ content | Help page only |
| @next/mdx | latest | Next.js MDX integration | If using .mdx files for help content |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @serwist/next | next-pwa | next-pwa requires --webpack flag on Next.js 16 (Turbopack default); Serwist works natively |
| web-push | Firebase Cloud Messaging | FCM adds Google dependency; web-push is zero-vendor |
| posthog-js | Google Analytics | PostHog is privacy-friendly, self-hostable, includes feature flags |
| artillery | k6 | k6 is excellent but Artillery YAML is simpler for quick MVP testing |
| MDX for help | Notion public pages | MDX keeps content in repo; Notion adds external dependency |

**Installation:**
```bash
cd britv3.0
pnpm add serwist @serwist/next @serwist/window web-push @sentry/nextjs posthog-js @posthog/next
pnpm add -D @types/web-push artillery
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (admin)/                # Admin route group
│   │   ├── layout.tsx          # Admin sidebar layout + is_admin guard
│   │   ├── admin/              # /admin dashboard
│   │   ├── admin/users/        # User management
│   │   ├── admin/moderation/   # Listing + review moderation
│   │   └── admin/verifications/ # Provider verification queue
│   ├── (main)/
│   │   ├── help/               # Public help page (FAQ)
│   │   └── contact/            # Public contact form
│   ├── manifest.ts             # PWA web app manifest
│   └── sw.ts                   # Service worker source (Serwist)
├── components/
│   ├── admin/                  # Admin-specific components
│   │   ├── AdminSidebar.tsx
│   │   ├── CountCard.tsx
│   │   ├── UserTable.tsx
│   │   ├── ModerationQueue.tsx
│   │   └── VerificationQueue.tsx
│   ├── pwa/                    # PWA components
│   │   ├── InstallPrompt.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── PushManager.tsx
│   └── mobile/
│       ├── BottomTabBar.tsx    # Role-specific bottom nav
│       └── PullToRefresh.tsx
├── lib/
│   ├── logger.ts               # Structured JSON logger
│   ├── features.ts             # Feature flags from env vars
│   ├── profanity.ts            # Shared profanity filter
│   ├── push.ts                 # Web Push server utilities
│   └── posthog.ts              # PostHog initialization
├── services/
│   ├── admin-service.ts        # Admin operations (counts, user mgmt)
│   └── moderation-service.ts   # Content moderation logic
├── content/
│   └── help/                   # MDX files for FAQ
│       ├── account.mdx
│       ├── search.mdx
│       └── marketplace.mdx
├── instrumentation.ts          # Sentry server instrumentation
├── instrumentation-client.ts   # PostHog client instrumentation
└── sentry.*.config.ts          # Sentry config files (3)
public/
├── sw.js                       # Compiled service worker output
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
└── badge.png                   # Push notification badge
```

### Pattern 1: Admin Route Group with Middleware Guard

**What:** Admin pages live in `(admin)/` route group with dedicated layout and middleware protection.
**When to use:** Admin access control without a separate app deployment.

The existing middleware in `src/middleware.ts` needs extension to check `is_admin` for `/admin/*` paths. The admin layout provides a distinct sidebar navigation.

```typescript
// In middleware.ts -- add admin route check
const isAdminRoute = pathname.startsWith("/admin");
if (isAdminRoute) {
  // Fetch profile to check is_admin flag
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

### Pattern 2: Service Worker with Serwist (Next.js 16)

**What:** Serwist generates and manages the service worker with Next.js App Router integration.
**When to use:** PWA offline caching, precaching, and runtime caching strategies.

```typescript
// next.config.ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  // existing next config
});
```

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Handle push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icons/icon-192.png",
        badge: "/badge.png",
        data: { url: data.url },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

serwist.addEventListeners();
```

### Pattern 3: PostHog with Next.js App Router

**What:** PostHog provider wrapping the app for automatic pageview tracking and custom event capture.
**When to use:** All analytics tracking.

```typescript
// lib/posthog.ts
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // manual capture for App Router SPA navigation
  });
}
```

### Pattern 4: Structured Logger

**What:** Simple JSON logger outputting to stdout/stderr for Vercel log capture.
**When to use:** All server-side logging in API routes and services.

```typescript
// lib/logger.ts
type LogLevel = "info" | "warn" | "error";

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
```

### Anti-Patterns to Avoid

- **Pre-moderation of all listings:** Growth-killing bottleneck. Use post-moderation with auto-flagging (profanity, price anomaly, duplicate).
- **Custom CMS for help content:** Use MDX files in the repo. Update via PR.
- **Custom ticket system for support:** Use contact form + email. Upgrade to Freshdesk Free when volume warrants it.
- **Paid monitoring tools at MVP:** Sentry Free + PostHog Free + Vercel built-in logs cover all needs at launch.
- **Serwist in development mode:** Disable service worker in dev to avoid stale cache issues during development.
- **Requesting push permission on first load:** Request contextually (after first saved property, first message received). Users deny blanket permission requests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker generation | Custom SW with caching logic | @serwist/next | Handles precaching, versioning, cache invalidation automatically |
| Push notification delivery | Custom push server | web-push npm | Handles VAPID signing, encryption, retry logic |
| Error tracking | Custom error boundary + logging | @sentry/nextjs | Source maps, stack traces, dedup, alerting, free tier |
| Product analytics | Custom event tracking | posthog-js | Funnels, retention, feature flags, free 1M events/mo |
| Load testing framework | Custom script with fetch loops | Artillery | YAML scenarios, reporting, percentile calculations |
| Security scanning | Manual vulnerability check | OWASP ZAP Docker | Automated OWASP Top 10 coverage |
| Dependency scanning | Manual npm audit | GitHub Dependabot | Auto PRs for vulnerable dependencies |
| Profanity detection | AI-based content filter | Simple word list JSON | 100-200 words sufficient at MVP; no API cost |

**Key insight:** This phase is about integrating proven tools, not building custom infrastructure. Every monitoring, testing, and security tool has a free tier that exceeds MVP needs.

## Common Pitfalls

### Pitfall 1: CSP Conflicts with Sentry/PostHog

**What goes wrong:** Content Security Policy blocks Sentry/PostHog scripts.
**Why it happens:** The existing middleware sets strict CSP headers. Third-party analytics scripts need explicit `connect-src` and `script-src` allowances.
**How to avoid:** Update the `buildCsp` function in `src/middleware.ts` to add `*.ingest.sentry.io` to `connect-src` and PostHog host to both `script-src` and `connect-src`. Sentry also needs `worker-src 'self' blob:` for source map processing.
**Warning signs:** Console errors about CSP violations, Sentry/PostHog events not appearing in dashboards.

### Pitfall 2: Service Worker Caching Stale Content

**What goes wrong:** Users see outdated content after deployments because the SW serves cached pages.
**Why it happens:** Service worker lifecycle means old SW stays active until all tabs are closed.
**How to avoid:** Use `skipWaiting: true` and `clientsClaim: true` in Serwist config. Add a version check that prompts users to refresh when a new SW is detected. Disable SW in development.
**Warning signs:** Users report seeing old UI after a deployment.

### Pitfall 3: Push Notification Permission Timing

**What goes wrong:** Users deny push permissions, permanently blocking notifications.
**Why it happens:** Permission requested too early (page load) before user sees value.
**How to avoid:** Request permission contextually -- after saving first property, receiving first message, or completing first booking. Never on page load.
**Warning signs:** Very low push opt-in rates (<10%).

### Pitfall 4: Serwist and Next.js 16 Turbopack

**What goes wrong:** Build fails because Serwist requires webpack configuration.
**Why it happens:** Next.js 16 uses Turbopack by default; Serwist SW compilation needs webpack.
**How to avoid:** The `@serwist/next` wrapper handles this automatically for production builds. For local development with PWA testing, use `next dev --webpack`. In production (`next build`), it works without flags. Set `disable: true` in dev to skip SW entirely.
**Warning signs:** Build errors mentioning webpack plugin not found.

### Pitfall 5: Admin RLS Policy Circular Dependency

**What goes wrong:** Admin RLS policies that check `is_admin` on profiles create circular queries when querying the profiles table itself.
**Why it happens:** Policy on profiles references profiles table.
**How to avoid:** Use `auth.jwt() ->> 'is_admin'` claim if available, or use service_role key for admin API routes (bypassing RLS) with explicit authorization in the API route handler.
**Warning signs:** Infinite recursion errors in Supabase logs.

### Pitfall 6: OWASP ZAP False Positives on Next.js

**What goes wrong:** ZAP flags Next.js internal files as vulnerabilities.
**Why it happens:** Next.js serves JavaScript files that contain error messages, which ZAP interprets as "Application Error Disclosure."
**How to avoid:** Configure ZAP to ignore LOW-threshold alerts on static assets. Focus on HIGH and CRITICAL findings only. Document known false positives.
**Warning signs:** Hundreds of LOW alerts that are all Next.js static file disclosures.

## Code Examples

### Web App Manifest (Next.js built-in)

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Britestate - UK Property Portal",
    short_name: "Britestate",
    description: "Find, compare, and transact on UK properties",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#005F73",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

### Push Subscription Database Table

```sql
-- Migration: push_subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,  -- { p256dh, auth }
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

### Content Reports Table

```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'review')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (LENGTH(reason) <= 500),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(reporter_id, entity_type, entity_id)
);

CREATE INDEX idx_content_reports_status ON content_reports (status, entity_type) WHERE status = 'open';
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
```

### Bottom Tab Bar (Role-Specific)

```typescript
// src/components/mobile/BottomTabBar.tsx
"use client";

import type { UserRole } from "@/types/auth";

const TAB_CONFIG: Record<UserRole, { label: string; href: string; icon: string }[]> = {
  homebuyer: [
    { label: "Search", href: "/search", icon: "Search" },
    { label: "Saved", href: "/dashboard/homebuyer", icon: "Heart" },
    { label: "Viewings", href: "/dashboard/homebuyer/viewings", icon: "Calendar" },
    { label: "Messages", href: "/inbox", icon: "MessageSquare" },
    { label: "Profile", href: "/profile", icon: "User" },
  ],
  // ... other roles
};
```

### Artillery Load Test Configuration

```yaml
# tests/load/staging.yml
config:
  target: "https://staging.britestate.com"
  phases:
    - duration: 30
      arrivalRate: 5
      name: "Warm up"
    - duration: 60
      arrivalRate: 100
      name: "Sustained load"
  ensure:
    maxErrorRate: 1
    max: 5000        # p99 < 5s
    median: 2000     # p50 < 2s

scenarios:
  - name: "Browse and search"
    flow:
      - get:
          url: "/"
      - get:
          url: "/search?location=london&type=sale"
      - get:
          url: "/api/properties?limit=20"
```

### GitHub Action for Migrations

```yaml
# .github/workflows/migrate.yml
name: Supabase Migrate
on:
  push:
    branches: [main]
    paths: [supabase/migrations/**]
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-pwa (webpack only) | @serwist/next (Turbopack compatible) | 2024-2025 | next-pwa requires --webpack flag on Next.js 16; Serwist works natively |
| Workbox direct | Serwist (Workbox fork) | 2024 | Serwist is actively maintained; Workbox-next integration stalled |
| Sentry wizard creates sentry.client.config.ts | Sentry uses instrumentation-client.ts | 2025 (Next.js 15.3+) | Cleaner integration with Next.js instrumentation hook |
| PostHog separate provider component | @posthog/next or instrumentation-client.ts | 2025 | Simpler setup, works with both client and server |
| LaunchDarkly / paid feature flags | PostHog free feature flags + env vars | 2025 | PostHog free tier includes feature flags with targeting |

**Deprecated/outdated:**
- `next-pwa`: Requires webpack; use @serwist/next instead for Next.js 16
- Manual Workbox configuration: Use Serwist for managed SW generation
- `sentry.client.config.ts` file: Newer versions use `instrumentation-client.ts` for Next.js 15.3+

## Open Questions

1. **MDX Integration Approach for Help Page**
   - What we know: Epic 10 specifies MDX files for FAQ content. Next.js supports MDX via @next/mdx.
   - What's unclear: Whether to use @next/mdx (adds build complexity) or simply store FAQ as TypeScript arrays of objects (simpler, no MDX dependency).
   - Recommendation: Use TypeScript arrays for FAQ data -- simpler, no new dependency, searchable. MDX is overkill for FAQ Q&A pairs.

2. **Serwist Turbopack Compatibility in Dev**
   - What we know: @serwist/next v9.5+ supports Turbopack for production builds.
   - What's unclear: Whether local dev testing of SW requires `--webpack` flag.
   - Recommendation: Disable SW in development (`disable: process.env.NODE_ENV === "development"`). Only test PWA on staging/preview deployments.

3. **Admin Middleware Performance**
   - What we know: Current middleware already hits Supabase auth on every request. Adding a profile query for is_admin adds latency.
   - What's unclear: Whether to use JWT custom claims for is_admin (faster, no DB query) or profile query (simpler, no auth config).
   - Recommendation: Start with profile query (simpler). If latency is an issue, migrate to JWT custom claim via Supabase auth hook.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (unit), Playwright (E2E -- not yet installed) |
| Config file | `britv3.0/vitest.config.ts` (exists) |
| Quick run command | `cd britv3.0 && pnpm test:run` |
| Full suite command | `cd britv3.0 && pnpm test:run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOB-01 | Manifest served with correct fields | unit | `pnpm test:run -- src/app/manifest.test.ts` | Wave 0 |
| MOB-03 | Push subscription CRUD | unit | `pnpm test:run -- src/lib/push.test.ts` | Wave 0 |
| MOB-10 | Bottom tab renders role-specific tabs | unit | `pnpm test:run -- src/components/mobile/BottomTabBar.test.tsx` | Wave 0 |
| ADM-02 | Admin middleware blocks non-admins | unit | `pnpm test:run -- src/middleware.test.ts` | Wave 0 |
| ADM-05 | Profanity filter flags bad words | unit | `pnpm test:run -- src/lib/profanity.test.ts` | Wave 0 |
| ADM-05 | Price anomaly detection | unit | `pnpm test:run -- src/services/moderation-service.test.ts` | Wave 0 |
| ADM-09 | Contact form validation | unit | `pnpm test:run -- src/app/api/contact/route.test.ts` | Wave 0 |
| LCH-03 | Structured logger outputs JSON | unit | `pnpm test:run -- src/lib/logger.test.ts` | Wave 0 |
| LCH-05 | Feature flags read env vars | unit | `pnpm test:run -- src/lib/features.test.ts` | Wave 0 |
| LCH-09 | Artillery load test passes | integration | `cd britv3.0 && npx artillery run tests/load/staging.yml` | Wave 0 |
| MOB-08 | Responsive across breakpoints | manual-only | Chrome DevTools device emulation | N/A |
| MOB-09 | Touch targets >= 44px | manual-only | Physical device testing | N/A |
| MOB-11 | Core Web Vitals targets | manual-only | Lighthouse mobile audit | N/A |
| LCH-06 | RLS audit complete | manual-only | SQL queries against staging DB | N/A |
| LCH-08 | OWASP ZAP scan | manual-only | `docker run zaproxy/zap-stable zap-baseline.py -t <URL>` | N/A |
| LCH-10 | UAT across all roles | manual-only | Human testers with staging accounts | N/A |
| LCH-11 | Cross-browser testing | manual-only | Manual browser testing | N/A |

### Sampling Rate
- **Per task commit:** `cd britv3.0 && pnpm test:run`
- **Per wave merge:** `cd britv3.0 && pnpm test:run && pnpm build`
- **Phase gate:** Full suite green + Lighthouse PWA audit pass + Artillery pass before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/manifest.test.ts` -- covers MOB-01
- [ ] `src/lib/push.test.ts` -- covers MOB-03
- [ ] `src/lib/profanity.test.ts` -- covers ADM-05
- [ ] `src/lib/logger.test.ts` -- covers LCH-03
- [ ] `src/lib/features.test.ts` -- covers LCH-05
- [ ] `src/services/moderation-service.test.ts` -- covers ADM-05 price/duplicate
- [ ] `tests/load/staging.yml` -- Artillery config for LCH-09
- [ ] PWA icon assets in `public/icons/` -- needed for manifest

## Sources

### Primary (HIGH confidence)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- official PWA setup with manifest, push, SW
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) -- @serwist/next configuration
- [@serwist/next npm](https://www.npmjs.com/package/@serwist/next) -- v9.5.4 current
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) -- official setup guide
- [PostHog Next.js Docs](https://posthog.com/docs/libraries/next-js) -- App Router integration
- [Artillery Docs](https://www.artillery.io/docs/get-started/first-test) -- load test configuration
- [OWASP ZAP Getting Started](https://www.zaproxy.org/getting-started/) -- automated scanning

### Secondary (MEDIUM confidence)
- [LogRocket: Next.js 16 PWA](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) -- Serwist + Next.js 16 Turbopack details
- [Aurora Scharff: PWA Icons Next.js 16](https://aurorascharff.no/posts/dynamically-generating-pwa-app-icons-nextjs-16-serwist/) -- Next.js 16 specific PWA patterns
- [Medium: Web Push Next.js](https://medium.com/@ameerezae/implementing-web-push-notifications-in-next-js-a-complete-guide-e21acd89492d) -- Complete push notification implementation guide

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm and official docs
- Architecture: HIGH -- patterns follow existing project conventions and epic specifications
- Pitfalls: HIGH -- CSP conflicts and SW caching are well-documented issues
- PWA/Serwist on Next.js 16: MEDIUM -- Turbopack compatibility is recent, some edge cases possible

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable ecosystem)
