# Auth & Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all auth and onboarding pages to FAANG-quality — split-panel layout, Google-only OAuth, working 2FA, 5 new account state/2FA pages, and 6 real onboarding wizards with Supabase saves replacing current stubs.

**Architecture:** Build shared infrastructure first (AuthLayout, OTPInput, WizardStepper, RightPanelContent), then layer pages on top. All new components generated via Magic MCP with Britestate design tokens. Onboarding wizards save directly to Supabase using the MCP.

**Tech Stack:** Next.js App Router, Supabase Auth (MFA APIs), React Hook Form + Zod, Tailwind CSS v4, Shadcn UI, Magic MCP (`mcp__magic__21st_magic_component_builder`), MapTiler

**Spec:** `docs/plans/2026-03-13-auth-onboarding-redesign.md`

---

## Chunk 1: Shared Infrastructure

### Task 1: Replace AuthLayout with split-panel

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Create: `src/components/auth/RightPanelContent.tsx`

- [ ] **Step 1: Build RightPanelContent via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A right panel component for an auth layout. Dark green overlay (#1B4D3E with 80% opacity) over a property lifestyle photo background. Shows a rotating testimonial card (avatar, name, role, italic quote) and a row of trust stats: "25k+ Properties", "5k+ Verified Pros", "4.8★ Average Rating". Font: Plus Jakarta Sans headings, Inter body. Britestate brand colors.
```

Save output to `src/components/auth/RightPanelContent.tsx`. Adapt to use `next/image` for the background photo. Testimonial data hardcoded as a static array of 3 testimonials, rotated every 5s via `useEffect`.

- [ ] **Step 2: Rewrite AuthLayout**

Replace `src/app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { RightPanelContent } from "@/components/auth/RightPanelContent";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — 44% on desktop, full width on mobile */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-[44%] md:px-12 lg:px-16">
        {/* Logo */}
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary">
            <span className="font-heading text-base font-bold text-white">B</span>
          </div>
          <span className="font-heading text-xl font-bold text-neutral-900">
            Britestate
          </span>
        </Link>

        {/* Page content */}
        <div className="w-full max-w-[420px]">{children}</div>
      </div>

      {/* Right panel — 56% on desktop only */}
      <div className="hidden md:block md:w-[56%]">
        <RightPanelContent />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/layout.tsx src/components/auth/RightPanelContent.tsx
git commit -m "feat(auth): split-panel AuthLayout with rotating testimonials"
```

---

### Task 2: Build OTPInput component

**Files:**
- Create: `src/components/auth/OTPInput.tsx`

- [ ] **Step 1: Build via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 6-digit OTP input component. 6 separate input boxes, each 40px wide × 48px tall. Auto-advance to next box on input. Auto-backspace to previous on delete. Paste support — pasting 6 digits fills all boxes. Accessible with aria-label per digit. Britestate design tokens: brand-primary #1B4D3E for focus ring, Inter font.
```

Save to `src/components/auth/OTPInput.tsx`. Props: `value: string`, `onChange: (value: string) => void`, `disabled?: boolean`, `autoFocus?: boolean`.

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OTPInput.tsx
git commit -m "feat(auth): add OTPInput component for 2FA flows"
```

---

### Task 3: Build WizardStepper component

**Files:**
- Create: `src/components/auth/WizardStepper.tsx`

- [ ] **Step 1: Build via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A horizontal step progress indicator for a multi-step wizard. Shows numbered circles (1, 2, 3...) connected by a line. Current step: filled brand-primary circle (#1B4D3E) with white number. Completed step: filled with checkmark icon. Future step: outline circle, muted text. Step label below each circle. Plus Jakarta Sans font. Responsive — collapses to "Step 2 of 4" text on mobile.
```

Save to `src/components/auth/WizardStepper.tsx`. Props: `steps: string[]`, `currentStep: number` (0-indexed).

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/WizardStepper.tsx
git commit -m "feat(auth): add WizardStepper component for onboarding flows"
```

---

### Task 4: Update OAuthButtons — Google only, remove Apple

**Files:**
- Modify: `src/components/auth/OAuthButtons.tsx`

- [ ] **Step 1: Remove Apple button and simplify**

Replace the entire file:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithOAuth } from "@/services/auth/auth-service";

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function OAuthButtons() {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      const { error } = await signInWithOAuth("google");
      if (error) {
        console.error("Google OAuth error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full gap-2"
      onClick={handleGoogle}
      disabled={loading}
    >
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OAuthButtons.tsx
git commit -m "feat(auth): remove Apple OAuth, Google-only"
```

---

## Chunk 2: Core Auth Pages

### Task 5: Redesign Login page — OAuth first

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/auth/LoginForm.tsx`

- [ ] **Step 1: Move OAuth above form in login page**

Replace `src/app/(auth)/login/page.tsx`:

```tsx
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Sign In - Britestate",
  description: "Sign in to your Britestate account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Welcome back
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Sign in to your account
        </p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">or continue with email</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <LoginForm />

      <p className="text-center font-body text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add "Remember me" to LoginForm**

Read `src/components/auth/LoginForm.tsx` first, then add a `rememberMe` boolean field to the schema and a checkbox below the password field. Pass `rememberMe` to `signIn` (no behaviour change needed right now — Supabase handles session persistence separately).

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/login/page.tsx src/components/auth/LoginForm.tsx
git commit -m "feat(auth): OAuth-first login layout + remember me checkbox"
```

---

### Task 6: Redesign Register page — role badge + split name

**Files:**
- Modify: `src/components/auth/RegisterForm.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Add role badge and split first/last name**

In `RegisterForm.tsx`, make these changes:
1. Replace `displayName` field with `firstName` + `lastName` side by side (2-col grid)
2. Add a `role badge` above the Buy/Rent toggle:
   ```tsx
   <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
     Signing up as: {intent === "rent" ? "Renter" : "Buyer"}
   </div>
   ```
3. Combine `firstName` + `lastName` into `display_name` on submit: `${data.firstName} ${data.lastName}`
4. Update Zod schema accordingly

- [ ] **Step 2: Update register page**

Replace `src/app/(auth)/register/page.tsx`:

```tsx
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Create Account - Britestate",
  description: "Create your Britestate account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Create your account
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Find, buy, rent or sell — all in one place
        </p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">or sign up with email</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <RegisterForm />

      <p className="text-center font-body text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/RegisterForm.tsx src/app/(auth)/register/page.tsx
git commit -m "feat(auth): add role badge and split name fields to register form"
```

---

### Task 7: Update Role Selector — add Mortgage Broker as 6th role

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/types/auth.ts`

- [ ] **Step 1: Add mortgage_broker to UserRole type**

In `src/types/auth.ts`, add `"mortgage_broker"` to the `UserRole` union type.

- [ ] **Step 2: Add Mortgage Broker to ROLES and PROFESSIONAL_ROLES**

In `src/lib/constants.ts`:
1. Add to `ROLES` array:
   ```ts
   {
     value: "mortgage_broker" as UserRole,
     label: "Mortgage Broker",
     description: "Help clients find the right mortgage",
     icon: "Landmark",
   },
   ```
2. Add `"mortgage_broker"` to `PROFESSIONAL_ROLES` filter

- [ ] **Step 3: Add Landmark to icon map in RoleSelector**

In `src/components/auth/RoleSelector.tsx`, add `Landmark` to the `ICON_MAP` import from lucide-react.

- [ ] **Step 4: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/lib/constants.ts src/types/auth.ts src/components/auth/RoleSelector.tsx
git commit -m "feat(auth): add Mortgage Broker as 6th professional role"
```

---

### Task 8: Rename /welcome → /verify-email/confirmed

**Files:**
- Create: `src/app/(auth)/verify-email/confirmed/page.tsx`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/services/auth/auth-service.ts` (if it redirects to /welcome)

- [ ] **Step 1: Create /verify-email/confirmed page**

Read the existing `src/app/(auth)/welcome/page.tsx` to understand its content, then create a new page at `src/app/(auth)/verify-email/confirmed/page.tsx` with the same content but updated copy ("Your email is confirmed" → "Email verified! You're all set.").

- [ ] **Step 2: Add redirect from /welcome to /verify-email/confirmed**

Create `src/app/(auth)/welcome/page.tsx` or update it to redirect:
```tsx
import { redirect } from "next/navigation";
export default function WelcomePage() {
  redirect("/verify-email/confirmed");
}
```

- [ ] **Step 3: Update any auth callback that redirects to /welcome**

Grep for `/welcome` in `src/app/auth/callback/route.ts` and `src/services/auth/`. Change to `/verify-email/confirmed`.

Run: `cd britv3.0 && grep -r "/welcome" src/ --include="*.ts" --include="*.tsx"`

- [ ] **Step 4: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/verify-email/ src/app/(auth)/welcome/
git commit -m "feat(auth): rename /welcome to /verify-email/confirmed with redirect"
```

---

### Task 9: Improve Forgot Password and Reset Password pages

**Files:**
- Modify: `src/components/auth/ForgotPasswordForm.tsx`
- Modify: `src/components/auth/ResetPasswordForm.tsx`

- [ ] **Step 1: Add success state to ForgotPasswordForm**

Read `src/components/auth/ForgotPasswordForm.tsx`. After successful submission, show inline success state instead of a toast/redirect:

```tsx
if (submitted) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
        <Mail className="size-6 text-success" />
      </div>
      <h3 className="font-heading text-lg font-semibold">Check your inbox</h3>
      <p className="text-sm text-neutral-500">
        We sent a reset link to <strong>{submittedEmail}</strong>
      </p>
      <p className="text-xs text-neutral-400">
        {cooldown > 0 ? `Resend available in ${cooldown}s` : (
          <button onClick={handleResend} className="text-brand-accent hover:underline">
            Didn&apos;t receive it? Resend
          </button>
        )}
      </p>
    </div>
  );
}
```

Track `submitted: boolean`, `submittedEmail: string`, `cooldown: number` in state.

- [ ] **Step 2: Add requirements checklist to ResetPasswordForm**

Read `src/components/auth/ResetPasswordForm.tsx`. Below the password field, add a real-time checklist:

```tsx
const requirements = [
  { label: "At least 8 characters", met: password.length >= 8 },
  { label: "One uppercase letter", met: /[A-Z]/.test(password) },
  { label: "One number", met: /[0-9]/.test(password) },
];

// Render:
<ul className="space-y-1">
  {requirements.map((req) => (
    <li key={req.label} className="flex items-center gap-2 text-xs">
      <Check className={`size-3 ${req.met ? "text-success" : "text-neutral-300"}`} />
      <span className={req.met ? "text-neutral-700" : "text-neutral-400"}>{req.label}</span>
    </li>
  ))}
</ul>
```

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/ForgotPasswordForm.tsx src/components/auth/ResetPasswordForm.tsx
git commit -m "feat(auth): success state for forgot-password, requirements checklist for reset"
```

---

## Chunk 3: 2FA Pages

### Task 10: Create 2FA Setup page

**Files:**
- Create: `src/app/(auth)/two-factor-setup/page.tsx`
- Create: `src/components/auth/TwoFactorSetupFlow.tsx`
- Create: `src/services/auth/mfa-service.ts`

- [ ] **Step 1: Create MFA service**

Create `src/services/auth/mfa-service.ts`:

```ts
import { createClient } from "@/lib/supabase/client";

export async function enrollMFA() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Britestate",
  });
  return { data, error };
}

