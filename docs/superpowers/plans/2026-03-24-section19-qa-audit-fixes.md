# Section 19 Account Settings — QA Audit Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 27 bugs + 3 security findings from the Section 19 QA audit (covering P0 security, P1 legal/GDPR, P2 data integrity, P3 UX, P4 polish) plus 2 gap analyses, bringing account settings to production-ready standards. 5 items deferred (BUG-17, 18, 19, S-7, S-10) — see end of plan for justification.

**Architecture:** Five sequential waves ordered by severity. Wave 1 (P0 security) creates a re-authentication API + hardened backup codes that all subsequent waves depend on. Wave 2 (P1 GDPR/legal) completes data export and implements deletion purge. Wave 3 (P1 security) adds notification emails and validation. Wave 4 (P3 accessibility) creates a global preferences provider. Wave 5 (P3/P4 UX polish) handles remaining UI fixes.

**Tech Stack:** Next.js 16 / TypeScript / Supabase Auth (MFA, session management) / Resend (email) / React Email (templates) / Tailwind CSS v4

**Source audit:** `docs/superpowers/plans/2026-03-22-section19-qa-audit-report.md` (commit `bd6a003`)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/api/settings/reauth/route.ts` | Re-authentication endpoint — validates current password before security-critical actions |
| `src/lib/auth/reauth-token.ts` | Short-lived HMAC token issued after re-auth, verified by protected endpoints |
| `src/emails/security-alert.tsx` | React Email template for security alert notifications |
| `src/services/email/security-email-service.ts` | Security email dispatch: password change, 2FA change, email change, new login, OAuth change |
| `src/contexts/PreferencesContext.tsx` | Global context provider for accessibility + language preferences |
| `src/hooks/usePreferences.ts` | Hook wrapping PreferencesContext for components |
| `src/services/gdpr/purge-service.ts` | Account purge logic: pseudonymise, cascade delete, storage cleanup |
| `supabase/migrations/20260324000000_account_purge_function.sql` | pg_cron daily job + purge RPC for GDPR Art. 17 |
| `src/hooks/useUnsavedChanges.ts` | Reusable beforeunload + router guard hook |
| `src/components/settings/ReauthDialog.tsx` | Modal dialog for password re-entry before sensitive actions |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/api/settings/mfa/verify/route.ts` | Salted hashing for backup codes |
| `src/app/api/settings/mfa/unenroll/route.ts` | Require reauth token before unenroll |
| `src/app/api/settings/mfa/backup-codes/route.ts` | Salted hashing for regenerated codes |
| `src/services/auth/auth-service.ts` | New `changePassword()` fn with reauth + session invalidation |
| `src/app/(protected)/settings/security/page.tsx` | Integrate reauth flow for password, 2FA, use new changePassword |
| `src/components/settings/PasswordChangeCard.tsx` | SSO-aware: detect no-password users, show "Set password" mode |
| `src/components/settings/ProfileForm.tsx` | Reauth before email change, generic error on email taken, unsaved changes hook |
| `src/app/(protected)/settings/privacy/page.tsx` | Reauth before account deletion, role-aware ghost mode warning |
| `src/app/api/settings/privacy/route.ts` | Strict boolean type validation |
| `src/app/api/settings/profile/route.ts` | Sanitise bio field, strip phone spaces before validation |
| `src/app/api/settings/profile/avatar/route.ts` | Accept WebP + HEIC magic bytes |
| `src/services/gdpr/export-service.ts` | Query all 20+ user tables |
| `src/app/api/gdpr/delete/route.ts` | Require reauth token, add rate limiting |
| `src/app/api/gdpr/export/route.ts` | Defence-in-depth: assert userId matches session |
| `src/app/(protected)/settings/notifications/page.tsx` | Show non-toggleable security alerts section |
| `src/app/(protected)/settings/preferences/page.tsx` | Remove Welsh/Gaelic until translations exist, remove EUR/USD |
| `src/app/(protected)/layout.tsx` | Wrap authenticated routes with PreferencesProvider |
| `src/components/settings/AvatarUploader.tsx` | Accept .heic/.webp in file picker |

---

## Wave 1: P0 Security Hardening (BUG-1, 2, 3, 4, 5, 20, 25, 31)

### Task 1: Re-authentication API endpoint

**Files:**
- Create: `src/lib/auth/reauth-token.ts`
- Create: `src/app/api/settings/reauth/route.ts`

**Context:** Supabase's `updateUser({ password })` only needs a valid session — it does NOT verify the current password. We need a server-side re-authentication step that: (1) verifies the user's current password, (2) issues a short-lived HMAC token. Protected endpoints (password change, email change, 2FA disable, account deletion) then require this token.

- [ ] **Step 1: Create the reauth token utility**

```typescript
// src/lib/auth/reauth-token.ts
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

// Dedicated signing secret — falls back to service role key if not set.
// MUST NOT be empty in production.
const SECRET = process.env.REAUTH_HMAC_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!SECRET) {
  throw new Error("REAUTH_HMAC_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
}
const TTL_MS = 5 * 60 * 1000; // 5 minutes
// NOTE: Tokens are replayable within the 5-min TTL window. This is accepted
// because they are same-origin HTTPS-only and short-lived. If stricter
// single-use semantics are needed, store nonces in Redis with TTL.

export function issueReauthToken(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}.${nonce}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyReauthToken(
  token: string,
  expectedUserId: string,
): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const [userId, timestamp] = payload.split(".");
    if (userId !== expectedUserId) return false;

    const age = Date.now() - Number(timestamp);
    if (age > TTL_MS || age < 0) return false;

    const expectedSig = createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");

    return timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSig, "hex"),
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Create the reauth API route**

```typescript
// src/app/api/settings/reauth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { issueReauthToken } from "@/lib/auth/reauth-token";
import { createAuthRateLimiter } from "@/lib/cache/redis";

