# Phase 1: Foundation - Research

**Researched:** 2026-03-07
**Domain:** Authentication, RBAC, GDPR compliance, Supabase Auth, Next.js App Router security
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire authentication and authorization foundation for Britestate: user registration (email/password + OAuth), email verification, multi-role selection and switching, provider verification pipeline, GDPR consent management with audit trail, security headers (CSP Level 3), RBAC middleware, and public pages. The codebase is currently a bare Next.js 16.1.6 scaffold with only Tailwind CSS configured -- all feature code must be built from scratch.

The primary technical challenge is implementing a multi-role user system on top of Supabase Auth (which has no native multi-role concept), combined with GDPR-compliant consent management with a full audit trail. The Epic 1 spec provides detailed schema designs, middleware patterns, and security hardening guidance that should be followed closely, though adapted for the actual stack versions (Next.js 16 vs the spec's assumed Next.js 14, React 19 vs React 18).

**Primary recommendation:** Use `@supabase/ssr` (v0.9.0) + `@supabase/supabase-js` (v2.98.0) for all auth, with Zod + react-hook-form for validation, Shadcn UI for components styled to the Britestate design system, and database-level RLS + triggers for security and audit trails.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with email and password | Supabase `signUp` with PKCE flow, Zod validation, password strength meter |
| AUTH-02 | User receives email verification after signup | Supabase built-in email confirmation, PKCE code exchange route at `/auth/callback` |
| AUTH-03 | User can log in with Google OAuth (PKCE flow) | Supabase `signInWithOAuth` with `provider: 'google'`, PKCE enabled by default in `@supabase/ssr` |
| AUTH-04 | User can log in with Apple OAuth | Supabase `signInWithOAuth` with `provider: 'apple'`, requires Apple Developer account setup |
| AUTH-05 | User can reset password via email link | Supabase `resetPasswordForEmail` + password update form on callback |
| AUTH-06 | User session persists across browser refresh (JWT with refresh tokens) | `@supabase/ssr` cookie-based session with middleware token refresh |
| AUTH-07 | User can select role(s) after registration (6 roles) | Custom `user_roles` junction table (many-to-many), post-registration onboarding flow |
| AUTH-08 | User can hold multiple roles and switch between them | `active_role` column on profiles + role switcher component, RLS policies scoped to active role |
| AUTH-09 | Role-specific dashboard shell loads based on active role | Route group `dashboard/[role]/` with layout per role, middleware validates role access |
| AUTH-10 | User verification levels enforced (basic, standard, enhanced, professional) | Enum type + computed verification level based on completed steps |
| AUTH-11 | Provider verification pipeline (email, phone, ID, insurance, qualifications, admin review) | `provider_verifications` table with stage tracking, admin review gate |
| AUTH-12 | GDPR consent captured at signup with granular options | `consent_records` table, consent form at registration with marketing/analytics/third-party toggles |
| AUTH-13 | User can export their data in JSON format | Server action that queries all user-related tables, returns JSON download |
| AUTH-14 | User can request account deletion with automated data purge | Soft delete + 30-day grace period, scheduled purge via Supabase Edge Function or cron |
| AUTH-15 | Complete audit trail for consent changes | `consent_audit_log` table with trigger on consent_records changes |
| AUTH-16 | CSP Level 3 headers and security hardening | Nonce-based CSP in middleware, security headers (X-Frame-Options, HSTS, etc.) |
| AUTH-17 | RBAC middleware for route protection | Next.js middleware using `supabase.auth.getUser()` + role checks from profile |
| AUTH-18 | Public pages (home, about, terms, privacy policy) | Static/ISR pages in `(main)` route group, no auth required |
| AUTH-19 | Responsive layout shell with navigation | Root layout with header/nav, role-aware sidebar for dashboard, Britestate design system |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.98.0 | Supabase client (auth, DB, storage) | Official client, required for all Supabase operations |
| `@supabase/ssr` | ^0.9.0 | Server-side Supabase client with cookie handling | Official SSR package, replaces deprecated auth-helpers |
| `zod` | ^3.23 | Schema validation (forms, API, env vars) | TypeScript-first, shared client/server schemas |
| `react-hook-form` | ^7.54 | Form state management | Lightweight, uncontrolled inputs, minimal re-renders |
| `@hookform/resolvers` | ^3.9 | Zod resolver for react-hook-form | Bridges Zod schemas to RHF validation |
| `@t3-oss/env-nextjs` | ^0.11 | Type-safe environment variables | Build-time validation, prevents runtime env errors |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.468 | Icons | All UI icons per style guide |
| `class-variance-authority` | ^0.7 | Component variant management | Button variants, badge variants |
| `clsx` + `tailwind-merge` | latest | Class name merging | All Shadcn components use `cn()` utility |
| `next-themes` | ^0.4 | Theme management (dark mode) | If dark mode is needed (style guide mentions `prefers-color-scheme`) |

### Shadcn UI Components (installed via CLI, not npm)
Components needed for Phase 1: `button`, `input`, `label`, `card`, `alert`, `dialog`, `dropdown-menu`, `separator`, `checkbox`, `radio-group`, `select`, `toast`, `sonner`, `tabs`, `badge`, `avatar`, `sheet` (mobile nav), `form` (RHF integration).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form | Conform (server-first) | RHF has larger ecosystem, better Shadcn integration |
| @t3-oss/env-nextjs | Manual Zod validation | T3 provides build-time checking + auto env typing |
| lucide-react | heroicons | Style guide mandates Lucide |

**Installation:**
```bash
cd britv3.0
pnpm add @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers @t3-oss/env-nextjs lucide-react class-variance-authority clsx tailwind-merge
```

Shadcn init + component installation:
```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card alert dialog dropdown-menu separator checkbox radio-group select toast tabs badge avatar sheet form sonner
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)
```
britv3.0/src/
├── app/
│   ├── (auth)/                    # Auth route group (no nav)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── register/role-select/page.tsx
│   │   ├── register/onboarding/[role]/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── layout.tsx             # Centered card layout
│   ├── (main)/                    # Public pages
│   │   ├── page.tsx               # Home
│   │   ├── about/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── layout.tsx             # Public nav + footer
│   ├── (protected)/               # Authenticated routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Redirects to role-specific dashboard
│   │   │   ├── [role]/
│   │   │   │   ├── page.tsx       # Role dashboard shell
│   │   │   │   └── layout.tsx     # Role sidebar
│   │   │   └── layout.tsx         # Dashboard wrapper
│   │   ├── settings/
│   │   │   ├── privacy/page.tsx   # GDPR consent management
│   │   │   ├── security/page.tsx  # Password, 2FA (future)
│   │   │   └── layout.tsx
│   │   └── layout.tsx             # Auth guard layout
│   ├── auth/
│   │   └── callback/route.ts      # PKCE code exchange
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...supabase]/route.ts  # Auth webhook handler (optional)
│   │   └── gdpr/
│   │       ├── export/route.ts    # Data export endpoint
│   │       └── delete/route.ts    # Account deletion request
│   ├── error.tsx                  # Global error boundary
│   ├── not-found.tsx              # 404 page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Britestate design tokens
├── components/
│   ├── ui/                        # Shadcn components (generated)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── RoleSelector.tsx
│   │   ├── PasswordStrengthMeter.tsx
│   │   ├── OAuthButtons.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── gdpr/
│   │   ├── ConsentForm.tsx        # Granular consent toggles
│   │   ├── ConsentBanner.tsx      # Cookie/consent banner
│   │   └── DataExportButton.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   └── RoleSwitcher.tsx
│   └── shared/
│       ├── Logo.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useAuth.ts                 # Auth state + operations
│   ├── useRole.ts                 # Active role + switching
│   └── useConsent.ts              # GDPR consent state
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client factory
│   │   ├── server.ts              # Server client factory
│   │   └── admin.ts               # Service role client (server only)
│   ├── utils.ts                   # cn() utility
│   └── constants.ts               # Role definitions, verification levels
├── services/
│   ├── auth/
│   │   ├── auth-service.ts        # Auth business logic
│   │   └── verification-service.ts # Provider verification pipeline
│   └── gdpr/
│       ├── consent-service.ts     # Consent CRUD
│       └── export-service.ts      # Data export logic
├── types/
│   ├── auth.ts                    # User, Role, VerificationLevel types
│   ├── gdpr.ts                    # Consent, AuditLog types
│   └── database.ts                # Supabase generated types
├── middleware.ts                   # Auth + RBAC + CSP headers
└── env.ts                         # Type-safe env validation
```

### Pattern 1: Supabase Auth with PKCE Flow
**What:** All auth flows use PKCE (Proof Key for Code Exchange) via `@supabase/ssr` cookie-based sessions.
**When to use:** All server-side auth operations (middleware, server components, route handlers).
**Example:**
```typescript
// app/auth/callback/route.ts - PKCE code exchange
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
```

### Pattern 2: Multi-Role User Model
**What:** Users can hold multiple roles simultaneously with one active role at a time.
**When to use:** Core user model -- affects all authenticated routes.
**Example:**
```typescript
// types/auth.ts
export type UserRole = "homebuyer" | "renter" | "seller" | "landlord" | "agent" | "service_provider";
export type VerificationLevel = "basic" | "standard" | "enhanced" | "professional";

