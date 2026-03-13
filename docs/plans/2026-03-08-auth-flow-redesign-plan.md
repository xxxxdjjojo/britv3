# Auth Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace broken multi-step registration with Zillow-inspired two-path auth flow (consumer vs professional), remove email verification gate, add non-blocking verify banner.

**Architecture:** Simplify RegisterForm to include Buy/Rent toggle + "I am a professional" link. Professional path goes to filtered role-select (landlord/agent/service_provider) then onboarding. Consumer path goes straight to dashboard. Email verification becomes a dashboard banner, not a gate.

**Tech Stack:** Next.js App Router, Supabase Auth, React Hook Form, Zod, Tailwind CSS

---

### Task 1: Update RegisterForm — Zillow-style consumer signup

**Files:**
- Modify: `src/components/auth/RegisterForm.tsx`

**Step 1: Rewrite RegisterForm with Buy/Rent toggle and "I am a professional" link**

Replace the entire `RegisterForm` component. Key changes:
- Add `intent` field to schema: `"buy" | "rent"` (defaults to `"buy"`)
- Remove `confirmPassword` field (Zillow doesn't use it — simpler)
- Remove consent toggles section (move to settings later)
- Keep terms checkbox but make it inline text, not a separate block
- Add "I am a professional" link below submit button
- On submit: call signUp, insert role (homebuyer/renter) into user_roles, set active_role on profiles, redirect to `/dashboard`

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { signUp } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

const registerSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  intent: z.enum(["buy", "rent"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      intent: "buy",
    },
  });

  const password = watch("password");
  const intent = watch("intent");

  async function onSubmit(data: RegisterFormValues) {
    setError(null);
    const { error: authError } = await signUp(
      data.email,
      data.password,
      data.displayName,
    );
    if (authError) {
      setError(authError.message);
      return;
    }

    // Set role based on intent
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const role: UserRole = data.intent === "rent" ? "renter" : "homebuyer";
        await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role });
        await supabase
          .from("profiles")
          .update({ active_role: role })
          .eq("id", user.id);
      }
    } catch {
      // Non-blocking: role can be set later
    }

    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Intent Toggle: Buy / Rent */}
      <div className="flex rounded-lg border border-neutral-200 p-1">
        <button
          type="button"
          onClick={() => setValue("intent", "buy")}
          className={`flex-1 rounded-md py-2 text-center text-sm font-medium transition-colors ${
            intent === "buy"
              ? "bg-brand-primary text-white"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          I want to buy
        </button>
        <button
          type="button"
          onClick={() => setValue("intent", "rent")}
          className={`flex-1 rounded-md py-2 text-center text-sm font-medium transition-colors ${
            intent === "rent"
              ? "bg-brand-primary text-white"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          I want to rent
        </button>
      </div>

      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Full name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Your full name"
          className="h-11"
          aria-invalid={!!errors.displayName}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-xs text-error">{errors.displayName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email address</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          className="h-11"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="Create a password"
          className="h-11"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-error">{errors.password.message}</p>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Terms (inline) */}
      <p className="text-xs text-neutral-500">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-brand-accent hover:underline" target="_blank">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-brand-accent hover:underline" target="_blank">
          Privacy Policy
        </Link>
      </p>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Continue"
        )}
      </Button>

      {/* Professional link */}
      <div className="text-center">
        <Link
          href="/register/role-select"
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          I am a professional
        </Link>
      </div>
    </form>
  );
}
```

**Step 2: Verify the form renders correctly**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`
Expected: No TypeScript errors in RegisterForm.tsx

**Step 3: Commit**

```bash
git add src/components/auth/RegisterForm.tsx
git commit -m "feat(auth): redesign RegisterForm with Buy/Rent toggle and professional link"
```

---

### Task 2: Update register page layout and login page

**Files:**
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(auth)/login/page.tsx`

**Step 1: Simplify register page — move OAuth above form with "OR" divider**

```tsx
// src/app/(auth)/register/page.tsx
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
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Create account
        </h1>
      </div>

      <RegisterForm />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">OR</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <OAuthButtons />

      <p className="text-center font-body text-sm text-neutral-500">
        Have a Britestate account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