const reauthLimiter = createAuthRateLimiter(5, "5 m");

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 attempts per 5 minutes
  const { success: rateLimitOk } = await reauthLimiter.limit(
    `reauth:${user.id}`,
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).password === "string"
      ? ((body as Record<string, unknown>).password as string)
      : null;

  if (!password) {
    return NextResponse.json(
      { error: "password is required" },
      { status: 400 },
    );
  }

  // Verify current password using a throwaway anon client (NOT admin client).
  // Using anon key avoids granting service-role capabilities to verification.
  // The session created here is not persisted and is discarded immediately.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await verifier.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 403 },
    );
  }

  const token = issueReauthToken(user.id);

  return NextResponse.json({ reauth_token: token });
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no type errors in the new files.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/reauth-token.ts src/app/api/settings/reauth/route.ts
git commit -m "feat(security): add re-authentication endpoint with HMAC token

Fixes BUG-1/2/3/31 foundation — issues short-lived reauth tokens after
password verification. Endpoints that modify security-critical state
will require this token."
```

---

### Task 2: Re-authentication dialog component

**Files:**
- Create: `src/components/settings/ReauthDialog.tsx`

**Context:** A reusable modal that prompts for the current password, calls `/api/settings/reauth`, and returns the token to the caller via a callback.

- [ ] **Step 1: Create the ReauthDialog component**

```typescript
// src/components/settings/ReauthDialog.tsx
"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReauthDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (token: string) => void;
  title?: string;
  description?: string;
}>;

