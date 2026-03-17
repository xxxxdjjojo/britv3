# Account Settings Plan — Pages 19.1–19.12

**Date:** 2026-03-17
**CEO Review:** SCOPE EXPANSION
**Eng Review:** BIG CHANGE — 11 issues resolved
**Scope:** Complete all 12 settings pages at FAANG quality

---

## Decisions Log (CEO + Eng Review)

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | Review mode | SCOPE EXPANSION | CEO |
| 2 | Connected Accounts location | Inside `/settings/security` (extract sub-components) | CEO |
| 3 | Language/Region + Accessibility | Combined `/settings/preferences` page | CEO |
| 4 | Delete Account duplication | Keep only in `/settings/privacy` | CEO |
| 5 | Backup code hashing | Keep SHA-256 (Node `crypto` module) | CEO |
| 6 | GDPR export rate limiting | In scope — Upstash 1/hour | CEO |
| 7 | Notification schema migration | Migration-on-read (merge old→new) | CEO |
| 8 | Notification race fix | **Client-only fix** — server already handles single-key merge | Eng |
| 9 | CryptoError fix | **DROPPED** — phantom issue. Server uses Node crypto, not Web Crypto | Eng |
| 10 | mfa-service.ts | **DELETE entire file** — all 4 functions are dead code | Eng |
| 11 | Auth boilerplate | Extract `requireAuth()` helper for new routes | Eng |
| 12 | Security page refactor | Props-down from parent (sub-components are presentational) | Eng |
| 13 | Login history data source | `auth.audit_log_entries` with graceful fallback if inaccessible | Eng |
| 14 | Connected accounts SDK | getUserIdentities() + unlinkIdentity() — SDK v2.98 supports both | Eng |
| 15 | JSONB merge optimization | Defer — current fetch-then-merge is fine for settings frequency | Eng |
| 16 | Testing | Set up Vitest + write 3 critical unit tests | Eng |

---

## Architecture

```
/settings/layout.tsx (client)
  ├── SecurityScoreBadge ← NEW (sidebar, client-computed)
  ├── PrivacyShieldBadge ← NEW (sidebar, contextual)
  │
  ├── /account     → AccountSettingsPage (SC)
  │     ├── AvatarUploader (existing)
  │     └── ProfileForm (existing)
  │     [DangerZone REMOVED]
  │
  ├── /security    → SecuritySettingsPage (CC, parent orchestrator)
  │     ├── PasswordChangeCard (extracted, presentational)
  │     ├── TotpEnrollmentCard (extracted, presentational)
  │     ├── ConnectedAccountsCard ← NEW
  │     ├── ActiveSessionsList (extracted, presentational)
  │     └── LoginHistoryTable ← NEW (graceful fallback)
  │
  ├── /notifications → NotificationPrefsPage (CC, matrix upgrade)
  │     ├── NotificationMatrix (5 categories × 4 channels)
  │     └── MarketingUnsubscribe
  │
  ├── /privacy     → PrivacySettingsPage (CC, layout upgrade)
  │     ├── QuickPrivacyMode ← NEW (Public/Members/Ghost)
  │     ├── VisibilityRadioGroup (2-col layout)
  │     ├── DataSharingToggles (2-col layout)
  │     ├── ActivityToggles (2-col layout)
  │     ├── ConsentForm (existing)
  │     ├── DataExportButton (existing + rate limit)
  │     └── DeleteAccountSection (canonical)
  │
  └── /preferences → PreferencesPage ← NEW
        ├── LanguageRegionSection
        └── AccessibilitySection (with live dark mode preview)

API Routes:
  NEW:  /api/settings/connected        GET + DELETE
  NEW:  /api/settings/login-history    GET (paginated, fallback)
  NEW:  /api/settings/prefs            GET + PUT
  MOD:  /api/gdpr/export               GET (add rate limit)
  DEL:  src/services/auth/mfa-service.ts (dead code)
  NEW:  src/lib/api/require-auth.ts    (auth helper)

Layout tabs: Privacy & Data | Security | Notifications | Profile | Preferences
```

---

## Notification Matrix — Key Mapping (Eng-Specified)

### OLD_TO_NEW_MAP
```ts
const OLD_TO_NEW_MAP: Record<string, string> = {
  email_messages:   "messages_email",
  push_messages:    "messages_push",
  email_listings:   "property_alerts_email",
  push_listings:    "property_alerts_push",
  email_viewings:   "viewings_email",
  email_marketing:  "marketing_email",
  sms_alerts:       "messages_sms",  // best-effort mapping
};
```

