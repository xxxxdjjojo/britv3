# Epic 9: Progressive Web App & Mobile Optimization

**Epic Number:** E09
**Epic Title:** Progressive Web App & Mobile Optimization
**Date Created:** May 13, 2025
**Last Updated:** March 7, 2026 (v3.0 rewrite — replaced native app approach with PWA)
**Target Release:** Phase 7 (after core platform is stable)

---

## 1. Description

This Epic delivers a production-grade Progressive Web App (PWA) experience for Britestate, ensuring all users across all roles can install the app to their home screen, receive push notifications, access critical data offline, and interact with a fully touch-optimized interface. This replaces the original v2.0 proposal of 4 separate React Native apps — a decision driven by cost analysis showing $5K-17K/year + 16-24 weeks dev for native vs. $0 + 1-2 weeks for PWA with 95% feature parity.

## 2. Goals

- Deliver installable home-screen experience on iOS, Android, and desktop
- Enable push notifications for all critical platform events via Web Push API
- Provide offline access to saved properties, recent views, and upcoming appointments
- Ensure all pages are responsive and touch-optimized across mobile, tablet, and desktop
- Achieve Core Web Vitals targets on mobile: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Zero additional infrastructure cost beyond existing Vercel + Supabase

## 3. Scope

### In Scope

**PWA Infrastructure:**
- Web App Manifest with app identity (name, icons, theme, display mode)
- Service Worker for caching, offline support, and background sync
- Web Push notification integration via VAPID keys
- Install-to-home-screen prompt (deferred prompt after 2nd visit)

**Responsive & Touch Optimization:**
- Responsive verification across all existing pages (mobile/tablet/desktop)
- Touch target audit (minimum 44px × 44px on all interactive elements)
- Swipe gestures on image galleries and carousels
- Pull-to-refresh on list views
- Mobile-optimized navigation (bottom tab bar on small screens)

**Offline Capabilities:**
- Cache saved property summaries for offline viewing
- Cache recently viewed property details (last 20)
- Cache upcoming viewing/appointment schedule
- Cache user profile and role information
- Clear offline indicator when operating without connectivity
- Sync strategy on reconnection (refresh stale data)

**Push Notifications:**
- Permission request flow (contextual, not on first load)
- Notification types: new messages, property matches, viewing confirmations, offer updates, payment confirmations, review received
- Deep linking from notification tap to relevant screen
- Notification preferences sync with existing in-app settings (from Phase 2)
- Badge count on app icon (supported browsers)

### Out of Scope

- Native iOS/Android apps (deferred to post-revenue, 50K+ MAU)
- Capacitor/native shell wrapper (deferred to post-launch if App Store presence needed)
- Background location tracking
- Offline data creation (e.g., creating listings or maintenance requests while offline)
- Bluetooth, NFC, or other hardware APIs
- App Store / Google Play distribution

## 4. User Stories & Acceptance Criteria

### PWA Installation Stories

**Story ID: E09-S01**

**User Story:** As a mobile user, I want to install Britestate to my home screen so I can access it like a native app.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- A Web App Manifest is served with correct `name`, `short_name`, `icons` (192px, 512px, maskable), `start_url`, `display: standalone`, `theme_color`, and `background_color`.
- On Android Chrome, the browser's native "Add to Home Screen" prompt appears after engagement criteria are met (2+ visits).
- On iOS Safari, a custom in-app banner explains how to use "Add to Home Screen" via the share menu (iOS does not support automatic install prompts).
- When launched from home screen, the app opens in standalone mode (no browser chrome).
- A splash screen with the Britestate logo displays during app load.
- The app icon matches the Britestate brand across all platforms.

---

**Story ID: E09-S02**

**User Story:** As a returning user, I want the app to prompt me to install after my second visit so I can get quick access without being nagged on first load.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- The install prompt is NOT shown on the first visit.
- After 2+ visits within 7 days, a dismissible in-app banner offers installation.
- The banner uses the `beforeinstallprompt` event (Chrome/Edge) or custom UI (Safari/Firefox).
- Dismissing the banner stores the preference and does not show again for 30 days.
- If the user has already installed, no prompt is shown.

---

### Push Notification Stories

**Story ID: E09-S03**

**User Story:** As a user, I want to receive push notifications for important updates (new messages, property matches, viewing reminders) even when the app is closed, so I stay informed.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- The app uses the Web Push API with VAPID keys for authentication.
- Push notification permission is requested contextually (e.g., after the user saves their first property or receives their first message), NOT on page load.
- Notifications are received when the app is in the foreground, background, or closed (on supported browsers).
- Each notification includes a title, body text, and the Britestate icon.
- Notification types implemented:
  - New message received
  - New property matching saved search
  - Viewing confirmation or change
  - Offer update (new offer, counter, accepted)
  - Payment confirmation
  - Review received (for providers)
  - Verification status change
- The Service Worker handles the `push` event and displays the notification.

---

**Story ID: E09-S04**