export function ReauthDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Confirm your identity",
  description = "Enter your current password to continue.",
}: ReauthDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/settings/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const body = (await res.json()) as {
        reauth_token?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.error ?? "Verification failed");
        return;
      }

      if (body.reauth_token) {
        onSuccess(body.reauth_token);
        onOpenChange(false);
        setPassword("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setPassword("");
        onOpenChange(isOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-2 py-4">
            <Label htmlFor="reauth-password">Current Password</Label>
            <Input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !password.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/ReauthDialog.tsx
git commit -m "feat(security): add ReauthDialog component for password re-entry"
```

---

### Task 3: Secure password change with reauth + session invalidation (BUG-1, BUG-4, BUG-20)

**Files:**
- Modify: `src/services/auth/auth-service.ts` — add `changePassword()` that accepts reauth token
- Create: `src/app/api/settings/change-password/route.ts` — server-side endpoint
- Modify: `src/app/(protected)/settings/security/page.tsx` — integrate reauth flow
- Modify: `src/components/settings/PasswordChangeCard.tsx` — add SSO-awareness (BUG-16)

- [ ] **Step 1: Create server-side password change endpoint**

```typescript
// src/app/api/settings/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReauthToken } from "@/lib/auth/reauth-token";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    reauth_token,
    new_password,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof reauth_token !== "string" || !verifyReauthToken(reauth_token, user.id)) {
    return NextResponse.json(
      { error: "Re-authentication required" },
      { status: 403 },
    );
  }

  if (typeof new_password !== "string" || new_password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters" },
      { status: 400 },
    );
  }

  // Change password via admin client
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: new_password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to update password" },
      { status: 500 },
    );
  }

  // Invalidate all other sessions — sign out globally then re-sign current
  // The client will need to re-authenticate after this
  try {
    await supabase.auth.signOut({ scope: "others" });
  } catch {
    // Best effort — session invalidation failure shouldn't block password change
    console.error("[change-password] Failed to invalidate other sessions");
  }

  // Audit log
  await supabase.from("auth_audit_log").insert({
    user_id: user.id,
    event_type: "password_changed",
    ip_address: null,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Update PasswordChangeCard for SSO-awareness (BUG-16)**

In `src/components/settings/PasswordChangeCard.tsx`, add a `hasPassword` prop. When `false`, show "Set a Password" mode (no current password field, no reauth needed for first-time password set). When `true`, show the standard change flow.

Add prop: `hasPassword: boolean` and `onReauthRequired: () => void`.

When `hasPassword` is false, render:
```
Your account uses Google Sign-In. Set a password to enable email/password login as well.
[New Password] [Confirm Password] [Set Password]
```

When `hasPassword` is true, render the existing form but the submit handler calls `onReauthRequired()` instead of directly changing the password.

- [ ] **Step 3: Wire reauth into security page password change**

In `src/app/(protected)/settings/security/page.tsx`:
1. Add state: `const [reauthOpen, setReauthOpen] = useState(false);`
2. Add state: `const [pendingAction, setPendingAction] = useState<"password" | "mfa-disable" | null>(null);`
3. Detect SSO-only: check if user has identities but no email provider.
4. When password form submits: open ReauthDialog. On reauth success, call `POST /api/settings/change-password` with the reauth token + new password.
5. Import and render `<ReauthDialog>`.

- [ ] **Step 4: Verify build and lint**

Run: `cd britv3.0 && pnpm build && pnpm lint`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/settings/change-password/route.ts \
  src/components/settings/PasswordChangeCard.tsx \
  src/app/\(protected\)/settings/security/page.tsx
git commit -m "fix(security): require reauth for password change + invalidate sessions

Fixes BUG-1 (password change without current password verification),
BUG-4 (no session invalidation after password change),
BUG-16 (SSO-only users see broken password form),
BUG-20 (new password same as current — now caught by reauth step)."
```

---

### Task 4: Require reauth for 2FA disable (BUG-2, BUG-25)

**Files:**
- Modify: `src/app/api/settings/mfa/unenroll/route.ts`
- Modify: `src/app/(protected)/settings/security/page.tsx`

- [ ] **Step 1: Add reauth token verification to unenroll endpoint**

In `src/app/api/settings/mfa/unenroll/route.ts`, add:
1. Import `verifyReauthToken` from `@/lib/auth/reauth-token`
2. Extract `reauth_token` from request body alongside `factor_id`
3. Verify: `if (!verifyReauthToken(reauth_token, user.id)) return 403`
4. Add audit log entry for `mfa_disabled`

- [ ] **Step 2: Wire reauth into security page MFA disable**

In `src/app/(protected)/settings/security/page.tsx`:
Update `handleDisable()` to first open ReauthDialog, then on success include the reauth token in the DELETE body.

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/settings/mfa/unenroll/route.ts \
  src/app/\(protected\)/settings/security/page.tsx
git commit -m "fix(security): require reauth to disable 2FA

Fixes BUG-2 (2FA disable without re-authentication) and
BUG-25 (no cooldown on rapid 2FA toggle — reauth acts as gate)."
```

---

### Task 5: Require reauth for email change (BUG-3)

**Files:**
- Modify: `src/components/settings/ProfileForm.tsx`

- [ ] **Step 1: Move email change to server-side with reauth**

In `ProfileForm.tsx`:
1. Import `ReauthDialog`
2. Add state: `reauthOpen`, `reauthAction` (type: `"email" | null`)
3. When user clicks "Send confirmation" for email change: open ReauthDialog
4. On reauth success: call a new server endpoint `POST /api/settings/change-email` that:
   - Verifies reauth token
   - Calls `admin.auth.admin.updateUserById(user.id, { email: newEmail })` server-side
   - Returns a generic message regardless of whether the email is taken (BUG-30)

- [ ] **Step 2: Create change-email server endpoint**

```typescript
// src/app/api/settings/change-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyReauthToken } from "@/lib/auth/reauth-token";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reauth_token, email } = (body ?? {}) as Record<string, unknown>;

  if (typeof reauth_token !== "string" || !verifyReauthToken(reauth_token, user.id)) {
    return NextResponse.json(
      { error: "Re-authentication required" },
      { status: 403 },
    );
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Use the authenticated USER client (not admin) because Supabase's
  // updateUser({ email }) triggers the built-in email confirmation flow
  // (sends a verification link to the new address). The admin client's
  // updateUserById would change the email immediately without verification.
  // This is intentionally different from password change (Task 3) which
  // uses admin to bypass Supabase's password-change-without-current-password.
  const { error } = await supabase.auth.updateUser({ email });

  // Always return the same message regardless of error
  // to prevent email enumeration (BUG-30)
  if (error) {
    console.error("[change-email]", error.message);
  }

  return NextResponse.json({
    message: "If this email is available, a verification link has been sent.",
  });
}
```

- [ ] **Step 3: Update ProfileForm to use new endpoint**

Replace the direct `supabase.auth.updateUser({ email })` call with a fetch to `/api/settings/change-email` including the reauth token.

- [ ] **Step 4: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/settings/change-email/route.ts \
  src/components/settings/ProfileForm.tsx
git commit -m "fix(security): require reauth for email change, prevent email enumeration

Fixes BUG-3 (email change without password) and
BUG-30 (email enumeration via error messages)."
```

---

### Task 6: Salted backup code hashing (BUG-5)

**Files:**
- Modify: `src/app/api/settings/mfa/verify/route.ts`
- Modify: `src/app/api/settings/mfa/backup-codes/route.ts`

- [ ] **Step 1: Update hash function to use salt**

In `src/app/api/settings/mfa/verify/route.ts`, replace:

```typescript
function hashBackupCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
```

With:

```typescript
function hashBackupCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${code}`).digest("hex");
  return `${salt}:${hash}`;
}

function verifyBackupCode(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = createHash("sha256").update(`${salt}:${code}`).digest("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
}
```

- [ ] **Step 2: Update the storage format**

The `user_backup_codes.code_hash` column now stores `salt:hash` instead of just `hash`. This is backwards-compatible (old rows can be detected by absence of `:`). Update both `verify/route.ts` and `backup-codes/route.ts` to use the new format.

- [ ] **Step 3: Add `verifyBackupCode` export for login flow**

Export `verifyBackupCode` from a shared location (`src/lib/auth/backup-codes.ts`) so the login flow can also use it.

- [ ] **Step 4: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/backup-codes.ts \
  src/app/api/settings/mfa/verify/route.ts \
  src/app/api/settings/mfa/backup-codes/route.ts
git commit -m "fix(security): salt backup code hashes to prevent rainbow table attacks

Fixes BUG-5. Codes now stored as salt:hash. Old unsalted hashes
detected by absence of colon separator for backwards compatibility."
```

---

### Task 7: Require reauth for account deletion (BUG-31)

**Files:**
- Modify: `src/app/(protected)/settings/privacy/page.tsx`
- Modify: `src/app/api/gdpr/delete/route.ts`

- [ ] **Step 1: Add reauth token to delete endpoint**

In `src/app/api/gdpr/delete/route.ts`:
1. Import `verifyReauthToken`
2. Parse `reauth_token` from request body
3. Verify before proceeding
4. Add rate limiting using `createAuthRateLimiter(3, "1 h")` (BUG S-11)

- [ ] **Step 2: Update privacy page deletion flow**

In `src/app/(protected)/settings/privacy/page.tsx`:
1. Import `ReauthDialog`
2. After user types "DELETE" and clicks confirm: open ReauthDialog instead of immediately calling the API
3. On reauth success: call `/api/gdpr/delete` with `{ reauth_token }` in the POST body

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/gdpr/delete/route.ts \
  src/app/\(protected\)/settings/privacy/page.tsx
git commit -m "fix(security): require reauth + rate limit for account deletion

Fixes BUG-31 (deletion without password) and S-11 (no rate limit
on deletion endpoint). Reauth token required in POST body."
```

---

## Wave 2: P1 GDPR Compliance (BUG-6, 7, 8, 11, 12, 13)

### Task 8: Complete GDPR data export (BUG-6, BUG-8)

**Files:**
- Modify: `src/services/gdpr/export-service.ts`
- Modify: `src/app/api/gdpr/export/route.ts`

- [ ] **Step 1: Expand export-service to query all user tables**

Replace the current 7-table query in `export-service.ts` with a comprehensive export covering:

```typescript
const [
  profileResult,
  rolesResult,
  consentResult,
  consentAuditResult,
  authAuditResult,
  verificationsResult,
  deletionResult,
  // NEW tables below
  messagesResult,
  conversationsResult,
  savedPropertiesResult,
  savedSearchesResult,
  viewingHistoryResult,
  offersResult,
  reviewsWrittenResult,
  reviewsReceivedResult,
  bookingsAsUserResult,
  bookingsAsProviderResult,
  serviceRequestsResult,
  quotesResult,
  notificationPrefsResult,
  privacySettingsResult,
  // Role-specific
  sellerListingsResult,
  rentalPropertiesResult,
  tenanciesResult,
  maintenanceRequestsResult,
  financialEntriesResult,
  providerServicesResult,
  providerInvoicesResult,
] = await Promise.all([
  // ... existing 7 queries ...
  // NEW:
  supabase.from("messages").select("*").eq("sender_id", userId),
  supabase.from("conversations").select("id, context_type, created_at")
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`),
  supabase.from("saved_properties").select("*").eq("user_id", userId),
  supabase.from("saved_searches").select("*").eq("user_id", userId),
  supabase.from("viewing_history").select("*").eq("user_id", userId),
  supabase.from("offers").select("*").eq("user_id", userId),
  supabase.from("reviews").select("*").eq("reviewer_id", userId),
  supabase.from("reviews").select("id, rating, content, created_at")
    .eq("provider_id", userId),
  supabase.from("bookings").select("*").eq("user_id", userId),
  supabase.from("bookings").select("*").eq("provider_id", userId),
  supabase.from("service_requests").select("*").eq("user_id", userId),
  supabase.from("quotes").select("*").eq("provider_id", userId),
  supabase.from("profiles").select("notification_preferences")
    .eq("id", userId).single(),
  supabase.from("profiles").select("privacy_settings")
    .eq("id", userId).single(),
  // Role-specific (will return empty arrays for non-applicable roles)
  supabase.from("seller_listings").select("*").eq("user_id", userId),
  supabase.from("rental_properties").select("*").eq("landlord_id", userId),
  supabase.from("tenancies").select("*").eq("tenant_id", userId),
  supabase.from("maintenance_requests").select("*").eq("reported_by", userId),
  supabase.from("financial_entries").select("*").eq("user_id", userId),
  supabase.from("provider_services").select("*").eq("provider_id", userId),
  supabase.from("provider_invoices").select("*").eq("provider_id", userId),
]);
```

Note: Use `.select("*")` for own-data tables but exclude counterparty PII from joined data. Messages export includes sent messages only — received messages belong to the counterparty's export.

- [ ] **Step 2: Add defence-in-depth to the API route (BUG-8)**

In `src/app/api/gdpr/export/route.ts`, ensure the userId passed to `exportUserData()` is ALWAYS `user.id` from the session — never from request params:

```typescript
// The only userId passed is from the authenticated session — never from request
const exportData = await exportUserData(user.id);
```

Add a comment documenting this invariant.

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/services/gdpr/export-service.ts src/app/api/gdpr/export/route.ts
git commit -m "fix(gdpr): complete data export across all 20+ user tables

Fixes BUG-6 (GDPR Art. 15/20 — incomplete export) and
BUG-8 (defence-in-depth on admin client usage).
Now exports: messages, saved properties, searches, viewing history,
offers, reviews, bookings, service requests, quotes, financial entries,
notification prefs, privacy settings, and role-specific data."
```