export async function createMFAChallenge(factorId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  return { data, error };
}

export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  return { data, error };
}

export async function generateBackupCodes(userId: string): Promise<string[]> {
  // Generate 8 random 8-char alphanumeric codes
  const codes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );

  const supabase = createClient();
  // Store hashed codes (using SHA-256 via Web Crypto API)
  const hashedCodes = await Promise.all(
    codes.map(async (code) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }),
  );

  await supabase
    .from("user_backup_codes")
    .upsert(
      hashedCodes.map((hash) => ({ user_id: userId, code_hash: hash, used: false })),
      { onConflict: "user_id,code_hash" },
    );

  return codes; // Return plain text — shown once only
}
```

- [ ] **Step 2: Build TwoFactorSetupFlow via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 3-step 2FA setup flow component. Step 1: "Download an authenticator app" - shows app store badges for Google Authenticator and Authy. Step 2: "Scan QR code" - shows a QR code image (passed as prop), manual code below it, OTPInput for verification. Step 3: "Save backup codes" - grid of 8 monospace codes, copy-all button, download as txt button, "I've saved these codes" checkbox required before Continue. Britestate design system (#1B4D3E brand primary, Plus Jakarta Sans headings).
```

Save to `src/components/auth/TwoFactorSetupFlow.tsx`.