**Step 2: Update login page to match style**

```tsx
// src/app/(auth)/login/page.tsx
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
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Welcome back
        </h1>
      </div>

      <LoginForm />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">OR</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <OAuthButtons />

      <p className="text-center font-body text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`

**Step 4: Commit**

```bash
git add src/app/(auth)/register/page.tsx src/app/(auth)/login/page.tsx
git commit -m "feat(auth): simplify register and login page layout"
```

---

### Task 3: Filter RoleSelector for professional roles only

**Files:**
- Modify: `src/components/auth/RoleSelector.tsx`
- Modify: `src/app/(auth)/register/role-select/page.tsx`
- Modify: `src/lib/constants.ts`

**Step 1: Add PROFESSIONAL_ROLES constant**

Add to `src/lib/constants.ts` after the existing `ROLES` array:

```ts
/** Professional roles shown on "I am a professional" path */
export const PROFESSIONAL_ROLES: readonly RoleDefinition[] = ROLES.filter(
  (r) => r.value === "landlord" || r.value === "agent" || r.value === "service_provider",
);
```

**Step 2: Update RoleSelector to accept a `roles` prop**

Replace the `ROLES` import usage with a prop so it can be filtered:

```tsx
"use client";

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import type { RoleDefinition } from "@/lib/constants";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
  Check,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
};

export function RoleSelector(
  props: Readonly<{
    onSubmit: (roles: UserRole[]) => void;
    loading?: boolean;
    roles?: readonly RoleDefinition[];
    singleSelect?: boolean;
  }>,
) {
  const roles = props.roles ?? ROLES;
  const [selectedRoles, setSelectedRoles] = useState<Set<UserRole>>(new Set());

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) => {
      if (props.singleSelect) {
        return new Set([role]);
      }
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (selectedRoles.size > 0) {
      props.onSubmit([...selectedRoles]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = ICON_MAP[role.icon];
          const isSelected = selectedRoles.has(role.value);

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => toggleRole(role.value)}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
                isSelected
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-neutral-200 bg-white hover:border-neutral-300",
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-brand-primary">
                  <Check className="size-4 text-white" />
                </div>
              )}
              {Icon && (
                <Icon
                  className={cn(
                    "size-8",
                    isSelected ? "text-brand-primary" : "text-neutral-400",
                  )}
                />
              )}
              <div>
                <p className="font-medium text-neutral-900">{role.label}</p>
                <p className="mt-1 text-sm text-neutral-500">{role.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selectedRoles.size === 0 || props.loading}
        className="w-full"
        size="lg"
      >
        {props.loading ? "Setting up..." : "Continue"}
      </Button>
    </div>
  );
}
```

**Step 3: Update role-select page to use professional roles + single select**

```tsx
// src/app/(auth)/register/role-select/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { PROFESSIONAL_ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

export default function RoleSelectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRolesSelected(roles: UserRole[]) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User not logged in yet — store selection and redirect to register
      const role = roles[0];
      router.push(`/register?professional=${role}`);
      return;
    }

    const role = roles[0];

    // Insert role into user_roles table
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role });

    if (insertError && !insertError.message.includes("duplicate")) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Set as active role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_role: role })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Navigate to onboarding for the selected role
    router.push(`/register/onboarding/${role}`);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Welcome to Britestate
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Select your professional type
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <RoleSelector
        onSubmit={handleRolesSelected}
        loading={loading}
        roles={PROFESSIONAL_ROLES}
        singleSelect
      />

      <p className="text-center font-body text-sm text-neutral-500">
        Not a professional?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign up as a homebuyer
        </Link>
      </p>
    </div>
  );
}
```

**Step 4: Remove homebuyer/renter/seller from OnboardingFlow config**

In `src/components/auth/OnboardingFlow.tsx`, remove the `homebuyer`, `renter`, and `seller` entries from `ONBOARDING_CONFIG`. Only keep `landlord`, `agent`, and `service_provider`.