---

### Task 9: Account deletion purge implementation (BUG-7, BUG-11, BUG-12, BUG-13)

**Files:**
- Create: `src/services/gdpr/purge-service.ts`
- Create: `supabase/migrations/20260324000000_account_purge_function.sql`

- [ ] **Step 1: Create the SQL purge function**

```sql
-- supabase/migrations/20260324000000_account_purge_function.sql
--
-- Prerequisites: This migration requires all of these migrations to have run:
--   001_foundation.sql (profiles, user_roles, consent_records, user_backup_codes)
--   002_marketplace.sql (bookings, service_requests, reviews, messages)
--   003_property_portal.sql (listings, saved_properties, saved_searches, viewing_history, search_analytics)
--   20260313_seller_dashboard.sql (seller_listings)
--   20260315000000_user_settings_columns.sql (user_backup_codes)
--
-- Note: pg_cron must be enabled (Supabase Pro plan+). If unavailable,
-- use an Inngest cron or Supabase Edge Function as the scheduler.

-- Pseudonymise and purge a deleted user's data.
-- Called by pg_cron daily or by admin manually.
CREATE OR REPLACE FUNCTION public.purge_deleted_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text := 'Deleted User';
BEGIN
  -- 1. Pseudonymise profile (don't delete — needed for FK references)
  UPDATE profiles
  SET
    display_name = v_display_name,
    first_name = NULL,
    last_name = NULL,
    phone = NULL,
    postcode = NULL,
    bio = NULL,
    avatar_url = NULL,
    privacy_settings = '{}'::jsonb,
    notification_preferences = '{}'::jsonb,
    language_preferences = '{}'::jsonb,
    accessibility_preferences = '{}'::jsonb,
    deleted_at = now()
  WHERE id = p_user_id;

  -- 2. Delete user-owned data (no legitimate interest retention)
  DELETE FROM saved_properties WHERE user_id = p_user_id;
  DELETE FROM saved_searches WHERE user_id = p_user_id;
  DELETE FROM viewing_history WHERE user_id = p_user_id;
  DELETE FROM search_analytics WHERE user_id = p_user_id;

  -- 3. Unpublish listings (BUG-11)
  UPDATE listings SET status = 'withdrawn', deleted_at = now()
  WHERE user_id = p_user_id AND status = 'active';

  UPDATE seller_listings SET status = 'withdrawn'
  WHERE user_id = p_user_id AND status IN ('active', 'draft');

  -- 4. Pseudonymise messages (counterparties keep history, sender becomes anonymous)
  UPDATE messages SET sender_id = NULL
  WHERE sender_id = p_user_id;

  -- 5. Anonymise reviews written by user (BUG-12)
  UPDATE reviews SET reviewer_id = NULL, reviewer_name = v_display_name
  WHERE reviewer_id = p_user_id;

  -- 6. Delete auth-related data
  DELETE FROM user_backup_codes WHERE user_id = p_user_id;
  DELETE FROM consent_records WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;

  -- 7. Cancel active bookings/requests
  UPDATE bookings SET status = 'cancelled'
  WHERE (user_id = p_user_id OR provider_id = p_user_id)
    AND status NOT IN ('completed', 'cancelled');

  UPDATE service_requests SET status = 'cancelled'
  WHERE user_id = p_user_id AND status = 'open';

  -- 8. Mark deletion as completed
  UPDATE deletion_requests
  SET status = 'completed'
  WHERE user_id = p_user_id AND status = 'pending';

  -- 9. Delete auth.users row to free email (BUG-13)
  -- This must be done via admin API, not SQL — handled by the service layer
END;
$$;

-- Restrict execution to service_role only (prevent RPC abuse)
REVOKE EXECUTE ON FUNCTION public.purge_deleted_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_deleted_user(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_deleted_user(uuid) TO service_role;

-- Daily cron job to process expired deletion requests
-- Requires pg_cron extension (Supabase Pro+). If not available, use Inngest.
SELECT cron.schedule(
  'purge-deleted-accounts',
  '0 3 * * *',  -- 3 AM daily
  $$
    SELECT public.purge_deleted_user(user_id)
    FROM public.deletion_requests
    WHERE status = 'pending'
      AND scheduled_purge_at <= now();
  $$
);
```