Props:
```ts
{
  onComplete: () => void;
  onSkip?: () => void;
}
```

Wire to mfa-service: on mount, call `enrollMFA()` to get QR URL and factorId. On step 2 verify, call `createMFAChallenge` then `verifyMFAChallenge`. On step 3 continue, call `generateBackupCodes`.

- [ ] **Step 3: Create the page**

Create `src/app/(auth)/two-factor-setup/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { TwoFactorSetupFlow } from "@/components/auth/TwoFactorSetupFlow";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Set up two-factor authentication
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Add an extra layer of security to your account
        </p>
      </div>
      <TwoFactorSetupFlow
        onComplete={() => router.push("/dashboard")}
        onSkip={() => router.push("/dashboard")}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/services/auth/mfa-service.ts src/components/auth/TwoFactorSetupFlow.tsx src/app/(auth)/two-factor-setup/
git commit -m "feat(auth): add 2FA setup page with TOTP enroll + backup codes"
```

---

### Task 11: Create 2FA Code Entry page

**Files:**
- Create: `src/app/(auth)/two-factor/page.tsx`
- Create: `src/components/auth/TwoFactorForm.tsx`

- [ ] **Step 1: Build TwoFactorForm via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 2FA verification form. Large 6-digit OTPInput (boxes 40px wide × 48px tall). Countdown timer below showing "Code expires in 0:27". Attempt counter warning: "2 attempts remaining" in amber when ≤ 2 attempts left. "Use a backup code instead" text link below. Submit button: "Verify". Error state: red border on OTPInput with error message. Britestate design tokens.
```

Save to `src/components/auth/TwoFactorForm.tsx`. Wire to mfa-service:
- Get `factorId` from URL param or Supabase MFA list
- On mount: call `createMFAChallenge(factorId)`
- On submit: call `verifyMFAChallenge(factorId, challengeId, code)`
- Track `attempts` state; after 3 failures redirect to `/account-locked`
- On success: `router.push(next ?? "/dashboard")`

- [ ] **Step 2: Create the page**

Create `src/app/(auth)/two-factor/page.tsx`:

```tsx
import { Suspense } from "react";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";