**User Story:** As a user, I want tapping a push notification to open the relevant page in the app, so I can act on it immediately.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Each push notification payload includes a `url` field for the target page.
- The Service Worker `notificationclick` handler opens the target URL.
- If the app is already open, it navigates to the target page (does not open a new tab).
- If the app is closed, it opens the app and navigates to the target page.
- Deep linking works for: message threads, property details, viewing schedule, offer details, payment receipts.

---

**Story ID: E09-S05**

**User Story:** As a user, I want to manage my push notification preferences in the app settings, so I only get notifications I care about.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- Notification preferences from the existing settings page (Phase 2) include push as a channel alongside email and in-app.
- Users can toggle push notifications per category (messages, property alerts, viewings, offers, payments, reviews).
- Disabling all push categories triggers the browser's notification revocation flow.
- Preferences sync with the backend and apply to push notification routing.

---

### Offline Capability Stories

**Story ID: E09-S06**

**User Story:** As a user with poor connectivity, I want to access my saved properties and upcoming viewings offline, so I can reference them when underground or in areas with no signal.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- The Service Worker caches the following on login and after relevant user actions:
  - Saved property summaries (title, price, image thumbnail, address, beds/baths) — up to 50 properties
  - Last 20 recently viewed property detail pages (full page shell + data)
  - Upcoming viewings/appointments (date, time, address, contact info)
  - User profile and current role
- Cached data is served when the network is unavailable.
- A visible offline indicator (banner or icon) appears when the app detects no connectivity.
- When connectivity returns, stale data is refreshed automatically.
- Cache storage is limited to ~50MB to respect device storage constraints.
- A "Last updated: [timestamp]" label appears on cached data.

---

**Story ID: E09-S07**

**User Story:** As a user, I want static pages (home, about, help) to load instantly even on slow connections, so the app always feels fast.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- The Service Worker implements a stale-while-revalidate caching strategy for static pages and assets.
- App shell (layout, navigation, global styles) is pre-cached on Service Worker install.
- Subsequent page loads serve cached shell immediately, then fetch fresh content.
- CSS, JS, and font assets are cached with long TTLs (immutable hashing via Next.js).
- Images use a cache-first strategy with a 7-day expiry.

---

### Responsive & Touch Optimization Stories

**Story ID: E09-S08**

**User Story:** As a mobile user, I want all pages to be fully usable on my phone screen, so I can complete any action without needing a desktop.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- All pages pass responsive testing at breakpoints: 320px, 375px, 414px (mobile), 768px (tablet), 1024px, 1280px (desktop).
- No horizontal scrolling on any page at any breakpoint.
- Text is readable without zooming (minimum 16px body text on mobile).
- Forms are usable on mobile (appropriate input types, no tiny tap targets).
- Tables are replaced with card layouts or horizontal scroll on mobile.
- Modals and dialogs are full-screen on mobile, centered on desktop.
- Navigation collapses to a mobile-friendly pattern (bottom tab bar or hamburger menu) below 768px.

---

**Story ID: E09-S09**

**User Story:** As a mobile user, I want touch interactions to feel natural and responsive, so the app doesn't feel like a desktop site crammed into a phone.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- All interactive elements (buttons, links, cards) have minimum 44px × 44px touch targets.
- Image galleries support swipe gestures (left/right to navigate).
- List views support pull-to-refresh gesture.
- Map interactions are touch-optimized (pinch-to-zoom, drag to pan) — already handled by MapLibre.
- No hover-only interactions; all hover states have tap equivalents.
- Touch feedback (visual press state) on all tappable elements.
- No 300ms tap delay (handled by modern browsers with `<meta name="viewport">`, verify it's present).

---

**Story ID: E09-S10**

**User Story:** As a mobile user, I want a bottom navigation bar on small screens so I can reach key sections with my thumb.

**Priority:** Should
**Status:** To Do

**Acceptance Criteria:**
- On screens below 768px, a persistent bottom tab bar replaces the desktop header navigation.
- Tab bar shows 4-5 key sections based on active role:
  - Homebuyer/Renter: Search, Saved, Viewings, Messages, Profile
  - Agent: Listings, Leads, Viewings, Messages, Profile
  - Provider: Jobs, Quotes, Calendar, Messages, Profile
  - Landlord: Properties, Maintenance, Tenants, Messages, Profile
- Active tab is visually highlighted.
- Tab bar includes unread badge on Messages tab.
- Desktop header navigation remains unchanged above 768px.

---

### Performance Stories

**Story ID: E09-S11**

**User Story:** As a mobile user on a 4G connection, I want the app to load quickly and feel snappy, so I don't abandon it for a competitor.

**Priority:** Must
**Status:** To Do

**Acceptance Criteria:**
- Core Web Vitals on mobile (measured via Lighthouse on simulated 4G):
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay) / INP (Interaction to Next Paint): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- Initial page load bundle size < 150KB (compressed).
- Images use responsive `srcset` with WebP format and appropriate sizes for mobile screens.
- Fonts are preloaded and use `font-display: swap`.
- No layout shifts from dynamically loaded content (skeleton screens for loading states).