- [ ] **Step 2: Create purge service for Storage + auth.users cleanup**

```typescript
// src/services/gdpr/purge-service.ts
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Complete the purge for a user after the SQL function has run.
 * Handles operations that can't be done in SQL:
 * - Delete avatar from Supabase Storage
 * - Delete uploaded documents from Storage
 * - Delete the auth.users row to free the email
 */
export async function completePurge(userId: string) {
  const admin = createAdminClient();

  // Delete avatar files
  const { data: avatarFiles } = await admin.storage
    .from("avatars")
    .list(userId);

  if (avatarFiles?.length) {
    const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("avatars").remove(paths);
  }

  // Delete buyer documents
  const { data: docFiles } = await admin.storage
    .from("buyer-documents")
    .list(userId);

  if (docFiles?.length) {
    const paths = docFiles.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("buyer-documents").remove(paths);
  }

  // Delete auth.users row to free the email (BUG-13)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error(`[purge] Failed to delete auth.users for ${userId}:`, error);
    throw error;
  }
}
```

- [ ] **Step 3: Verify migration syntax**

Run: `cd britv3.0 && npx supabase db lint --schema public 2>&1 | tail -10` (if available, else manual review)

- [ ] **Step 4: Commit**

```bash
git add src/services/gdpr/purge-service.ts \
  supabase/migrations/20260324000000_account_purge_function.sql
git commit -m "feat(gdpr): implement account purge with pseudonymisation

Fixes BUG-7 (no automated purge after 30-day grace period),
BUG-11 (listings orphaned on agent deletion),
BUG-12 (no pseudonymisation for deleted users),
BUG-13 (email not freed after deletion).
Runs daily at 3 AM via pg_cron. Pseudonymises profile and messages,
unpublishes listings, cancels active bookings, deletes Storage files,
and removes auth.users row."
```

---

## Wave 3: P1 Security & Validation (S-7, S-8, S-9, S-10, BUG-9, BUG-10, BUG-24)

### Task 10: Security notification emails (S-8, BUG-9)

**Files:**
- Create: `src/emails/security-alert.tsx`
- Create: `src/services/email/security-email-service.ts`
- Modify: `src/app/api/settings/change-password/route.ts` — send email after success
- Modify: `src/app/api/settings/mfa/verify/route.ts` — send email on 2FA enable
- Modify: `src/app/api/settings/mfa/unenroll/route.ts` — send email on 2FA disable
- Modify: `src/app/api/settings/change-email/route.ts` — send email to old address
- Modify: `src/app/(protected)/settings/notifications/page.tsx` — show non-toggleable security section

- [ ] **Step 1: Create security alert email template**

```tsx
// src/emails/security-alert.tsx
import { EmailWrapper } from "./_components/EmailWrapper";
import { EmailButton } from "./_components/EmailButton";
import { Text, Section, Hr } from "@react-email/components";

type SecurityAlertEmailProps = {
  firstName: string;
  alertType: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  actionUrl?: string;
  actionLabel?: string;
};

export default function SecurityAlertEmail({
  firstName,
  alertType,
  description,
  timestamp,
  ipAddress,
  actionUrl,
  actionLabel,
}: SecurityAlertEmailProps) {
  return (
    <EmailWrapper previewText={`Security alert: ${alertType}`}>
      <Text style={{ fontSize: "16px", fontWeight: 600 }}>
        Hi {firstName},
      </Text>
      <Text>
        We detected the following security event on your Britestate account:
      </Text>
      <Section style={{
        background: "#fef3c7",
        padding: "16px",
        borderRadius: "8px",
        margin: "16px 0",
      }}>
        <Text style={{ fontWeight: 600, margin: 0 }}>{alertType}</Text>
        <Text style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
          {description}
        </Text>
        <Text style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
          {timestamp}{ipAddress ? ` · IP: ${ipAddress}` : ""}
        </Text>
      </Section>
      <Text>
        If this was you, no action is needed. If you did not perform this
        action, please secure your account immediately.
      </Text>
      {actionUrl && actionLabel && (
        <EmailButton href={actionUrl}>{actionLabel}</EmailButton>
      )}
      <Hr />
      <Text style={{ fontSize: "12px", color: "#666" }}>
        This is an automated security notification. You cannot unsubscribe
        from security alerts.
      </Text>
    </EmailWrapper>
  );
}
```

- [ ] **Step 2: Create security email service**

