# Account Settings CEO Plan Review — EXPANSION Mode

**Date:** 2026-03-17
**Mode:** SCOPE EXPANSION
**Scope:** Pages 19.1–19.12 (Account Settings, Shared Across User Types)
**Stitch Screens:** Profile Details, Security & 2FA, Notification Settings, Privacy & Data

---

## Decisions Log

| # | Decision | Choice |
|---|----------|--------|
| 1 | Review mode | SCOPE EXPANSION — FAANG-level implementation |
| 2 | Connected Accounts location | Inside `/settings/security` (extract sub-components from 787 LOC page) |
| 3 | Language/Region + Accessibility | Combined `/settings/preferences` page with two sections |
| 4 | Delete Account duplication | Keep only in `/settings/privacy`, remove DangerZone from `/settings/account` |
| 5 | Backup code hashing | Keep SHA-256 (add CryptoError try/catch) |
| 6 | GDPR export rate limiting | In scope — Upstash 1/hour |
| 7 | Notification schema migration | Migration-on-read (merge old 7-key with new ~20-key defaults) |
| 8 | Notification race condition | Fix to single-key PATCH (match privacy page pattern) |

---

## Architecture

```
/settings/layout.tsx (client)
  ├── SecurityScoreBadge ← NEW (sidebar, computed client-side)
  ├── PrivacyShieldBadge ← NEW (sidebar, contextual trust card)
  │
  ├── /account     → AccountSettingsPage (SC)
  │     ├── AvatarUploader (existing)
  │     ├── ProfileForm (existing)
  │     └── [DangerZone REMOVED — delete only in /privacy]
  │
  ├── /security    → SecuritySettingsPage (CC, refactored into sub-components)
  │     ├── PasswordChangeCard (extracted)
  │     ├── TotpEnrollmentCard (extracted)
  │     ├── ConnectedAccountsCard ← NEW
  │     ├── ActiveSessionsList (extracted)
  │     └── LoginHistoryTable ← NEW
  │
  ├── /notifications → NotificationPrefsPage (CC, matrix upgrade)
  │     ├── NotificationMatrix (5 categories × 4 channels) ← UPGRADED
  │     └── MarketingUnsubscribe ← NEW
  │
  ├── /privacy     → PrivacySettingsPage (CC, layout upgrade)
  │     ├── QuickPrivacyMode ← NEW (Public/Members/Ghost toggle)
  │     ├── VisibilityRadioGroup (existing, 2-col layout)
  │     ├── DataSharingToggles (existing, 2-col layout)
  │     ├── ActivityToggles (existing, 2-col layout)
  │     ├── ConsentForm (existing)
  │     ├── DataExportButton (existing + rate limit)
  │     └── DeleteAccountSection (canonical location)
  │
  └── /preferences → PreferencesPage ← NEW
        ├── LanguageRegionSection (locale selector + preview)
        └── AccessibilitySection (font size, motion, contrast, dark mode live preview)

API Routes (new/modified):
  /api/settings/connected         GET (list identities) + DELETE (unlink)
  /api/settings/login-history     GET (paginated audit log entries)
  /api/settings/prefs             GET + PUT (language + accessibility JSONB)
  /api/settings/notifications     PATCH (single-key update — race fix)
  /api/gdpr/export                GET (add Upstash rate limit 1/hour)

Layout tabs: Privacy & Data | Security | Notifications | Profile | Preferences
```

---

## TOTP Enrollment State Machine (existing, unchanged)

```
  ┌──────────┐    POST /enroll    ┌──────────────┐   POST /verify   ┌──────────┐
  │ DISABLED │ ─────────────────▶ │   PENDING    │ ───────────────▶ │ ENABLED  │
  └──────────┘                    │  (QR shown)  │                   └──────────┘
       ▲                          └──────────────┘                        │
       │   DELETE /unenroll                                               │
       └──────────────────────────────────────────────────────────────────┘
```

---

## Connected Accounts — Link/Unlink Flow