```tsx
const ONBOARDING_CONFIG: Record<string, OnboardingConfig> = {
  landlord: {
    title: "Tell us about your portfolio",
    fields: [
      { name: "portfolioSize", label: "Number of properties", placeholder: "e.g. 3", type: "number" },
    ],
  },
  agent: {
    title: "Tell us about your agency",
    fields: [
      { name: "agencyName", label: "Agency name", placeholder: "e.g. Smith & Partners" },
      { name: "licenseNumber", label: "License number", placeholder: "e.g. ARLA-12345" },
      { name: "coverageArea", label: "Coverage area", placeholder: "e.g. Greater London" },
    ],
  },
  service_provider: {
    title: "Tell us about your services",
    fields: [
      { name: "tradeCategory", label: "Trade category", placeholder: "e.g. Conveyancing, Surveys" },
      { name: "coverageArea", label: "Coverage area", placeholder: "e.g. South East England" },
    ],
  },
};
```

Also update the `role` prop type from `UserRole` to `string` and add a fallback:

```tsx
export function OnboardingFlow(
  props: Readonly<{
    role: string;
  }>,
) {
  const router = useRouter();
  const config = ONBOARDING_CONFIG[props.role];

  // If no config for this role, redirect to dashboard
  if (!config) {
    router.push("/dashboard");
    return null;
  }

  // ... rest stays the same
```

**Step 5: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`

**Step 6: Commit**

```bash
git add src/lib/constants.ts src/components/auth/RoleSelector.tsx src/app/(auth)/register/role-select/page.tsx src/components/auth/OnboardingFlow.tsx
git commit -m "feat(auth): filter role-select to professional roles only"
```

---

### Task 4: Remove email verification gate

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/app/(auth)/verify-email/page.tsx`

**Step 1: Remove /verify-email from AUTH_ROUTES so it's accessible to authenticated users too**

In `src/lib/constants.ts`, remove `/verify-email` and `/welcome` from `AUTH_ROUTES`:

```ts
export const AUTH_ROUTES: readonly string[] = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;
```

Add them to PUBLIC_ROUTES instead (so both logged-in and logged-out users can access):

```ts
export const PUBLIC_ROUTES: readonly string[] = [
  "/",
  "/about",
  "/terms",
  "/privacy",
  "/overview",
  "/search",
  "/properties",
  "/marketplace",
  "/help",
  "/verify-email",
  "/welcome",
] as const;
```

**Step 2: Simplify verify-email page to a utility page (not a gate)**

The verify-email page can still exist for users who want to resend their verification email, but it's no longer in the critical path. No code change needed to the page itself — it already works standalone.

**Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`

**Step 4: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(auth): remove email verification gate from auth routes"
```

---

### Task 5: Create EmailVerifyBanner for dashboard

**Files:**
- Create: `src/components/auth/EmailVerifyBanner.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Step 1: Create the banner component**

```tsx
// src/components/auth/EmailVerifyBanner.tsx
"use client";