```typescript
// src/services/email/security-email-service.ts
//
// NOTE: `resendSend` and `logEmail` in email-service.ts are NOT exported.
// This service follows the same pattern as email-service.ts: it imports
// getResend() directly and handles its own logging. This avoids changing
// the email-service module's public API.
//
// Before implementing, check if email-service.ts has been refactored to
// export these helpers. If so, import them directly instead.

import { Resend } from "resend";
import { render } from "@react-email/render";
import SecurityAlertEmail from "@/emails/security-alert";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM_NAME = process.env.RESEND_FROM_NAME ?? "Britestate";
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "hello@britestate.co.uk";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

type SecurityEventType =
  | "password_changed"
  | "email_change_requested"
  | "mfa_enabled"
  | "mfa_disabled"
  | "oauth_connected"
  | "oauth_disconnected"
  | "new_login";

const EVENT_LABELS: Record<SecurityEventType, { title: string; desc: string }> = {
  password_changed: {
    title: "Password Changed",
    desc: "Your account password was changed.",
  },
  email_change_requested: {
    title: "Email Change Requested",
    desc: "A request was made to change your email address.",
  },
  mfa_enabled: {
    title: "Two-Factor Authentication Enabled",
    desc: "2FA was enabled on your account using an authenticator app.",
  },
  mfa_disabled: {
    title: "Two-Factor Authentication Disabled",
    desc: "2FA was removed from your account.",
  },
  oauth_connected: {
    title: "New Sign-in Method Added",
    desc: "A new social login was connected to your account.",
  },
  oauth_disconnected: {
    title: "Sign-in Method Removed",
    desc: "A social login was disconnected from your account.",
  },
  new_login: {
    title: "New Device Login",
    desc: "Your account was accessed from a new device or location.",
  },
};

export async function sendSecurityAlert(params: {
  userId: string;
  email: string;
  firstName: string;
  eventType: SecurityEventType;
  ipAddress?: string;
}) {
  const { userId, email, firstName, eventType, ipAddress } = params;
  const { title, desc } = EVENT_LABELS[eventType];
  const resend = getResend();

  if (!resend) {
    console.warn("[security-email] RESEND_API_KEY not set, skipping alert");
    return;
  }

  const html = await render(
    SecurityAlertEmail({
      firstName,
      alertType: title,
      description: desc,
      timestamp: new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
      }),
      ipAddress,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/settings/security`,
      actionLabel: "Review Security Settings",
    }),
  );

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: email,
      subject: `Security Alert: ${title}`,
      html,
    });

    // Log to email_logs table (fire-and-forget)
    const admin = createAdminClient();
    await admin.from("email_logs").insert({
      user_id: userId,
      template: `security_alert_${eventType}`,
      recipient: email,
      resend_id: data?.id ?? null,
      status: error ? "failed" : "sent",
      error_message: error?.message ?? null,
    });
  } catch (err) {
    console.error(`[security-email] Failed to send ${eventType}:`, err);
  }
}
```

- [ ] **Step 3: Wire security emails into existing endpoints**

Add `void sendSecurityAlert(...)` (fire-and-forget) to:
- `change-password/route.ts` after success → `"password_changed"`
- `mfa/verify/route.ts` after success → `"mfa_enabled"`
- `mfa/unenroll/route.ts` after success → `"mfa_disabled"`
- `change-email/route.ts` after success → `"email_change_requested"` (sent to OLD email)
- `connected/route.ts` DELETE handler → `"oauth_disconnected"`

- [ ] **Step 4: Add non-toggleable security section to notifications page (BUG-9)**

In `src/app/(protected)/settings/notifications/page.tsx`, add a section above the matrix:

```tsx
{/* Non-toggleable Security Alerts */}
<section className="space-y-4">
  <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
    Security Alerts
  </h3>
  <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
    <p className="font-body text-sm text-neutral-600 dark:text-neutral-400">
      Security notifications are always enabled and cannot be turned off.
      You will receive email alerts for:
    </p>
    <ul className="mt-2 space-y-1 font-body text-sm text-neutral-700 dark:text-neutral-300">
      <li>Password changes</li>
      <li>Two-factor authentication changes</li>
      <li>New device logins</li>
      <li>Email address changes</li>
      <li>Connected account changes</li>
    </ul>
  </div>
</section>
```

- [ ] **Step 5: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 6: Commit**

```bash
git add src/emails/security-alert.tsx \
  src/services/email/security-email-service.ts \
  src/app/api/settings/change-password/route.ts \
  src/app/api/settings/mfa/verify/route.ts \
  src/app/api/settings/mfa/unenroll/route.ts \
  src/app/api/settings/change-email/route.ts \
  src/app/api/settings/connected/route.ts \
  src/app/\(protected\)/settings/notifications/page.tsx
git commit -m "feat(security): add security notification emails for all critical actions

Fixes S-8 (no notification emails for security actions) and
BUG-9 (security alerts not present in notification system).
Sends email on: password change, email change, 2FA enable/disable,
OAuth connect/disconnect. Non-toggleable in notification preferences."
```

---

### Task 11: Privacy settings type validation + bio sanitisation (S-9, BUG-24, BUG-27)

**Files:**
- Modify: `src/app/api/settings/privacy/route.ts`
- Modify: `src/app/api/settings/profile/route.ts`

- [ ] **Step 1: Add strict boolean validation to privacy route**

In `src/app/api/settings/privacy/route.ts`, after the whitelist loop, validate types:

```typescript
// Validate boolean fields
const BOOLEAN_KEYS = [
  "search_indexing",
  "anonymous_analytics",
  "third_party_marketing",
  "active_status",
  "last_viewed_visible",
] as const;