---

## 5. Technical Implementation

### Service Worker Strategy

```
Caching Strategies:
├── App Shell (layout, nav, global CSS/JS) → Precache on install
├── Static pages (home, about, help) → Stale-while-revalidate
├── API responses (saved properties, viewings) → Network-first, cache fallback
├── Images → Cache-first, 7-day expiry, max 200 entries
├── Fonts → Cache-first, 1-year expiry
└── Search results → Network-only (always fresh)
```

**Library:** `@serwist/next` (modern Workbox for Next.js) — zero-config Service Worker generation with Next.js App Router support.

### Web Push Architecture

```
Push Flow:
1. User grants notification permission (contextual prompt)
2. Browser generates push subscription (endpoint + keys)
3. Subscription stored in Supabase: push_subscriptions table
4. Backend event triggers (new message, property match, etc.)
5. Server sends push via web-push library to subscription endpoint
6. Service Worker receives push event, displays notification
7. User taps notification → notificationclick → navigate to URL
```

**Server-side:** `web-push` npm package (free, uses VAPID keys — no third-party service needed).

**Database addition:**

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh, auth }
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

### Web App Manifest

```json
{
  "name": "Britestate - UK Property Portal",
  "short_name": "Britestate",
  "description": "Find, compare, and transact on UK properties",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#005F73",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Mobile Navigation Component

Bottom tab bar renders only on screens < 768px. Tabs are role-aware using the active role from auth context. Implemented as a client component that reads the current role and renders the appropriate tab configuration.

---

## 6. Dependencies

- **Phase 1 (Foundation):** Auth system for push subscription association with users
- **Phase 2 (Property Portal):** Search, listings, saved properties, messaging — all features that need offline caching and push notifications
- **Phase 3 (Dashboards):** Role-specific navigation tabs depend on dashboard routes existing
- **All phases:** Responsive design should be built into every component from Phase 1, not retrofitted in Phase 7. This epic is a verification and polish pass, not a rewrite.

## 7. Infrastructure Cost

| Item | Cost |
|------|------|
| @serwist/next (Service Worker) | $0 (open source) |
| web-push (server-side push) | $0 (open source, uses browser push services) |
| Web App Manifest | $0 (static JSON file) |
| Push delivery (browser services) | $0 (Google, Apple, Mozilla provide free) |
| Supabase table (push_subscriptions) | $0 (within existing plan) |
| Vercel deployment | $0 (existing plan) |
| **Total** | **$0/month** |

Compare to Epic 9 original (4 native apps): **$405-1,405/month + 16-24 weeks dev.**

## 8. Acceptance Criteria (Epic-Level)

1. App can be installed to home screen on iOS Safari, Android Chrome, and desktop browsers.
2. Push notifications are received for all critical events when app is closed, backgrounded, or in foreground.
3. Saved properties, recent views, and upcoming appointments are accessible offline.
4. All pages are fully responsive across mobile (320px+), tablet (768px+), and desktop (1024px+) with no horizontal scroll.
5. All touch targets meet 44px minimum. Image galleries support swipe. Lists support pull-to-refresh.
6. Core Web Vitals on mobile: LCP < 2.5s, FID < 100ms, CLS < 0.1.
7. Mobile navigation uses bottom tab bar with role-specific sections.
8. Zero additional monthly infrastructure cost.

## 9. QA & Testing Strategy

- **Responsive testing:** Chrome DevTools device emulation for all breakpoints. Manual verification on 1 physical iOS device + 1 physical Android device.
- **PWA testing:** Lighthouse PWA audit (must pass all criteria). Chrome DevTools Application panel for manifest and Service Worker verification.
- **Push testing:** Manual test on iOS Safari, Android Chrome, desktop Chrome/Firefox/Edge. Verify deep linking from notification tap.
- **Offline testing:** Chrome DevTools Network throttling (offline mode). Verify cached data displays correctly. Verify sync on reconnection.
- **Performance testing:** Lighthouse mobile simulation (Moto G Power on throttled 4G). Must meet Core Web Vitals targets.
- **Touch testing:** Manual testing on physical devices for gesture support, tap targets, and navigation usability.

## 10. Future Mobile Roadmap (Post-Revenue)

| Milestone | Trigger | Action |
|-----------|---------|--------|
| 25K MAU | Analytics show >50% mobile traffic | Add Capacitor wrapper for App Store listing (1-2 days) |
| 50K MAU | User requests for native features | Evaluate if PWA gaps justify native investment |
| 100K MAU + revenue | Business can support mobile team | Consider native app development (single app, role-switching) |

**Key principle:** Let user data drive the native decision. Don't build native because it feels professional. Build it when analytics prove PWA isn't enough.

---

*Epic rewritten: 2026-03-07*
*Replaces: epic9.txt (v2.0 native app approach)*
*Rationale: See epic9costanalysis.md for full cost analysis*
