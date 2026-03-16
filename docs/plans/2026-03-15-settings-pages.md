# Settings Pages Implementation Plan

**Date:** 2026-03-15
**Mode:** HOLD SCOPE
**Reviewer:** Claude (plan-ceo-review)
**Screens:** Privacy & Data, Notification Settings, Profile Details, Security & 2FA

---

## Decisions Made

| # | Decision | Choice |
|---|----------|--------|
| 1 | Profile Details route | `/settings/account` (enable Account tab in layout) |
| 2 | Prefs storage | JSONB columns on `profiles` table |
| 3 | 2FA backup codes | Generate + hash + store in `user_backup_codes` table |
| 4 | Avatar storage | Public `avatars/` bucket, `{user_id}/avatar.{ext}` path |
| 5 | Rate limiting | Build now on `/api/settings/mfa/backup-codes` (3/24h via Upstash) |
| 6 | `/profile/settings` | Redirect → `/settings/notifications` |
| 7 | Unsaved changes warning | Add to TODOS.md (P3) |

---

## Files to Create / Modify

### STEP 1 — Migration (run first)

**CREATE** `supabase/migrations/20260315000000_user_settings_columns.sql`

```sql
-- Add privacy and notification preference JSONB columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
    "visibility": "public",
    "search_indexing": true,
    "anonymous_analytics": true,
    "third_party_marketing": false,
    "active_status": true,
    "last_viewed_visible": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email_messages": true,
    "email_listings": true,
    "email_viewings": true,
    "email_marketing": false,
    "push_messages": true,
    "push_listings": true,
    "sms_alerts": false
  }'::jsonb;

-- Backup codes table for TOTP recovery
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backup codes"
  ON user_backup_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot directly insert/delete via client — only server-side API routes
-- (No INSERT/DELETE RLS policies — use service role in API routes)

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_id
  ON user_backup_codes(user_id);

-- Supabase Storage: create avatars bucket
-- Run this via Supabase dashboard OR use the JS client in a seed script:
-- supabase.storage.createBucket('avatars', { public: true, fileSizeLimit: 819200 })
--
-- Then set Storage RLS policies:
-- Allow users to upload to their own folder:
--   CREATE POLICY "Users upload own avatar"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--       bucket_id = 'avatars'
--       AND auth.uid()::text = (storage.foldername(name))[1]
--     );
-- Allow users to update/delete their own avatar:
--   CREATE POLICY "Users update own avatar"
--     ON storage.objects FOR UPDATE
--     USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--   CREATE POLICY "Users delete own avatar"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

### STEP 2 — API Routes

**CREATE** `src/app/api/settings/profile/route.ts`
- `GET`: fetch `profiles` row for auth user → return `{first_name, last_name, phone, postcode, bio, avatar_url}`
- `PATCH`: validate fields (name required, bio ≤ 300 chars, phone UK format, postcode UK format), update `profiles`
- Avatar upload: separate `POST /api/settings/profile/avatar` — validate MIME by magic bytes (not Content-Type), validate size ≤ 800KB, delete old avatar from Storage, upload new file as `{user_id}/avatar.{ext}`, update `profiles.avatar_url`

**CREATE** `src/app/api/settings/privacy/route.ts`
- `GET`: fetch `profiles.privacy_settings` for auth user
- `PUT`: validate body is subset of known keys (whitelist — never spread req.body directly), update `profiles.privacy_settings`
- Log: `{user_id, old_visibility, new_visibility}` for compliance

**CREATE** `src/app/api/settings/notifications/route.ts`
- `GET`: fetch `profiles.notification_preferences` for auth user
- `PUT`: validate body keys against whitelist, update `profiles.notification_preferences`

**CREATE** `src/app/api/settings/mfa/enroll/route.ts`
- `POST`: call `supabase.auth.mfa.enroll({ factorType: 'totp' })`
- Returns: `{id: factor_id, totp: {qr_code, secret, uri}}`
- If factor already exists: call `listFactors()` first — if `verified` factor exists, return 409. If `unverified` factor exists, unenroll it first, then re-enroll.

**CREATE** `src/app/api/settings/mfa/verify/route.ts`
- `POST`: body `{factor_id, code}`
- Call `supabase.auth.mfa.challengeAndVerify({ factorId, code })`
- On success: generate 8 backup codes, hash with `bcrypt.hash(code, 12)`, delete existing backup codes for user, insert new ones, return plaintext codes (shown once)
- Rate limit: 5 attempts per minute per user (Upstash)

**CREATE** `src/app/api/settings/mfa/unenroll/route.ts`
- `DELETE`: body `{factor_id}`
- Call `supabase.auth.mfa.unenroll({ factorId })`
- Delete all `user_backup_codes` for user
- Log `{user_id, event: 'unenrolled'}`

**CREATE** `src/app/api/settings/mfa/backup-codes/route.ts`
- `POST`: regenerate backup codes (user must confirm with password or TOTP code first)
- Rate limit: 3 per 24h per user (Upstash Redis, `fixedWindow(3, '24h')`)
- Delete existing backup codes, generate 8 new ones, return plaintext (shown once)

---

### STEP 3 — New Pages

**CREATE** `src/app/(protected)/settings/account/page.tsx`

Profile Details page matching Stitch design. Server Component fetches profile data. Renders:

1. **Profile Photo section**: `<AvatarUploader>` component
   - Displays current avatar or initials fallback (`{first_name[0]}{last_name[0]}`)
   - Upload New button → file input (accept: image/*) → client-side size/type check → `POST /api/settings/profile/avatar`
   - Remove button → DELETE + set `avatar_url = null`
   - Hover overlay with edit icon (matching Stitch)

2. **Identity & Contact section**: form with
   - First Name + Last Name (required, text only)
   - Email (readonly) + "Change email" button → Supabase `updateUser({email})` → "Check your inbox" toast
   - Phone (+44 prefix, UK format)
   - Location/Postcode (UK postcode validation regex)
   - On submit: `PATCH /api/settings/profile`

3. **Short Bio section**: textarea with live character counter (142/300 style)

4. **Save bar**: Cancel (reset form to server state) + Save Changes button

5. **Danger Zone**: "Deactivate Account" link → confirm dialog → `POST /api/gdpr/delete` (existing)

**CREATE** `src/app/(protected)/settings/notifications/page.tsx`

Notification preferences page matching Stitch Notification Settings design. Renders per-channel toggles:

Categories (adapt from Stitch):
- Messages (email / push)
- New Listings (email / push)
- Viewings (email / push)
- Marketing (email only)
- SMS Alerts (toggle)

Data source: `GET /api/settings/notifications` → optimistic toggle → `PUT /api/settings/notifications`
Show save confirmation toast.

---

### STEP 4 — Upgrade Existing Pages

**MODIFY** `src/app/(protected)/settings/privacy/page.tsx`

Replace current minimal implementation with Stitch Privacy & Data design:

1. **Profile Visibility section**: radio group (Public / Registered Users Only / Private)
   - Search Engine Indexing toggle
2. **Data Sharing section**:
   - Anonymous Analytics checkbox
   - Third-party Marketing checkbox
3. **Activity Visibility section**:
   - Active Status checkbox
   - Last Viewed Properties checkbox
4. **Data Rights section** (keep existing):
   - `<DataExportButton>` + `<ConsentForm>` (already built)
   - Download your data
   - Account deletion (existing dialog)

State: fetch `privacy_settings` on mount → optimistic updates → `PUT /api/settings/privacy`

**MODIFY** `src/app/(protected)/settings/security/page.tsx`

Replace "Coming Soon" 2FA stub with full implementation:

1. **Change Password section** (keep existing — already works)
   - Increase minimum to 12 chars (match Stitch placeholder)

2. **Two-Factor Authentication section** (REPLACE stub):
   - Show current status badge: Active (green) / Not set up
   - If DISABLED: "Set up Authenticator App" button → `POST /api/settings/mfa/enroll`
     - Display QR code (from `totp.qr_code`) + manual entry secret
     - 6-digit code input + Verify button → `POST /api/settings/mfa/verify`
   - If ENABLED: show "Authenticator App — Active" with toggle to disable
   - Backup codes section: "Download Backup Codes" → `POST /api/settings/mfa/backup-codes`
     - Show "⚠ Download before closing — codes won't be shown again" warning banner
     - Display 8 codes in 2-column grid (monospace font)

3. **Active Sessions section** (REPLACE placeholder):
   - Fetch via server component: `supabase.auth.admin.listUserSessions(user_id)` (service role)
   - Display: device icon (laptop/mobile/tablet), session name, IP, location, "Current Session" badge
   - "Sign Out" per session button → `supabase.auth.admin.signOut(session_id)`
   - "Sign Out All Devices" button (existing, keep)

---

### STEP 5 — Modify Layout & Redirects

**MODIFY** `src/app/(protected)/settings/layout.tsx`
- Remove `disabled: true` from Security, Notifications, Account tabs
- Add Account tab: `{ label: "Account", href: "/settings/account", icon: User }`
- Add Profile Details link (icon: `User`)
- Rename "Account" label → "Profile" to match Stitch sidebar text

**MODIFY** `src/app/(protected)/settings/page.tsx`
- Change redirect from `/settings/security` → `/settings/account` (Profile Details as default)

**MODIFY** `src/app/(protected)/profile/settings/page.tsx`
- Replace content with `redirect('/settings/notifications')`

---

## Architecture Diagram

```
/settings/layout.tsx
  ├── /account     → ProfileDetailsPage
  │     ├── Server: fetch profiles row
  │     ├── AvatarUploader (client)
  │     ├── ProfileForm (client)
  │     └── DangerZone (client)
  │
  ├── /security    → SecuritySettingsPage (upgraded)
  │     ├── PasswordChangeForm (existing)
  │     ├── TotpEnrollment (new)
  │     │     ├── MfaStatus (server fetch)
  │     │     ├── QrCodeDisplay (client)
  │     │     ├── BackupCodesReveal (client, one-time)
  │     │     └── ActiveSessionsList (server fetch)
  │
  ├── /notifications → NotificationPrefsPage (new)
  │     └── NotificationPrefsForm (client)
  │           └── Migrated from <NotificationPreferences>
  │
  └── /privacy     → PrivacySettingsPage (upgraded)
        ├── VisibilityRadioGroup (new)
        ├── DataSharingToggles (new)
        ├── ActivityToggles (new)
        └── DataRightsSection (existing: ConsentForm + DataExportButton)