```
  GET /api/settings/connected
       │
       ▼
  supabase.auth.getUserIdentities()
       │
       ▼
  ┌─────────────────────┐
  │ List: Google (linked)│
  │       Apple (linked) │
  │       Facebook (not) │
  └─────────┬───────────┘
            │ User clicks "Disconnect Google"
            ▼
  ┌───────────────────────┐
  │ GUARD: Is this the    │──── YES + no password ──▶ BLOCK
  │ last provider?        │                           "Set a password first"
  │ Does user have        │
  │ password set?         │
  └───────────┬───────────┘
              │ NO (safe to unlink)
              ▼
  DELETE /api/settings/connected?provider=google
       │
       ▼
  supabase.auth.unlinkIdentity(identityId)
       │
       ▼
  Refresh list, show success toast
```

---

## Notification Matrix — Migration-on-Read

```
  GET /api/settings/notifications
       │
       ▼
  Read profiles.notification_preferences (JSONB)
       │
       ▼
  ┌─ Has new-shape keys? ──▶ Return as-is
  │
  └─ Has old-shape keys? ──▶ Merge with NEW_DEFAULTS
       │                        │
       ▼                        ▼
  Map old keys to new:        Fill missing keys with defaults:
  email_messages → messages_email    property_alerts_sms: false
  email_listings → property_alerts_email    offers_inapp: true
  push_messages → messages_push      market_reports_*: false
  ...                                ...
       │
       ▼
  Return merged object (new shape)

  PATCH /api/settings/notifications
       │
       ▼
  Validate key is in whitelist
       │
       ▼
  UPDATE profiles SET notification_preferences =
    notification_preferences || '{"messages_email": true}'::jsonb
```

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Connected accounts IDOR | Use user's JWT (not service role) for `unlinkIdentity` |
| Last-provider guard | Check `auth.identities` count + password presence before unlink |
| Login history access | Service role query on `auth.audit_log_entries`, scoped to user_id |
| Notification key whitelist | Only accept known keys in PATCH body |
| Language/a11y injection | Whitelist allowed locale values (`en-GB`, etc.) |
| GDPR export rate limit | Upstash: 1 per hour per user_id |
| Avatar MIME validation | Magic bytes (existing) |
| Backup code crypto | SHA-256 + CryptoError try/catch |

---

## Error & Rescue Registry

```
METHOD/CODEPATH                  | WHAT CAN GO WRONG                | EXCEPTION/ERROR
---------------------------------|----------------------------------|---------------------------
GET /api/settings/sessions       | Supabase auth.admin unavailable  | AuthAdminApiError
                                 | User not authenticated           | 401
                                 | Service role key missing         | ConfigError
POST /api/settings/mfa/enroll    | Factor already verified (409)    | MfaFactorExistsError
                                 | Supabase MFA API down            | AuthApiError
POST /api/settings/mfa/verify    | Invalid TOTP code                | AuthMfaVerifyError
                                 | Rate limited (5/min)             | 429
                                 | Backup code generation fails     | CryptoError ← FIX
DELETE /api/settings/mfa/unenroll| Factor not found                 | 404
POST /api/settings/mfa/backup    | Rate limited (3/24h)             | 429
PATCH /api/settings/profile      | Invalid phone/postcode/bio       | ValidationError
POST /api/settings/profile/avatar| File too large / invalid MIME    | 413 / 415
                                 | Storage upload fails             | StorageError
PUT /api/settings/privacy        | Unknown key in body              | ValidationError
PATCH /api/settings/notifications| Unknown key in body              | ValidationError
GET /api/settings/connected      | getUserIdentities() fails        | AuthApiError
DELETE /api/settings/connected   | Last provider lockout            | LastProviderError ← NEW
                                 | Provider not linked              | 404
GET /api/settings/login-history  | auth.audit_log not accessible    | PostgresError
                                 | Service role key missing         | ConfigError
PUT /api/settings/prefs          | Unknown key / injection attempt  | ValidationError
GET /api/gdpr/export             | Rate limited (1/hour)            | 429 ← NEW
```

---

## Failure Modes Registry

```
CODEPATH                 | FAILURE MODE          | RESCUED? | TEST? | USER SEES?      | LOGGED?
-------------------------|-----------------------|----------|-------|-----------------|--------
mfa/verify               | Invalid TOTP code     | Y        | Y     | "Verify failed" | Y
mfa/backup-codes         | CryptoError           | FIXING   | N     | 500 → toast     | ADDING
connected/disconnect     | Last provider lockout | ADDING   | N     | Block + explain | ADDING
gdpr/export              | Rate limit abuse      | ADDING   | N     | 429 message     | ADDING
notifications PATCH      | Race condition        | FIXING   | N     | Data loss       | N
login-history            | Empty audit log       | ADDING   | N     | Empty state     | N/A
preferences PUT          | Injection attempt     | ADDING   | N     | 400 validation  | ADDING
sessions GET             | Missing service key   | FIXING   | N     | 503 message     | ADDING
```