### NEW_DEFAULTS (full 20-key shape)
```ts
const NEW_DEFAULTS: Record<string, boolean> = {
  // Property Alerts
  property_alerts_email: true,
  property_alerts_push: true,
  property_alerts_sms: false,
  property_alerts_inapp: true,
  // Viewings
  viewings_email: true,
  viewings_push: true,
  viewings_sms: true,
  viewings_inapp: true,
  // Offers & Counter-offers
  offers_email: true,
  offers_push: true,
  offers_sms: true,
  offers_inapp: true,
  // Direct Messages
  messages_email: true,
  messages_push: true,
  messages_sms: false,
  messages_inapp: true,
  // Market Reports
  market_reports_email: false,
  market_reports_push: false,
  market_reports_sms: false,
  market_reports_inapp: true,
};
```

### Migration-on-Read Algorithm
```ts
function migrateNotificationPrefs(raw: Record<string, unknown>): Record<string, boolean> {
  const result = { ...NEW_DEFAULTS };

  // If raw has new-shape keys, use them directly
  const hasNewKeys = Object.keys(raw).some(k => k in NEW_DEFAULTS);
  if (hasNewKeys) {
    for (const [key, val] of Object.entries(raw)) {
      if (key in NEW_DEFAULTS && typeof val === "boolean") {
        result[key] = val;
      }
    }
    return result;
  }

  // Otherwise, map old keys to new
  for (const [oldKey, newKey] of Object.entries(OLD_TO_NEW_MAP)) {
    if (oldKey in raw && typeof raw[oldKey] === "boolean") {
      result[newKey] = raw[oldKey] as boolean;
    }
  }

  // Preserve any unmapped keys (log warning)
  for (const key of Object.keys(raw)) {
    if (!(key in OLD_TO_NEW_MAP) && !(key in NEW_DEFAULTS)) {
      console.warn(`[notification-migration] Unmapped key: ${key}`);
    }
  }

  return result;
}
```

---

## Connected Accounts — Link/Unlink Flow

```
  GET /api/settings/connected
       │
       ▼
  supabase.auth.getUserIdentities()  ← SDK v2.98, fully typed
       │
       ├── Success → return identity list
       └── Error → return { identities: [], error: "unavailable" }

  DELETE /api/settings/connected?identity_id=<id>
       │
       ▼
  ┌─────────────────────────┐
  │ GUARD: count identities │
  │ + check user has        │
  │   password set          │
  └───────────┬─────────────┘
              │
  ┌───────────┴────────────────────────────────┐
  │ identities.length === 1 && !hasPassword    │──▶ 400 "Set a password first"
  └───────────┬────────────────────────────────┘
              │ Safe to unlink
              ▼
  supabase.auth.unlinkIdentity({ identityId })  ← Uses user JWT, not service role
       │
       ▼
  Return success, client refreshes list
```

---

## Last-Provider Guard Logic
```ts
// In DELETE /api/settings/connected handler
const { data: identities } = await supabase.auth.getUserIdentities();
const linkedProviders = identities?.identities ?? [];

if (linkedProviders.length <= 1) {
  // Check if user has a password set (email provider with confirmed email)
  const hasEmailProvider = linkedProviders.some(
    (i) => i.provider === "email"
  );
  if (!hasEmailProvider) {
    return NextResponse.json(
      { error: "Cannot disconnect your only login method. Set a password first." },
      { status: 400 }
    );
  }
}
```

---

## Client-Side Notification Fix

```
BEFORE (notifications/page.tsx:124-127):
  body: JSON.stringify(updated)      // sends full object → race condition

AFTER:
  body: JSON.stringify({ [key]: value })  // sends single key → server merges

REVERT FIX (notifications/page.tsx:134-135):
  BEFORE: setPrefs(previous)              // reverts entire snapshot
  AFTER:  setPrefs(prev => ({ ...prev, [key]: !value }))  // reverts single key
```

---

## Security Controls (unchanged from CEO review)

| Control | Implementation |
|---------|---------------|
| Connected accounts IDOR | Use user's JWT for `unlinkIdentity` |
| Last-provider guard | Check identities count + email provider |
| Login history access | Service role query, scoped to user_id, fallback if inaccessible |
| Notification key whitelist | Update ALLOWED_NOTIFICATION_KEYS to 20 new keys |
| Language/a11y injection | Whitelist allowed locale/font-size/dark-mode values |
| GDPR export rate limit | Upstash: 1 per hour per user_id |
| Avatar MIME validation | Magic bytes (existing) |