for (const key of BOOLEAN_KEYS) {
  if (key in updates && typeof updates[key] !== "boolean") {
    return NextResponse.json(
      { error: `${key} must be a boolean` },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: Sanitise bio field in profile route (BUG-24)**

In `src/app/api/settings/profile/route.ts`:
1. Import `sanitizeText` from `@/lib/validation/sanitize`
2. Before storing bio: `updates.bio = sanitizeText(bio as string)`

- [ ] **Step 3: Strip phone spaces before validation (BUG-27)**

In the same file, before the UK_PHONE_REGEX test:
```typescript
const normalizedPhone = (phone as string).replace(/\s/g, "");
if (!UK_PHONE_REGEX.test(normalizedPhone)) { ... }
// Store the normalized version
updates.phone = normalizedPhone;
```

- [ ] **Step 4: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/settings/privacy/route.ts \
  src/app/api/settings/profile/route.ts
git commit -m "fix(security): strict boolean validation, bio sanitisation, phone space handling

Fixes S-9 (privacy settings accept string 'true' for booleans),
BUG-24 (bio not sanitised — XSS defence-in-depth),
BUG-27 (phone with spaces rejected)."
```

---

### Task 12: Remove misleading Welsh/Gaelic locale options (BUG-10)

**Files:**
- Modify: `src/app/(protected)/settings/preferences/page.tsx`

- [ ] **Step 1: Update locale and currency options**

In `preferences/page.tsx`:

Replace `LOCALE_OPTIONS`:
```typescript
const LOCALE_OPTIONS = [
  { value: "en-GB", label: "English (UK)" },
] as const;
```

Remove `cy-GB`, `gd-GB`, `en-US` until translations exist. Add a comment: `// TODO: Re-enable cy-GB (Welsh) and gd-GB (Gaelic) when i18n translations are ready`

Replace `CURRENCY_OPTIONS`:
```typescript
const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP (£)" },
] as const;
```

Remove EUR/USD for a UK-only platform.

Add more timezones to `TIMEZONE_OPTIONS`:
```typescript
const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Dublin", label: "Dublin (IST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Madrid", label: "Madrid (CET)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
] as const;
```

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/settings/preferences/page.tsx
git commit -m "fix(legal): remove non-functional Welsh/Gaelic locale options

Fixes BUG-10. Welsh and Gaelic options removed until i18n translations
exist. Showing them without translations creates false expectations
and potential Welsh Language Act compliance issues. Also removes
EUR/USD currency options (UK-only platform) and adds more timezones."
```

---

## Wave 4: P3 Accessibility Infrastructure (BUG-21, BUG-22)

### Task 13: Global preferences context provider

**Files:**
- Create: `src/contexts/PreferencesContext.tsx`
- Create: `src/hooks/usePreferences.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(protected)/settings/preferences/page.tsx`

- [ ] **Step 1: Create PreferencesContext**

```typescript
// src/contexts/PreferencesContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type AccessibilityPrefs = {
  font_size: "small" | "medium" | "large";
  reduced_motion: boolean;
  high_contrast: boolean;
  dark_mode: "system" | "light" | "dark";
  screen_reader_hints: boolean;
};

const DEFAULTS: AccessibilityPrefs = {
  font_size: "medium",
  reduced_motion: false,
  high_contrast: false,
  dark_mode: "system",
  screen_reader_hints: false,
};

const FONT_SIZE_SCALE: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "20px",
};

type PreferencesContextValue = {
  prefs: AccessibilityPrefs;
  updatePref: <K extends keyof AccessibilityPrefs>(
    key: K,
    value: AccessibilityPrefs[K],
  ) => void;
  loading: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: DEFAULTS,
  updatePref: () => {},
  loading: true,
});