export const metadata = {
  title: "Two-Factor Authentication - Britestate",
};

export default function TwoFactorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Enter verification code
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Open your authenticator app and enter the 6-digit code
        </p>
      </div>
      <Suspense>
        <TwoFactorForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/TwoFactorForm.tsx src/app/(auth)/two-factor/
git commit -m "feat(auth): add 2FA code entry page with attempt tracking"
```

---

## Chunk 4: Account State Pages

### Task 12: Create Account Locked page

**Files:**
- Create: `src/app/(auth)/account-locked/page.tsx`

- [ ] **Step 1: Build page via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
An account locked page. Warning icon (amber). Heading: "Your account is temporarily locked". Body: "Too many failed sign-in attempts triggered an automatic lock." Countdown timer component showing remaining lock duration (reads from URL param "until" as ISO timestamp). Two CTAs: primary button "Reset Password Instead" → /forgot-password, secondary button "Try Again Later" (disabled until countdown reaches zero). Britestate design system.
```

Save to `src/app/(auth)/account-locked/page.tsx`. Read `until` from `searchParams`. Calculate remaining seconds with `useEffect` countdown.

- [ ] **Step 2: Update middleware to redirect to /account-locked on lockout**

In `src/middleware.ts`, check `profiles.locked_until`. If set and in the future, redirect to `/account-locked?until={locked_until}` instead of returning 401.

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/account-locked/ src/middleware.ts
git commit -m "feat(auth): add account-locked page with countdown timer"
```

---

### Task 13: Create Account Suspended page

**Files:**
- Create: `src/app/(auth)/account-suspended/page.tsx`

- [ ] **Step 1: Create page**

Create `src/app/(auth)/account-suspended/page.tsx`:

```tsx
import { Suspense } from "react";
import { AccountSuspendedContent } from "@/components/auth/AccountSuspendedContent";

export const metadata = {
  title: "Account Suspended - Britestate",
};