API Routes:
  /api/settings/profile         GET + PATCH
  /api/settings/profile/avatar  POST (multipart)
  /api/settings/privacy         GET + PUT
  /api/settings/notifications   GET + PUT
  /api/settings/mfa/enroll      POST
  /api/settings/mfa/verify      POST (rate: 5/min)
  /api/settings/mfa/unenroll    DELETE
  /api/settings/mfa/backup-codes POST (rate: 3/24h)
```

---

## TOTP Enrollment State Machine

```
  ┌──────────┐    POST /enroll    ┌──────────────┐   POST /verify   ┌──────────┐
  │ DISABLED │ ─────────────────▶ │   PENDING    │ ───────────────▶ │ ENABLED  │
  └──────────┘                    │  (QR shown)  │                   └──────────┘
       ▲                          └──────────────┘                        │
       │                          │   page refresh                        │
       │   DELETE /unenroll       │   → listFactors() re-fetches          │
       └──────────────────────────┴───────────────────────────────────────┘

  Guard: disable Verify button while API in-flight
  Guard: show "Resume 2FA setup" if unverified factor found on mount
  Guard: delete backup codes when unenrolling
```

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Avatar MIME validation | Read magic bytes (first 16): JPEG=FFD8FF, PNG=89504E47 |
| Avatar size limit | Reject > 800KB in API route before Storage upload |
| Storage RLS | `auth.uid()::text = (storage.foldername(name))[1]` |
| Privacy PUT whitelist | Only update known keys: `visibility`, `search_indexing`, etc. |
| Backup code rate limit | Upstash: 3 per 24h per user_id |
| TOTP verify rate limit | Upstash: 5 per minute per user_id |
| Backup codes one-time | Only return plaintext on generation; store hashed; never return again |
| TOTP replay | Supabase handles 30s window + one-use nonce |

---

## TODOS.md Additions

```markdown
### P3 — Unsaved Changes Warning (Settings)
Add `useBeforeUnload` hook to Privacy and Notification settings pages.
Pattern: isDirty state flag set on first toggle, cleared on successful save.
Show browser confirm dialog on navigation/tab close when isDirty=true.
Effort: S. Depends on: nothing.
```

---

## Completion Checklist

After implementation, verify:
- [ ] `supabase/migrations/20260315000000_user_settings_columns.sql` applied
- [ ] `avatars` Storage bucket created (public, 800KB limit)
- [ ] Storage RLS policies set for avatars bucket
- [ ] `/settings/account` loads and saves profile
- [ ] Avatar upload works (test with PNG and invalid file)
- [ ] `/settings/security` TOTP flow: enroll → QR → verify → backup codes
- [ ] `/settings/notifications` loads and toggles persist
- [ ] `/settings/privacy` visibility + toggles persist
- [ ] All 4 settings tabs enabled in layout
- [ ] `/settings` redirects to `/settings/account`
- [ ] `/profile/settings` redirects to `/settings/notifications`
- [ ] `pnpm build` passes with no type errors
- [ ] `pnpm lint` passes