---

## DB Migration

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language_preferences JSONB DEFAULT '{
    "locale": "en-GB",
    "date_format": "DD/MM/YYYY",
    "currency": "GBP",
    "timezone": "Europe/London"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS accessibility_preferences JSONB DEFAULT '{
    "font_size": "medium",
    "reduced_motion": false,
    "high_contrast": false,
    "dark_mode": "system",
    "screen_reader_hints": true
  }'::jsonb;
```

---

## Delight Features (in scope)

1. **Security Score Badge** — sidebar progress ring, 4 factors (~30 min)
2. **Quick Privacy Mode** — Public/Members/Ghost one-click switcher (~20 min)
3. **Dark Mode Live Preview** — instant theme preview in accessibility (~30 min)
4. **Privacy Shield Badge** — contextual trust card in sidebar (~15 min)

---

## Bug Fixes (in scope — updated)

1. **Notification race condition** — client-only fix: send `{[key]: value}` instead of full object
2. **Delete Account duplication** — remove DangerZone from /account
3. **GDPR export no rate limit** — add Upstash 1/hour
4. ~~CryptoError~~ **DROPPED** — phantom issue
5. **Dead code cleanup** — delete entire `mfa-service.ts`

---

## Testing (Eng-added)

### Vitest Setup
- Install `vitest` + `@testing-library/react` + `happy-dom`
- Configure in `vitest.config.ts`

### Critical Unit Tests (must ship with this phase)
1. **`migrateNotificationPrefs.test.ts`** — old-shape input, new-shape input, empty/null input, partial input, unmapped keys
2. **`last-provider-guard.test.ts`** — 1 identity + no password → block, 1 identity + has password → allow, 2 identities → allow
3. **`notification-single-key.test.ts`** — send `{messages_email: false}`, verify only that key changes, all others preserved

---

## TODOS.md Additions (CEO + Eng)

### From CEO Review (6 items — already added)
1. P3/S — `useBeforeUnload` hook for unsaved settings changes
2. P2/M — Streaming GDPR data export with progress indicator
3. P2/L — Role-aware notification categories per user type
4. P3/XL — Notification digest scheduling
5. P2/L — Login anomaly detection
6. P3/S — Notification preview cards

### From Eng Review (2 items — adding now)
7. P3/S — Backport `requireAuth()` helper to existing 9 settings routes
8. P3/M — JSONB atomic merge via Postgres `||` operator function

---

## NOT in Scope (updated)

| Item | Rationale |
|------|-----------|
| Billing/subscription settings | Different phase, requires Stripe |
| Team/organization settings | Estate agent team feature |
| API key management | Developer feature |
| SSO/SAML settings | Enterprise, far future |
| SMS-based 2FA | Supabase doesn't support natively |
| Passkey/WebAuthn | Supabase experimental only |
| CryptoError fix | Phantom — server uses Node crypto |
| Notification API PATCH change | Server already handles partial PUT |
| JSONB `||` optimization | Defer — fetch-then-merge fine for settings frequency |
| requireAuth() backport | Use in new routes, backport later (TODO) |

---

## Completion Checklist

- [ ] Vitest installed and configured
- [ ] `requireAuth()` helper created (`lib/api/require-auth.ts`)
- [ ] DB migration applied (language + accessibility JSONB columns)
- [ ] `mfa-service.ts` deleted (dead code)
- [ ] Security page refactored (props-down sub-components)
- [ ] Connected Accounts card + API route
- [ ] Login History table + API route (with fallback)
- [ ] Last-provider guard with unit test
- [ ] Notification matrix expanded (5×4 grid)
- [ ] Notification key migration-on-read with unit test
- [ ] Notification client fix (single-key PUT) with regression test
- [ ] Marketing unsubscribe section
- [ ] Privacy page 2-column layout upgrade
- [ ] Quick Privacy mode switcher
- [ ] Delete Account removed from /account
- [ ] `/settings/preferences` page + API route
- [ ] Dark mode live preview in accessibility
- [ ] Security Score Badge in layout sidebar
- [ ] Privacy Shield Badge in layout sidebar
- [ ] GDPR export rate limiting
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