---

## Delight Features (in scope)

1. **Security Score Badge** — sidebar progress ring, 4 factors (~30 min)
2. **Quick Privacy Mode** — Public/Members/Ghost one-click switcher (~20 min)
3. **Dark Mode Live Preview** — instant theme preview in accessibility (~30 min)
4. **Privacy Shield Badge** — contextual trust card in sidebar (~15 min)

---

## Bug Fixes (in scope)

1. **Notification race condition** — change from full-object PUT to single-key PATCH
2. **Delete Account duplication** — remove DangerZone from /account, keep in /privacy
3. **CryptoError unhandled** — add try/catch in backup code generation
4. **GDPR export no rate limit** — add Upstash 1/hour

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

## TODOS.md Additions

1. **P3/S** — `useBeforeUnload` hook for unsaved settings changes
2. **P2/M** — Streaming GDPR data export with progress indicator
3. **P2/L** — Role-aware notification categories per user type
4. **P3/XL** — Notification digest scheduling (real-time/daily/weekly)
5. **P2/L** — Login anomaly detection ("Was this you?" alerts)
6. **P3/S** — Notification preview cards showing mock email/push/SMS

---

## NOT in Scope

| Item | Rationale |
|------|-----------|
| Billing/subscription settings | Different phase, requires Stripe |
| Team/organization settings | Estate agent team feature |
| API key management | Developer feature |
| SSO/SAML settings | Enterprise, far future |
| SMS-based 2FA | Supabase doesn't support natively |
| Passkey/WebAuthn | Supabase experimental only |

---

## What Already Exists

| Sub-problem | Existing Code | Reuse Plan |
|-------------|--------------|------------|
| Profile + avatar | AccountSettingsPage, AvatarUploader, ProfileForm | Upgrade — remove DangerZone |
| Password change | PasswordStrengthMeter, updatePassword() | Keep as-is |
| 2FA TOTP | Security page + 4 MFA API routes | Extract sub-components |
| Active sessions | /api/settings/sessions + session list | Keep, add Login History |
| Notification prefs | Notifications page + API route | Expand matrix, fix race |
| Privacy/GDPR | Privacy page + ConsentForm + DataExportButton | Layout upgrade + rate limit |
| OAuth sign-in | auth-service.ts signInWithOAuth() | Connected accounts reads auth.identities |

---

## Dream State Delta

```
After this plan ships:
  ✅ 12/12 settings pages complete
  ✅ FAANG-grade UX (Stitch-matched)
  ✅ Security score gamification
  ✅ Full notification matrix (4 channels × 5 categories)
  ✅ Connected accounts management
  ✅ Login history
  ✅ Language/region + accessibility
  ✅ GDPR compliance complete

Still needed for 12-month ideal:
  ❌ Billing/subscription
  ❌ Team settings
  ❌ Role-specific notifications
  ❌ Digest scheduling
  ❌ SSO/SAML
  ❌ Passkeys

Delta: ~60% of the way to full settings platform.
```

---

## Completion Checklist

- [ ] DB migration applied (language + accessibility JSONB columns)
- [ ] Security page refactored into sub-components
- [ ] Connected Accounts card in security page
- [ ] Login History table in security page (paginated)
- [ ] Notification matrix expanded to 5×4 grid
- [ ] Notification PATCH single-key fix
- [ ] Marketing unsubscribe section
- [ ] Privacy page 2-column layout upgrade
- [ ] Quick Privacy mode switcher
- [ ] Delete Account removed from /account
- [ ] /settings/preferences page (language + accessibility)
- [ ] Dark mode live preview in accessibility
- [ ] Security Score Badge in layout sidebar
- [ ] Privacy Shield Badge in layout sidebar
- [ ] GDPR export rate limiting
- [ ] CryptoError try/catch in backup codes
- [ ] pnpm build passes
- [ ] pnpm lint passes