// Database schema: user_roles junction table (NOT single role column)
// profiles table has active_role column for current context
// user_roles table maps user_id -> role for multi-role support
```

### Pattern 3: Server Client Creation (Next.js 16 compatible)
**What:** Async cookie access for server-side Supabase client.
**When to use:** All Server Components, Server Actions, Route Handlers.
**Example:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component -- cannot set cookies
          }
        },
      },
    }
  );
}
```

### Pattern 4: GDPR Consent with Audit Trail
**What:** Granular consent capture at signup, changes tracked in audit log via database triggers.
**When to use:** Registration flow, settings/privacy page, any consent-modifying operation.
**Example:**
```sql
-- consent_records table
CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'third_party'
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger captures every change automatically
CREATE TABLE public.consent_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

### Anti-Patterns to Avoid
- **Single role column on profiles:** The spec shows `user_role` as a single enum column, but AUTH-07/AUTH-08 require multi-role. Use a junction table (`user_roles`) instead, with `active_role` on profiles for the current context.
- **Using `getSession()` in server code:** Always use `getUser()` (or `getClaims()` for performance-sensitive middleware). `getSession()` does not revalidate the JWT.
- **Client-side role checks only:** All role authorization must be enforced server-side via middleware AND RLS policies. Client-side checks are UX-only.
- **Storing OAuth verifiers in localStorage:** Use httpOnly cookies for PKCE verifiers, never localStorage (XSS vulnerability).
- **Duplicating auth.users data:** Profile table should reference `auth.users(id)` via foreign key, not duplicate email/password fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt/argon2 | Supabase Auth (GoTrue) | Battle-tested, handles salt, timing attacks |
| JWT management | Custom JWT signing/verification | `@supabase/ssr` cookie-based sessions | Handles refresh, rotation, PKCE automatically |
| OAuth flow | Custom OAuth state machine | Supabase `signInWithOAuth` | Handles PKCE, state validation, token exchange |
| Email verification | Custom email + token system | Supabase Auth email confirmation | Built-in templates, rate limiting, token expiry |
| Password reset | Custom reset token flow | Supabase `resetPasswordForEmail` | Secure token generation, expiry, one-time use |
| Form validation | Custom validation functions | Zod schemas shared client/server | Type inference, composable, reusable |
| CSP nonce generation | Custom crypto | `crypto.randomUUID()` in middleware | Built into Node.js runtime, cryptographically secure |
| Component styling | Custom CSS/styled-components | Shadcn UI + Tailwind + CVA | Accessible, composable, matches design system |

**Key insight:** Supabase Auth handles 80% of the authentication complexity (password hashing, JWT management, OAuth flows, email verification, password reset). The custom work is in multi-role management, GDPR consent, and connecting it all with the UI.

## Common Pitfalls

### Pitfall 1: Multi-Role vs Single-Role Schema Mismatch
**What goes wrong:** Epic 1 spec uses a single `user_role` enum column, but requirements AUTH-07/AUTH-08 demand multi-role support.
**Why it happens:** The spec was written assuming one active role, but the requirements specify users can hold and switch between multiple roles.
**How to avoid:** Use a `user_roles` junction table (user_id + role) with an `active_role` column on profiles. The junction table holds all granted roles; `active_role` determines current context.
**Warning signs:** If you see a single `user_role` column on profiles without a separate roles table.

### Pitfall 2: Supabase Cookie Handling in Next.js 16
**What goes wrong:** `cookies()` is now async in Next.js 15+/16. Old examples call it synchronously and fail.
**Why it happens:** The Epic 1 spec was written for Next.js 14 where `cookies()` was synchronous.
**How to avoid:** Always `await cookies()` in server clients. Use the `getAll()`/`setAll()` pattern from the latest `@supabase/ssr` docs, not the older `get()`/`set()`/`remove()` pattern.
**Warning signs:** "cookies() should be awaited" build errors; auth sessions not persisting.

### Pitfall 3: RLS Policy Performance
**What goes wrong:** Complex RLS policies with subqueries cause slow queries (100ms+ per row check).
**Why it happens:** RLS policies execute per-row. If the policy does a subquery (e.g., checking user_roles table), it runs for every row in the result set.
**How to avoid:** Use `auth.jwt() ->> 'role'` claims where possible (fastest), or create indexes on all columns referenced in RLS policies. For multi-role, store role IDs in JWT custom claims via a Supabase hook.
**Warning signs:** Dashboard queries taking >500ms; increasing latency as data grows.

### Pitfall 4: CSP Breaking Supabase Auth / OAuth Popups
**What goes wrong:** Strict CSP blocks Supabase JS client, Google/Apple OAuth redirects, or inline styles from Shadcn.
**Why it happens:** CSP nonce-based policies require allowlisting all external domains and using nonces for inline scripts/styles.
**How to avoid:** Allowlist `*.supabase.co` in `connect-src`, `accounts.google.com` and `appleid.apple.com` in `frame-src` and `script-src`. Use nonces for inline scripts via middleware.
**Warning signs:** Console errors about CSP violations; OAuth popups/redirects failing silently.

### Pitfall 5: Forgotten GDPR Audit Trail on Direct DB Updates
**What goes wrong:** Consent changes made via API but not captured in audit log.
**Why it happens:** Audit logging implemented in application code instead of database triggers.
**How to avoid:** Use PostgreSQL triggers on `consent_records` that automatically insert into `consent_audit_log` on any INSERT/UPDATE/DELETE. This guarantees no consent change can bypass the audit trail.
**Warning signs:** Audit log has gaps; consent changes via admin don't appear in log.

### Pitfall 6: Tailwind v4 Configuration Differences
**What goes wrong:** Trying to configure Tailwind v4 like v3 (tailwind.config.ts with `theme.extend`).
**Why it happens:** Tailwind v4 uses CSS-first configuration, not JavaScript config files.
**How to avoid:** Define custom colors, fonts, and design tokens as CSS custom properties in `globals.css` using `@theme` directive. Shadcn UI components already use CSS variables.
**Warning signs:** Custom colors/fonts not working; `tailwind.config.ts` changes having no effect.

## Code Examples

### Middleware with Auth + RBAC + CSP
```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/about", "/terms", "/privacy"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser(), not getSession()
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users from protected routes
  if (!user && !PUBLIC_ROUTES.includes(pathname) && !AUTH_ROUTES.some(r => pathname.startsWith(r)) && !pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth routes
  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // CSP with nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://appleid.cdn-apple.com`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind requires unsafe-inline
    `img-src 'self' data: blob: https://*.supabase.co`,
    `connect-src 'self' https://*.supabase.co`,
    `frame-src https://accounts.google.com https://appleid.apple.com`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");

  supabaseResponse.headers.set("Content-Security-Policy", csp);
  supabaseResponse.headers.set("x-nonce", nonce);
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Database Schema: Multi-Role with GDPR
```sql
-- supabase/migrations/001_foundation.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM (
  'homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider'
);

CREATE TYPE verification_level AS ENUM (
  'basic', 'standard', 'enhanced', 'professional'
);

CREATE TYPE verification_stage AS ENUM (
  'email', 'phone', 'identity', 'insurance', 'qualifications', 'admin_review'
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  active_role user_role NOT NULL DEFAULT 'homebuyer',
  verification_level verification_level NOT NULL DEFAULT 'basic',
  avatar_url TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for GDPR
);

-- Multi-role junction table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Provider verification pipeline
CREATE TABLE public.provider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage verification_stage NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  document_url TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stage)
);

-- GDPR consent records
CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'third_party')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- GDPR consent audit log (immutable)
CREATE TABLE public.consent_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auth event audit log
CREATE TABLE public.auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deletion requests (GDPR Art. 17)
CREATE TABLE public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_purge_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  purged_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_profiles_active_role ON profiles(active_role) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_audit_user_id ON consent_audit_log(user_id, created_at DESC);
CREATE INDEX idx_auth_audit_user_id ON auth_audit_log(user_id, created_at DESC);
CREATE INDEX idx_provider_verifications_user ON provider_verifications(user_id);
CREATE INDEX idx_provider_verifications_status ON provider_verifications(status) WHERE status = 'pending';

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER consent_records_updated_at BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.auth_audit_log (user_id, event_type, event_details)
  VALUES (NEW.id, 'registration', jsonb_build_object('provider', NEW.raw_app_meta_data->>'provider'));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Consent audit trigger
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.consent_audit_log (user_id, consent_type, old_value, new_value, ip_address, user_agent)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.consent_type, OLD.consent_type),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.granted END,
    NEW.granted,
    NEW.ip_address,
    NEW.user_agent
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER consent_change_audit
  AFTER INSERT OR UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION log_consent_change();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id AND deleted_at IS NULL);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User roles: Users can read own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Consent: Users can read/update own consent
CREATE POLICY "Users can view own consent" ON consent_records
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own consent" ON consent_records
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own consent" ON consent_records
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Consent audit: Users can view own audit trail
CREATE POLICY "Users can view own consent audit" ON consent_audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Auth audit: Users can view own events
CREATE POLICY "Users can view own auth audit" ON auth_audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Provider verifications: Users can view/manage own
CREATE POLICY "Users can view own verifications" ON provider_verifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own verifications" ON provider_verifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

### Britestate Design System Setup (globals.css for Tailwind v4)
```css
/* src/app/globals.css */
@import "tailwindcss";

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

@theme {
  /* Brand Colors */
  --color-brand-primary: #1B4D3E;
  --color-brand-primary-light: #2D7A5F;
  --color-brand-primary-lighter: #E8F5EE;
  --color-brand-secondary: #D4A853;
  --color-brand-secondary-light: #F5ECD7;
  --color-brand-accent: #2563EB;
  --color-brand-accent-light: #EFF6FF;

  /* Semantic Colors */
  --color-success: #16A34A;
  --color-success-light: #DCFCE7;
  --color-warning: #CA8A04;
  --color-warning-light: #FEF9C3;
  --color-error: #DC2626;
  --color-error-light: #FEE2E2;
  --color-info: #2563EB;
  --color-info-light: #DBEAFE;

  /* Fonts */
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Unified API, better cookie handling |
| `cookies()` synchronous | `await cookies()` async | Next.js 15 | All server client code must await |
| `getSession()` for auth checks | `getUser()` or `getClaims()` | 2025 | `getSession` not safe server-side |
| `get()`/`set()`/`remove()` cookies | `getAll()`/`setAll()` cookies | `@supabase/ssr` 0.5+ | Simpler, handles chunked cookies |
| Tailwind v3 JS config | Tailwind v4 CSS-first config | 2025 | `@theme` in CSS, no `tailwind.config.ts` |
| `shadcn-ui@latest init` | `shadcn@latest init` | 2024 | Package renamed from shadcn-ui to shadcn |
| `anon` key naming | `publishable` key naming | 2025-2026 | Supabase transitioning key format; both work |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Fully deprecated, use `@supabase/ssr`
- `getSession()` for server-side auth: Not safe, use `getUser()` or `getClaims()`
- Tailwind `tailwind.config.ts` theme extension: Tailwind v4 uses CSS `@theme` directive
- `npx shadcn-ui@latest init`: Use `npx shadcn@latest init` (or `pnpm dlx shadcn@latest init`)

## Open Questions

1. **Supabase `getClaims()` vs `getUser()` in middleware**
   - What we know: `getClaims()` validates JWT locally (fast, no network call). `getUser()` hits Supabase Auth server (slower, but detects revoked sessions).
   - What's unclear: Whether `getClaims()` is stable/recommended for production middleware in `@supabase/ssr` 0.9.0 -- documentation is still transitioning.
   - Recommendation: Use `getUser()` in middleware for now (proven safe), consider `getClaims()` if latency becomes an issue. Monitor Supabase docs for stable recommendation.

2. **Custom JWT claims for roles**
   - What we know: Supabase supports custom claims via PostgreSQL functions + Auth hooks. Embedding roles in JWT avoids per-request DB lookups in RLS policies.
   - What's unclear: Whether the Supabase Auth hook for custom claims is production-stable and how it interacts with role switching (JWT refresh needed on role switch).
   - Recommendation: Start with DB lookups in RLS policies (simpler), optimize to JWT claims if performance profiling shows need.

3. **Apple OAuth Developer Account Setup**
   - What we know: Requires Apple Developer Program membership ($99/year), Service ID, private key, and domain verification.
   - What's unclear: Whether the Britestate Apple Developer account is already set up.
   - Recommendation: Implement Google OAuth first (simpler setup), add Apple OAuth as a follow-up within Phase 1. Both use the same Supabase `signInWithOAuth` pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `vitest.config.mts` -- needs creation in Wave 0 |
| Quick run command | `pnpm test --run` |
| Full suite command | `pnpm test --run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email/password signup creates account | integration | `pnpm test src/__tests__/auth/signup.test.ts -t "signup"` | No -- Wave 0 |
| AUTH-02 | Email verification flow | integration | `pnpm test src/__tests__/auth/verify-email.test.ts` | No -- Wave 0 |
| AUTH-03 | Google OAuth initiates correctly | unit | `pnpm test src/__tests__/auth/oauth.test.ts -t "google"` | No -- Wave 0 |
| AUTH-04 | Apple OAuth initiates correctly | unit | `pnpm test src/__tests__/auth/oauth.test.ts -t "apple"` | No -- Wave 0 |
| AUTH-05 | Password reset flow | integration | `pnpm test src/__tests__/auth/password-reset.test.ts` | No -- Wave 0 |
| AUTH-06 | Session persists across refresh | integration | `pnpm test src/__tests__/auth/session.test.ts` | No -- Wave 0 |
| AUTH-07 | Role selection at registration | unit | `pnpm test src/__tests__/auth/role-select.test.ts` | No -- Wave 0 |
| AUTH-08 | Multi-role switching | unit | `pnpm test src/__tests__/auth/role-switch.test.ts` | No -- Wave 0 |
| AUTH-09 | Dashboard shell loads per role | unit | `pnpm test src/__tests__/dashboard/shell.test.ts` | No -- Wave 0 |
| AUTH-10 | Verification levels enforced | unit | `pnpm test src/__tests__/auth/verification-levels.test.ts` | No -- Wave 0 |
| AUTH-11 | Provider verification pipeline | integration | `pnpm test src/__tests__/auth/provider-verification.test.ts` | No -- Wave 0 |
| AUTH-12 | GDPR consent at signup | unit | `pnpm test src/__tests__/gdpr/consent.test.ts` | No -- Wave 0 |
| AUTH-13 | Data export JSON | integration | `pnpm test src/__tests__/gdpr/export.test.ts` | No -- Wave 0 |
| AUTH-14 | Account deletion request | integration | `pnpm test src/__tests__/gdpr/deletion.test.ts` | No -- Wave 0 |
| AUTH-15 | Consent audit trail | unit | `pnpm test src/__tests__/gdpr/audit.test.ts` | No -- Wave 0 |
| AUTH-16 | CSP headers present | unit | `pnpm test src/__tests__/security/csp.test.ts` | No -- Wave 0 |
| AUTH-17 | RBAC middleware redirects | unit | `pnpm test src/__tests__/security/middleware.test.ts` | No -- Wave 0 |
| AUTH-18 | Public pages render | unit | `pnpm test src/__tests__/pages/public.test.ts` | No -- Wave 0 |
| AUTH-19 | Layout shell renders with nav | unit | `pnpm test src/__tests__/layout/shell.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test --run` (quick, affected tests only)
- **Per wave merge:** `pnpm test --run --coverage`
- **Phase gate:** Full suite green + `pnpm build` + `pnpm lint` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.mts` -- Vitest configuration with React plugin and path aliases
- [ ] `britv3.0/package.json` -- Add vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/dom, @testing-library/jest-dom, happy-dom, vite-tsconfig-paths as devDependencies
- [ ] `src/__tests__/setup.ts` -- Test setup file (testing-library cleanup, custom matchers)
- [ ] `src/__tests__/mocks/supabase.ts` -- Supabase client mock for unit tests
- [ ] `src/__tests__/mocks/next.ts` -- Next.js navigation/headers mocks

## Sources

### Primary (HIGH confidence)
- [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Server-side auth setup for Next.js
- [Supabase PKCE flow docs](https://supabase.com/docs/guides/auth/sessions/pkce-flow) -- PKCE flow details
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Row Level Security patterns
- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) -- Content Security Policy with nonces
- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest) -- Official Vitest setup
- [shadcn/ui installation](https://ui.shadcn.com/docs/installation/next) -- Next.js installation guide
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) -- v0.9.0 (published March 2026)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- v2.98.0

### Secondary (MEDIUM confidence)
- [Supabase getClaims() reference](https://supabase.com/docs/reference/javascript/auth-getclaims) -- New JWT claim validation method
- [Supabase custom claims RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) -- Custom JWT claims pattern
- Epic 1 spec (`docs/claude epic 1 review.txt`) -- Detailed schema, middleware, and security patterns (adapted for current stack versions)

### Tertiary (LOW confidence)
- Epic 1 spec performance projections (bundle sizes, query timings) -- based on Next.js 14, may differ for Next.js 16
- `getClaims()` stability -- documentation still in transition, method relatively new

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm, official docs confirm compatibility
- Architecture: HIGH -- patterns from official Supabase + Next.js docs, adapted for project requirements
- Pitfalls: HIGH -- identified from official migration guides, known breaking changes, and spec analysis
- GDPR/Consent schema: MEDIUM -- follows standard patterns but specific audit trigger approach should be validated
- Test infrastructure: MEDIUM -- Vitest setup is well-documented but no existing tests to validate against

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable libraries, Next.js 16 established)