import { useState } from "react";
import { Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function EmailVerifyBanner(
  props: Readonly<{
    email: string;
    emailConfirmed: boolean;
  }>,
) {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (props.emailConfirmed || dismissed) {
    return null;
  }

  async function handleResend() {
    setResending(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: "signup",
        email: props.email,
      });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-warning-light px-4 py-3">
      <div className="flex items-center gap-3">
        <Mail className="size-4 shrink-0 text-warning" />
        <p className="text-sm text-neutral-700">
          Please verify your email address.{" "}
          {resent ? (
            <span className="font-medium text-success">Verification email sent!</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-brand-accent hover:underline"
            >
              {resending ? (
                <Loader2 className="inline size-3 animate-spin" />
              ) : (
                "Resend verification email"
              )}
            </button>
          )}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-neutral-400 hover:text-neutral-600"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
```

**Step 2: Add banner to protected layout**

Update `src/app/(protected)/layout.tsx` to check email verification status and show banner:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ProtectedHeader } from "@/components/layout/ProtectedHeader";
import { BottomTabBarWrapper } from "@/components/mobile/BottomTabBarWrapper";
import { PullToRefreshWrapper } from "@/components/mobile/PullToRefreshWrapper";
import { EmailVerifyBanner } from "@/components/auth/EmailVerifyBanner";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const emailConfirmed = !!user.email_confirmed_at;

  return (
    <QueryProvider>
      <EmailVerifyBanner
        email={user.email ?? ""}
        emailConfirmed={emailConfirmed}
      />
      <ProtectedHeader />
      <PullToRefreshWrapper />
      <main className="pb-16 md:pb-0">{children}</main>
      <BottomTabBarWrapper />
    </QueryProvider>
  );
}
```

**Step 3: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`

**Step 4: Commit**

```bash
git add src/components/auth/EmailVerifyBanner.tsx src/app/(protected)/layout.tsx
git commit -m "feat(auth): add non-blocking email verification banner"
```

---

### Task 6: Update middleware to handle default role fallback

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Add role check for authenticated users going to /dashboard**

The middleware should ensure that if an authenticated user has no active_role set (edge case), they get defaulted to homebuyer. Add this after the existing admin route guard block:

```ts
  // Default role fallback: if user accesses dashboard with no active_role, set homebuyer
  if (isAuthenticated && pathname.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_role")
      .eq("id", user!.id)
      .single();

    if (profile && !profile.active_role) {
      await supabase
        .from("profiles")
        .update({ active_role: "homebuyer" })
        .eq("id", user!.id);
      // Also ensure user_roles has at least one entry
      await supabase
        .from("user_roles")
        .upsert(
          { user_id: user!.id, role: "homebuyer" },
          { onConflict: "user_id,role" },
        );
    }
  }
```

Insert this between the admin route guard block (line ~142) and the final `setSecurityHeaders` call (line ~145).

**Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): add default role fallback in middleware"
```

---

### Task 7: Update OAuthButtons to handle post-OAuth role assignment

**Files:**
- Modify: `src/app/auth/callback/route.ts`

**Step 1: Update callback to check if user has roles, assign default if not**

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  // Check if user already has roles assigned
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    // If no roles, assign default homebuyer
    if (!roles || roles.length === 0) {
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "homebuyer" });
      await supabase
        .from("profiles")
        .update({ active_role: "homebuyer" })
        .eq("id", user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
```

**Step 2: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat(auth): assign default role on OAuth callback"
```

---

### Task 8: Supabase config — disable email confirmation requirement

**Files:** None (Supabase Dashboard change)

**Step 1: Disable email confirmation in Supabase**

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **Providers** → **Email**
2. Toggle OFF **"Confirm email"**
3. Save

This allows users to sign in immediately after registration without confirming their email. The `EmailVerifyBanner` component will still encourage them to verify.

**Alternative if you want to keep confirmation enabled:** The flow will still work because we redirect to `/dashboard` instead of `/verify-email`. Users will be able to sign up but may get `Email not confirmed` errors on sign-in. If that happens, you must disable the confirmation.

---

### Task 9: End-to-end smoke test

**Files:** None

**Step 1: Test consumer registration flow**

1. Open `/register` in browser
2. Verify Buy/Rent toggle appears
3. Verify "I am a professional" link appears at bottom
4. Fill in name, email, password with "Buy" selected
5. Click "Continue"
6. Verify redirect to `/dashboard`
7. Verify email verify banner appears at top of dashboard
8. Check Supabase: `profiles.active_role = 'homebuyer'`, `user_roles` has `homebuyer` entry

**Step 2: Test professional registration flow**

1. Open `/register`, click "I am a professional"
2. Verify only Landlord, Estate Agent, Service Provider roles are shown
3. Select "Landlord", click Continue
4. Verify redirect to `/register/onboarding/landlord`
5. Fill in portfolio size (or click "Skip for now")
6. Verify redirect to `/dashboard`
7. Check Supabase: `profiles.active_role = 'landlord'`

**Step 3: Test login flow**

1. Open `/login`
2. Sign in with previously created credentials
3. Verify redirect to `/dashboard`
4. Verify correct dashboard loads based on active_role

**Step 4: Commit all remaining changes (if any)**

```bash
git add -A
git commit -m "test(auth): verify auth flow redesign end-to-end"
```