export default function AccountSuspendedPage() {
  return (
    <Suspense>
      <AccountSuspendedContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Build AccountSuspendedContent via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
An account suspended notification page. Red/error visual treatment. Shield-off icon. Heading: "Your account has been suspended". Shows suspension reason (passed as prop from URL searchParam "reason"). Two buttons: primary "Contact Support" (mailto link), secondary outline "Appeal This Decision" (link to support form). Britestate design tokens, error semantic color (#DC2626).
```

Create as `src/components/auth/AccountSuspendedContent.tsx`. Read `reason` from `useSearchParams()`.

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/account-suspended/ src/components/auth/AccountSuspendedContent.tsx
git commit -m "feat(auth): add account-suspended page"
```

---

### Task 14: Create Account Deletion Confirmation page

**Files:**
- Create: `src/app/(auth)/account-deletion-confirm/page.tsx`
- Create: `src/components/auth/AccountDeletionConfirm.tsx`

- [ ] **Step 1: Build via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
An account deletion scheduled confirmation page. Calendar/clock icon. Heading: "Your account deletion is scheduled". Subheading showing deletion date (30 days from now, formatted as "15 April 2026"). Bullet list of what gets deleted: Profile & account data, Property listings, Messages & documents, Analytics & preferences. Large prominent primary button: "Cancel Deletion — Keep My Account" in brand-primary green. Small secondary text link below: "I understand, proceed with deletion". Britestate design tokens.
```

Save to `src/components/auth/AccountDeletionConfirm.tsx`.

Wire the "Cancel Deletion" button: call Supabase to clear `profiles.scheduled_deletion_at` then redirect to `/dashboard`.
Wire the "proceed" link: call a deletion confirmation endpoint then redirect to `/` with a success param.

Create the page at `src/app/(auth)/account-deletion-confirm/page.tsx` wrapping the component.

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/account-deletion-confirm/ src/components/auth/AccountDeletionConfirm.tsx
git commit -m "feat(auth): add account deletion confirmation page"
```

---

## Chunk 5: Onboarding Wizards

### Task 15: Create OnboardingLayout (AuthLayout + WizardStepper)

**Files:**
- Create: `src/components/auth/OnboardingLayout.tsx`

- [ ] **Step 1: Create OnboardingLayout**

```tsx
import { WizardStepper } from "@/components/auth/WizardStepper";

export function OnboardingLayout(
  props: Readonly<{
    steps: string[];
    currentStep: number;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }>,
) {
  return (
    <div className="space-y-6">
      <WizardStepper steps={props.steps} currentStep={props.currentStep} />
      <div>
        <h2 className="font-heading text-xl font-bold text-neutral-900">{props.title}</h2>
        {props.subtitle && (
          <p className="mt-1 font-body text-sm text-neutral-500">{props.subtitle}</p>
        )}
      </div>
      {props.children}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OnboardingLayout.tsx
git commit -m "feat(auth): add OnboardingLayout with WizardStepper wrapper"
```

---

### Task 16: Replace OnboardingFlow — Buyer/Renter wizard

**Files:**
- Create: `src/components/auth/onboarding/BuyerOnboarding.tsx`
- Modify: `src/components/auth/OnboardingFlow.tsx`

- [ ] **Step 1: Build BuyerOnboarding via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 4-step buyer/renter onboarding wizard. Step 1 "Location": search input for UK areas, shows up to 5 selected location chips with remove button, radius slider (1–30 miles). Step 2 "Budget": dual-handle price range slider (£0–£2M for buyers, £500–£5000/month for renters), tenure radio (Freehold/Leasehold/Either). Step 3 "Property Type": card toggles for Flat/House/Bungalow/New Build, min bedrooms stepper (0–5+), must-have toggles (Garden, Parking, EPC A-C). Step 4 "Alerts": notification frequency radio (Instant/Daily/Weekly), alert type checkboxes (Email/Push). Each step has a "Skip for now" link. Britestate design system (#1B4D3E primary, Plus Jakarta Sans headings).
```

Save to `src/components/auth/onboarding/BuyerOnboarding.tsx`.

Wire Supabase saves in `handleComplete`:
```ts
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
await supabase.from("buyer_preferences").upsert({
  user_id: user!.id,
  preferred_locations: formData.locations,
  min_budget: formData.minBudget,
  max_budget: formData.maxBudget,
  property_types: formData.propertyTypes,
  min_bedrooms: formData.minBedrooms,
  requirements: formData.mustHaves,
  notification_frequency: formData.alertFrequency,
  alert_types: formData.alertTypes,
}, { onConflict: "user_id" });
```

- [ ] **Step 2: Update OnboardingFlow to delegate to role-specific components**

Replace `src/components/auth/OnboardingFlow.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { BuyerOnboarding } from "./onboarding/BuyerOnboarding";
import { SellerOnboarding } from "./onboarding/SellerOnboarding";
import { LandlordOnboarding } from "./onboarding/LandlordOnboarding";
import { AgentOnboarding } from "./onboarding/AgentOnboarding";
import { TradespersonOnboarding } from "./onboarding/TradespersonOnboarding";
import { MortgageBrokerOnboarding } from "./onboarding/MortgageBrokerOnboarding";

const WIZARD_MAP: Record<string, React.ComponentType<{ onComplete: () => void; onSkip: () => void }>> = {
  homebuyer: BuyerOnboarding,
  renter: BuyerOnboarding,
  seller: SellerOnboarding,
  landlord: LandlordOnboarding,
  agent: AgentOnboarding,
  service_provider: TradespersonOnboarding,
  mortgage_broker: MortgageBrokerOnboarding,
};

export function OnboardingFlow(props: Readonly<{ role: string }>) {
  const router = useRouter();
  const Wizard = WIZARD_MAP[props.role];

  if (!Wizard) {
    router.push("/dashboard");
    return null;
  }

  return (
    <Wizard
      onComplete={() => router.push("/dashboard")}
      onSkip={() => router.push("/dashboard")}
    />
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/onboarding/ src/components/auth/OnboardingFlow.tsx
git commit -m "feat(auth): add buyer/renter onboarding wizard with Supabase saves"
```

---

### Task 17: Seller onboarding wizard

**Files:**
- Create: `src/components/auth/onboarding/SellerOnboarding.tsx`

- [ ] **Step 1: Build via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 3-step seller onboarding wizard. Step 1 "Your Property": UK address autocomplete input, property type cards (Flat/House/Bungalow/New Build), bedrooms + bathrooms steppers. Step 2 "Property Details": tenure radio (Freehold/Leasehold), EPC rating dropdown (A–G), estimated value slider (£50k–£2M). Step 3 "Selling Intent": timeline cards (ASAP / 3 months / 6 months / 12+ months), agent preference radio (Use Britestate / Already have agent / Undecided). Each step has "Skip for now" link. Britestate design tokens.
```

Save to `src/components/auth/onboarding/SellerOnboarding.tsx`.

Wire Supabase saves to `seller_profiles` and `properties` tables on complete.

- [ ] **Step 2: Verify build + commit**

```bash
git add src/components/auth/onboarding/SellerOnboarding.tsx
git commit -m "feat(auth): add seller onboarding wizard"
```

---

### Task 18: Landlord onboarding wizard

**Files:**
- Create: `src/components/auth/onboarding/LandlordOnboarding.tsx`

- [ ] **Step 1: Build via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 3-step landlord onboarding wizard. Step 1 "Your Portfolio": number-of-properties stepper, property type multi-select checkboxes (Flat/House/HMO/Student/Commercial). Step 2 "First Property": address input, type select, bedrooms stepper, current monthly rent input. Step 3 "Compliance Documents" (optional): file upload areas for Gas Safety, EPC, EICR certificates — each with drag-drop zone and "Skip" link per document. Britestate design tokens.
```

Save to `src/components/auth/onboarding/LandlordOnboarding.tsx`.

Wire saves: Step 1 → `landlord_profiles`, Step 2 → `properties`, Step 3 → `compliance_documents`.

- [ ] **Step 2: Verify build + commit**

```bash
git add src/components/auth/onboarding/LandlordOnboarding.tsx
git commit -m "feat(auth): add landlord onboarding wizard with compliance doc uploads"
```

---

### Task 19: Estate Agent onboarding wizard

**Files:**
- Create: `src/components/auth/onboarding/AgentOnboarding.tsx`

- [ ] **Step 1: Build via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 3-step estate agent onboarding wizard. Step 1 "Your Agency": agency name input, address autocomplete, HMRC/Companies House registration number input. Step 2 "Your Profile": job title input, coverage areas multi-select (UK regions), specialisms checkboxes (Residential Sales/Lettings/Commercial/New Builds/Luxury). Step 3 "Invite Your Team" (optional): email address list input (add multiple emails), role assignment per email (Agent/Admin), send invitations button. Britestate design tokens.
```

Save to `src/components/auth/onboarding/AgentOnboarding.tsx`.

Wire saves: Step 1 → `agencies`, Step 2 → `agent_profiles`, Step 3 → `agency_invitations`.

Note: On step 3 complete, redirect to `/two-factor-setup` (agent role requires 2FA prompt) before dashboard.

- [ ] **Step 2: Verify build + commit**

```bash
git add src/components/auth/onboarding/AgentOnboarding.tsx
git commit -m "feat(auth): add estate agent onboarding wizard with team invitations"
```

---

### Task 20: Tradesperson + Mortgage Broker onboarding wizards

**Files:**
- Create: `src/components/auth/onboarding/TradespersonOnboarding.tsx`
- Create: `src/components/auth/onboarding/MortgageBrokerOnboarding.tsx`

- [ ] **Step 1: Build TradespersonOnboarding via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 4-step tradesperson onboarding wizard. Step 1 "Trade Category": multi-select cards (Plumber/Electrician/Carpenter/Surveyor/Conveyancer/Gas Engineer/Painter/Builder etc). Step 2 "Coverage Area": postcode/region multi-select with map radius preview. Step 3 "Credentials": text inputs for qualifications, insurance policy number, accreditations (Gas Safe, NICEIC etc) with optional document upload. Step 4 "Availability": day-of-week checkboxes, hours range slider, response time SLA radio (Same day/24h/48h/1 week). Britestate tokens.
```

Save to `src/components/auth/onboarding/TradespersonOnboarding.tsx`. Wire saves to `service_provider_profiles`, `provider_service_areas`, `provider_credentials`.

- [ ] **Step 2: Build MortgageBrokerOnboarding via Magic MCP**

Call `mcp__magic__21st_magic_component_builder` with:
```
A 3-step mortgage broker onboarding wizard. Step 1 "Your Firm": firm name input, FCA reference number input (validated format: 6 digits), office address. Step 2 "Specialisms": toggle cards for First-time Buyers / Buy-to-Let / Remortgage / Self-Employed / Commercial / Shared Ownership. Step 3 "Coverage": UK regions multi-select, remote/in-person/both radio, maximum number of clients per month stepper. Britestate tokens.
```

Save to `src/components/auth/onboarding/MortgageBrokerOnboarding.tsx`. Wire saves to `mortgage_broker_profiles`.

- [ ] **Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | grep -E "error|Error" | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/onboarding/TradespersonOnboarding.tsx src/components/auth/onboarding/MortgageBrokerOnboarding.tsx
git commit -m "feat(auth): add tradesperson and mortgage broker onboarding wizards"
```

---

### Task 21: Final verification — full auth flow smoke test

**Files:** None

- [ ] **Step 1: Run production build**

Run: `cd britv3.0 && pnpm build`
Expected: 0 errors, 0 TypeScript errors

- [ ] **Step 2: Run linter**

Run: `cd britv3.0 && pnpm lint`
Expected: 0 errors

- [ ] **Step 3: Test consumer registration flow**

Start dev server: `cd britv3.0 && pnpm dev`

1. Open `/register` → verify split-panel layout (form left, property image right)
2. Verify Google-only OAuth button at top
3. Verify Buy/Rent toggle, role badge ("Signing up as: Buyer")
4. Verify "I am a professional" link
5. Complete signup → redirect to `/dashboard` → `EmailVerifyBanner` visible

- [ ] **Step 4: Test professional flow**

1. Click "I am a professional" → `/register/role-select`
2. Verify 6 role cards including Mortgage Broker
3. Select "Estate Agent" → onboarding wizard → `/two-factor-setup` prompt
4. Select "Landlord" → onboarding wizard → `/dashboard`

- [ ] **Step 5: Test new pages exist**

Navigate to: `/two-factor-setup`, `/two-factor`, `/account-locked`, `/account-suspended`, `/account-deletion-confirm`
Expected: All pages render without 404

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(auth): final verification — auth + onboarding redesign complete"
```