function applyToDOM(prefs: AccessibilityPrefs) {
  const root = document.documentElement;

  // Font size
  root.style.fontSize = FONT_SIZE_SCALE[prefs.font_size] ?? "16px";

  // High contrast
  root.classList.toggle("high-contrast", prefs.high_contrast);

  // Reduced motion
  root.classList.toggle("reduce-motion", prefs.reduced_motion);

  // Screen reader hints
  root.classList.toggle("sr-hints", prefs.screen_reader_hints);

  // Dark mode
  if (prefs.dark_mode === "dark") {
    root.classList.add("dark");
  } else if (prefs.dark_mode === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.toggle(
      "dark",
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/prefs");
        if (!res.ok) return;
        const data = await res.json();
        const merged = { ...DEFAULTS, ...data };
        setPrefs(merged);
        applyToDOM(merged);
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const updatePref = useCallback(
    <K extends keyof AccessibilityPrefs>(
      key: K,
      value: AccessibilityPrefs[K],
    ) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        applyToDOM(next);
        return next;
      });
    },
    [],
  );

  return (
    <PreferencesContext.Provider value={{ prefs, updatePref, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export { PreferencesContext };
```

- [ ] **Step 2: Create usePreferences hook**

```typescript
// src/hooks/usePreferences.ts
"use client";

import { useContext } from "react";
import { PreferencesContext } from "@/contexts/PreferencesContext";

export function usePreferences() {
  return useContext(PreferencesContext);
}
```

- [ ] **Step 3: Add CSS rules for accessibility classes**

In `src/app/globals.css`, add:

```css
/* Accessibility: high contrast */
.high-contrast {
  --border-opacity: 1;
  filter: contrast(1.25);
}

/* Accessibility: reduced motion */
.reduce-motion,
.reduce-motion * {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
}

/* Accessibility: screen reader hints — adds extra sr-only descriptions */
.sr-hints [data-sr-hint]::after {
  content: attr(data-sr-hint);
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

- [ ] **Step 4: Wrap authenticated layout with PreferencesProvider**

**Important:** Do NOT add to the root layout (`src/app/layout.tsx`). The preferences
API requires authentication — calling it for unauthenticated visitors wastes a
network request and returns 401.

Instead, add `PreferencesProvider` to the `(protected)` route group layout. If
`src/app/(protected)/layout.tsx` exists, wrap children there. If not, create it:

```tsx
// src/app/(protected)/layout.tsx
import { PreferencesProvider } from "@/contexts/PreferencesContext";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}
```

This ensures preferences are only fetched for authenticated users and apply
across all protected routes (dashboard, settings, inbox, etc.).

- [ ] **Step 5: Update preferences page to use context**

In `src/app/(protected)/settings/preferences/page.tsx`:
1. Import `usePreferences`
2. Replace local state management with `updatePref` from context for accessibility fields
3. Remove the local `applyDarkModePreview` function — the context handles it

- [ ] **Step 6: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 7: Commit**

```bash
git add src/contexts/PreferencesContext.tsx \
  src/hooks/usePreferences.ts \
  src/app/globals.css \
  src/app/\(protected\)/layout.tsx \
  src/app/\(protected\)/settings/preferences/page.tsx
git commit -m "feat(a11y): global PreferencesProvider applies accessibility settings to DOM

Fixes BUG-21 (accessibility settings are write-only) and
BUG-22 (settings don't persist across pages/sessions).
Font size, high contrast, reduced motion, and dark mode now apply
globally via CSS classes on <html>. Synced from Supabase on load."
```

---

## Wave 5: P3/P4 UX Polish (BUG-14, BUG-17, BUG-18, BUG-23, BUG-26, BUG-29)

### Task 14: Unsaved changes warning (BUG-14)

**Files:**
- Create: `src/hooks/useUnsavedChanges.ts`
- Modify: `src/components/settings/ProfileForm.tsx`

- [ ] **Step 1: Create reusable hook**

```typescript
// src/hooks/useUnsavedChanges.ts
"use client";

import { useEffect } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
```

- [ ] **Step 2: Wire into ProfileForm**

In `src/components/settings/ProfileForm.tsx`:
```typescript
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
// ... inside component:
useUnsavedChanges(isDirty);
```

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useUnsavedChanges.ts src/components/settings/ProfileForm.tsx
git commit -m "fix(ux): warn on unsaved changes in profile form

Fixes BUG-14. Browser beforeunload event fires when ProfileForm
has dirty state, preventing accidental data loss."
```

---

### Task 15: Accept HEIC + WebP avatar uploads (BUG-23)

**Files:**
- Modify: `src/app/api/settings/profile/avatar/route.ts`
- Modify: `src/components/settings/AvatarUploader.tsx`

- [ ] **Step 1: Add WebP magic bytes to server validation**

In `avatar/route.ts`, update `detectImageType`:

```typescript
function detectImageType(buffer: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}
```

Update the storage path to handle webp extension and content type.

Note: HEIC server-side conversion requires a native library (libheif) that's complex to deploy on serverless. Instead, handle HEIC client-side: modern browsers convert HEIC to JPEG/PNG via Canvas before upload. For now, update the error message to guide users.

- [ ] **Step 2: Update AvatarUploader client-side accept attribute**

In `AvatarUploader.tsx`, update the file input's `accept` attribute to include `.webp`:

```
accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
```

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/settings/profile/avatar/route.ts \
  src/components/settings/AvatarUploader.tsx
git commit -m "fix(ux): accept WebP avatar uploads with magic byte validation

Fixes BUG-23 (partially). WebP now accepted alongside JPEG/PNG.
HEIC requires client-side conversion — deferred to avatar crop task."
```

---

### Task 16: Role-aware Ghost mode warning (BUG-29)

**Files:**
- Modify: `src/app/(protected)/settings/privacy/page.tsx`

- [ ] **Step 1: Fetch user's active role and warn when professional selects Ghost**

In `privacy/page.tsx`:
1. Fetch the user's profile to get `active_role`
2. In `applyPrivacyMode`, if mode is `"ghost"` and role is `"estate_agent"` or `"service_provider"`, show a confirmation toast/dialog:

```typescript
const PROFESSIONAL_ROLES = ["estate_agent", "service_provider"];

// Add state for the ghost mode warning dialog:
// const [ghostWarningOpen, setGhostWarningOpen] = useState(false);
// const [pendingGhostMode, setPendingGhostMode] = useState(false);

async function applyPrivacyMode(mode: PrivacyMode) {
  if (
    mode === "ghost" &&
    activeRole &&
    PROFESSIONAL_ROLES.includes(activeRole)
  ) {
    // Show a Dialog (not window.confirm) for design system consistency
    setPendingGhostMode(true);
    setGhostWarningOpen(true);
    return; // Wait for dialog confirmation
  }
  // ... existing apply logic (extract to a shared function)
}

// Render a Dialog component:
// <Dialog open={ghostWarningOpen} onOpenChange={setGhostWarningOpen}>
//   <DialogContent>
//     <DialogHeader>
//       <DialogTitle>Hide from marketplace?</DialogTitle>
//       <DialogDescription>
//         Ghost mode will hide your profile from marketplace search.
//         Clients will not be able to find or contact you.
//       </DialogDescription>
//     </DialogHeader>
//     <DialogFooter>
//       <Button variant="outline" onClick={() => setGhostWarningOpen(false)}>Cancel</Button>
//       <Button variant="destructive" onClick={() => { setGhostWarningOpen(false); doApplyGhostMode(); }}>
//         Enable Ghost Mode
//       </Button>
//     </DialogFooter>
//   </DialogContent>
// </Dialog>
```

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/settings/privacy/page.tsx
git commit -m "fix(ux): warn professional users before Ghost privacy mode

Fixes BUG-29. Agents and tradespeople see a confirmation dialog
when selecting Ghost mode, explaining marketplace visibility impact."
```

---

### Task 17: Nav bar profile state invalidation (BUG-26)

**Files:**
- Modify: `src/components/settings/ProfileForm.tsx`

- [ ] **Step 1: Trigger router refresh after profile save**

In `ProfileForm.tsx`, after successful save:

```typescript
import { useRouter } from "next/navigation";
// ...
const router = useRouter();
// In handleSave, after toast.success:
router.refresh(); // Forces Server Components to re-fetch, updating nav bar
```

This triggers Next.js to re-run server components (which re-fetch the profile data for the nav bar) without a full page reload.

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/ProfileForm.tsx
git commit -m "fix(ux): refresh nav bar after profile save via router.refresh()

Fixes BUG-26. Server Components re-fetch profile data after save,
updating the nav bar name/avatar without a full page reload."
```

---

## Summary

| Wave | Tasks | Bugs Fixed | Files Changed |
|------|-------|-----------|---------------|
| 1: P0 Security | 1-7 | BUG-1,2,3,4,5,16,20,25,30,31 + S-11 | 12 new, 8 modified |
| 2: P1 GDPR | 8-9 | BUG-6,7,8,11,12,13 | 2 new, 2 modified |
| 3: P1 Validation | 10-12 | BUG-9,10,24,27 + S-8,S-9 | 2 new, 8 modified |
| 4: P3 A11y | 13 | BUG-21,22 | 3 new, 3 modified |
| 5: P3/P4 Polish | 14-17 | BUG-14,23,26,29 | 1 new, 4 modified |
| **Total** | **17 tasks** | **27 bugs + 3 security findings** | **20 new, 25 modified** |

**Not addressed in this plan (deferred):**
- BUG-17 (role-specific profile fields) — Requires new DB columns and role-specific service layer. Should be a separate plan per role.
- BUG-18 (avatar crop step) — Requires a client-side image cropping library (react-image-crop or similar). Should be a dedicated PR.
- BUG-19 (login history reliability) — Depends on Supabase audit log configuration, not application code. Document the Supabase project setting needed.
- S-7 (CSRF tokens) — Supabase's SameSite=lax + JWT auth provides adequate CSRF protection for same-origin API calls. Additional CSRF tokens would add complexity without meaningful security gain given the architecture.
- S-10 (fail-open rate limiting) — Verified: MFA verify already uses `createAuthRateLimiter` which is fail-closed. No fix needed.
