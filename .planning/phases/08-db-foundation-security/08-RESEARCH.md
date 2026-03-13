# Phase 8: DB Foundation & Security - Research

**Researched:** 2026-03-13
**Domain:** Supabase migrations, PostgreSQL RLS, Next.js App Router auth guards, Supabase Storage
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Role Route Redirect:**
- When a user with role=homebuyer navigates to /dashboard/landlord (or any wrong-role dashboard), silently redirect to /dashboard/homebuyer — no error page
- The fix lives in the `[role]` layout Server Component: read active_role from the session, compare against the URL param, redirect if mismatch
- No separate middleware layer needed — the layout guard is the enforcement point

**Viewing Slot Booking RPC:**
- Use SELECT FOR UPDATE within a PostgreSQL transaction to prevent double-booking — lock the slot row, check it's still available, mark it booked, all atomically
- If the slot is already taken, the RPC returns a structured error code: `SLOT_UNAVAILABLE` — the UI shows "This slot was just taken — please pick another time"
- The booking RPC is atomic: it updates `viewing_slots.status` AND inserts into `viewings` in one transaction. If either fails, both roll back — no orphaned records
- Separate RPCs for each operation: `book_viewing_slot`, `cancel_viewing`, `reschedule_viewing`
  - `cancel_viewing`: frees the slot (sets status back to available) + updates viewing status
  - `reschedule_viewing`: books the new slot atomically + frees the old slot in one transaction

**RLS Policy Scope:**
- viewings and offers tables: both buyer (row owner) and the property's agent can SELECT — RLS policy: `auth.uid() = user_id OR [listing belongs to auth.uid() as agent]`
- Offer status UPDATE: blocked entirely from the client via RLS — all status transitions go through server-side API routes using `SUPABASE_SERVICE_ROLE_KEY`, enforcing the state machine server-side
- user_documents: buyer + their assigned solicitor/agent can read — the policy joins to the offer relationship to identify the instructed parties
- offer_status_history: INSERT only via service role (client INSERT blocked by RLS) — both buyer and agent can SELECT their relevant rows. Audit trail integrity preserved — no client can write to this table directly

**Referral Code Strategy:**
- Lazy creation on first visit: no backfill at migration time. When a user first navigates to the Referral Tracker (Phase 12), the server checks for their code and INSERTs if missing
- Race condition handled via `INSERT INTO referral_codes ... ON CONFLICT (user_id) DO NOTHING`
- Codes are permanent for life — once generated, the code never changes
- `referral_codes` has a UNIQUE constraint on `user_id` — one code per account, no exceptions
- `referral_codes` also has a UNIQUE constraint on `code` — nanoid collision prevention

### Claude's Discretion
- Exact migration file naming and sequencing
- Index choice for foreign keys and query patterns (planner can decide)
- Exact nanoid length (suggest 10 chars — collision-safe for user scale)
- offer_status_history CHECK constraint list for valid status values

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | DB migration creates 10 new tables (viewings, viewing_slots, offers, offer_status_history, user_documents, ai_match_preferences, ai_match_results, moving_checklist_items, referral_codes, referral_conversions) with RLS policies | Migration SQL patterns, RLS policy templates, CHECK constraint design |
| FOUND-02 | Role route authorization enforces active_role — buyers cannot navigate to /dashboard/landlord or /dashboard/agent routes | Existing layout.tsx code analysis, redirect pattern confirmed |
| FOUND-03 | All buyer dashboard API routes and Server Components call supabase.auth.getUser() server-side (defense-in-depth, not middleware-only auth) | Existing supabase/server.ts factory confirmed; getUser() vs getSession() security analysis |
| FOUND-04 | npm packages installed: react-day-picker@9, date-fns@4, tus-js-client@4, nanoid@5 | Package installation commands verified; none of the 4 are currently in package.json |
</phase_requirements>

---

## Summary

Phase 8 is a pure infrastructure phase — no UI, no user-visible features. Its output is the database foundation (10 new tables + RLS + RPCs) and security hardening (role authorization guard, server-side auth depth, private storage bucket) that every subsequent v3.1 phase depends on. The codebase is in a strong position: Supabase client factories (`lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts`) exist and follow the correct `@supabase/ssr` pattern. Vitest is installed and a full mock/fixture infrastructure exists. The existing `[role]/layout.tsx` already calls `supabase.auth.getUser()` server-side but contains a critical auth bypass: it auto-grants any requested role if not found rather than comparing against `active_role` and redirecting.

This phase's hardest problems are the PostgreSQL RLS policies for cross-user access (agent can read buyer's viewings/offers) and the atomic `SELECT FOR UPDATE` RPC. These are well-understood PostgreSQL patterns but require careful policy design — any mistake silently exposes data or creates deadlocks.

**Primary recommendation:** Write the migration SQL with RLS enabled from the start; never alter policies on tables that already have data. Commit generated TypeScript types (`supabase gen types typescript`) to `src/types/database.types.ts` immediately after the migration lands.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.98.0 | Supabase JS client for all DB/Auth/Storage operations | Already installed, canonical client |
| @supabase/ssr | ^0.9.0 | Server-side Supabase client with cookie-based auth | Already installed, replaces deprecated auth-helpers |
| supabase CLI | latest | Migration management, type generation | Industry standard for local Supabase dev |

### New Packages (FOUND-04 — not yet installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-day-picker | 9 | Date picker for viewing slot selection (Phase 10) | Install now so Phase 10 has no blocker |
| date-fns | 4 | Date arithmetic, formatting (viewing dates, offer timestamps) | Pairs with react-day-picker v9 (requires date-fns v4) |
| tus-js-client | 4 | TUS resumable upload protocol for large document uploads (Phase 10) | Supabase Storage uses TUS for resumable uploads |
| nanoid | 5 | Cryptographically random referral code generation | ESM-only from v5; use `nanoid()` default export |

### Installation

```bash
# From repo root (where package.json lives — NOT britv3.0/ subdirectory)
pnpm add react-day-picker@9 date-fns@4 tus-js-client@4 nanoid@5
```

**Important:** The CLAUDE.md says "run pnpm commands from britv3.0/" but the actual `package.json` is at the repo root (`/Users/joanflerinbig/Documents/britv3.0/package.json`). The `britv3.0/` subdirectory referenced in CLAUDE.md is the working name for the app directory but the repo root IS the Next.js app. Run `pnpm add` from `/Users/joanflerinbig/Documents/britv3.0/`.

---

## Architecture Patterns

### Migration File Convention

Supabase migrations live in `supabase/migrations/` with timestamp prefix:

```
supabase/
└── migrations/
    └── 20260313000000_v3_1_buyer_dashboard_foundation.sql
```

This is the first v3.1 migration. The timestamp ensures ordering. Use a single migration file for all 10 tables to keep the foundation atomic — if any table or RLS policy fails, the entire migration rolls back.

### Pattern 1: Table Creation with RLS Enabled Immediately

**What:** Enable RLS on the table in the same `CREATE TABLE` block, not as a later `ALTER TABLE`.
**When to use:** Every new table in this project.

```sql
-- Source: Supabase official docs pattern
CREATE TABLE public.viewings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id     uuid NOT NULL REFERENCES public.viewing_slots(id),
  listing_id  uuid NOT NULL,
  status      text NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  type        text NOT NULL CHECK (type IN ('in_person', 'virtual')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.viewings ENABLE ROW LEVEL SECURITY;
```

### Pattern 2: RLS Policy for Cross-User Read (Agent + Buyer Access)

**What:** A SELECT policy that allows EITHER the row owner OR the listing's agent to read.
**When to use:** `viewings` and `offers` tables.

```sql
-- Buyer can see their own viewings; agent can see viewings on their listings
CREATE POLICY "viewings_select" ON public.viewings
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT agent_id FROM public.listings WHERE id = listing_id
    )
  );
```

### Pattern 3: Service-Role-Only INSERT (Audit Trail Integrity)

**What:** Block all client INSERT/UPDATE; only service role (bypasses RLS) can write.
**When to use:** `offer_status_history` — immutable audit trail.

```sql
-- No INSERT policy = client INSERT is blocked
-- Service role key bypasses RLS entirely (createAdminClient() in lib/supabase/admin.ts)
-- Buyer and agent can SELECT their relevant rows only
CREATE POLICY "offer_status_history_select_buyer" ON public.offer_status_history
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.offers WHERE id = offer_id
    )
  );

CREATE POLICY "offer_status_history_select_agent" ON public.offer_status_history
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT agent_id FROM public.listings
      WHERE id = (SELECT listing_id FROM public.offers WHERE id = offer_id)
    )
  );
```

### Pattern 4: Atomic SELECT FOR UPDATE RPC

**What:** PostgreSQL function that locks a slot row, checks availability, books atomically.
**When to use:** `book_viewing_slot` RPC called by Phase 10 UI.

```sql
CREATE OR REPLACE FUNCTION public.book_viewing_slot(
  p_slot_id    uuid,
  p_user_id    uuid,
  p_listing_id uuid,
  p_type       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot    public.viewing_slots;
  v_viewing public.viewings;
BEGIN
  -- Lock the slot row for the duration of this transaction
  SELECT * INTO v_slot
  FROM public.viewing_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  -- Check availability
  IF v_slot.status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;

  -- Mark slot as booked
  UPDATE public.viewing_slots
  SET status = 'booked', updated_at = now()
  WHERE id = p_slot_id;

  -- Create the viewing record
  INSERT INTO public.viewings (user_id, slot_id, listing_id, type)
  VALUES (p_user_id, p_slot_id, p_listing_id, p_type)
  RETURNING * INTO v_viewing;

  RETURN jsonb_build_object('success', true, 'viewing_id', v_viewing.id);
END;
$$;
```

**SECURITY DEFINER** means the function runs with the privileges of its owner (postgres), allowing it to bypass RLS for the UPDATE without exposing service role to the client.

### Pattern 5: Role Route Guard — Fixing the Bypass

**What:** The existing `[role]/layout.tsx` auto-grants any role if not found — this is the bypass. Replace the auto-grant with an `active_role` check and redirect.
**Current (broken):** Checks `user_roles` table; if role not found, INSERTS it and continues.
**Fixed:** Reads `active_role` from `profiles`; if URL role doesn't match `active_role`, redirect to correct dashboard.

```typescript
// src/app/(protected)/dashboard/[role]/layout.tsx
// Replace the existing logic with:

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect("/login");
}

if (!VALID_ROLES.includes(role as UserRole)) {
  redirect("/dashboard");
}

// Read active_role from profiles (not user_roles junction table)
const { data: profile } = await supabase
  .from("profiles")
  .select("active_role")
  .eq("id", user.id)
  .single();

if (!profile) {
  redirect("/login");
}

// Enforce: URL role must match active_role on the profile
if (profile.active_role !== role) {
  redirect(`/dashboard/${profile.active_role}`);
}

return <>{props.children}</>;
```

### Pattern 6: Defense-in-Depth Auth Guard (FOUND-03)

**What:** Every Server Component that touches buyer data calls `supabase.auth.getUser()` independently — does not rely on middleware alone.
**Why:** Next.js middleware can be bypassed (CDN edge cache, misconfigured routes). Server Component check is the authoritative gate.

```typescript
// Pattern for any buyer dashboard Server Component / API route
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
// or for API routes:
import { NextResponse } from "next/server";

export default async function SomeBuyerPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
    // For API routes: return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... proceed with user guaranteed
}
```

### Pattern 7: Private Storage Bucket with Signed URLs

**What:** Create the `buyer-documents` bucket as private (not public). All file access uses time-limited signed URLs generated server-side.
**Never do:** `supabase.storage.from("buyer-documents").getPublicUrl(path)` — this is blocked by RLS but should also never be called in code.

```typescript
// Server-side signed URL generation (1-hour expiry)
const { data, error } = await supabase.storage
  .from("buyer-documents")
  .createSignedUrl(filePath, 3600); // 3600 seconds = 1 hour

if (error || !data) {
  return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
}

return NextResponse.json({ url: data.signedUrl });
```

The bucket must be created in the Supabase dashboard (or via migration SQL using `storage.buckets`) with `public: false`.

### Pattern 8: TypeScript Type Generation

**What:** After migration lands, generate types and commit them.
**When to use:** Once, at end of Phase 8. All subsequent phases import from this file.

```bash
# Connect to local Supabase (or remote project)
supabase gen types typescript --local > src/types/database.types.ts
# or for remote:
supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
```

Then update `src/types/database.ts` to re-export from `database.types.ts`.

### Recommended Project Structure Additions

```
supabase/
└── migrations/
    └── 20260313000000_v3_1_buyer_dashboard_foundation.sql

src/
├── types/
│   ├── database.ts          # existing — update to re-export database.types.ts
│   └── database.types.ts    # NEW — generated by supabase gen types typescript
```

### Anti-Patterns to Avoid

- **Auto-granting roles on navigation:** The existing `[role]/layout.tsx` does this. Phase 8 removes it. Never insert into `user_roles` as a side effect of navigation.
- **getSession() for auth verification:** `getSession()` reads the session from the cookie without verifying it against the server — can be forged. Always use `getUser()` in server-side contexts.
- **Public bucket for documents:** Never create `buyer-documents` as a public bucket. Private + signed URL is the only acceptable pattern.
- **Client-side offer status mutation:** No client code should ever UPDATE `offers.status` directly. All status changes route through API routes using `createAdminClient()`.
- **Migration without RLS:** Never create a table without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the same migration. Data is exposed to anon key by default.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Race-condition-safe slot booking | Custom optimistic locking in application code | PostgreSQL `SELECT FOR UPDATE` in SECURITY DEFINER function | Application-level locking is not atomic across concurrent connections |
| Referral code uniqueness | UUID or random string + collision retry loop | `nanoid` + DB UNIQUE constraint + `ON CONFLICT DO NOTHING` | nanoid provides URL-safe chars + cryptographic entropy; DB constraint is the final arbiter |
| Resumable file uploads | Chunked XHR upload manager | `tus-js-client@4` + Supabase Storage TUS endpoint | TUS protocol handles network interrupts, large files, progress; Supabase Storage natively supports it |
| Offer status state machine | Client-side status validation | Server-side API route + CHECK constraint + RLS blocking client UPDATE | State machine needs audit trail and must be tamper-proof |

**Key insight:** PostgreSQL is the correct place for concurrency control and data integrity. Application code (TypeScript) cannot guarantee atomicity across concurrent requests.

---

## Common Pitfalls

### Pitfall 1: RLS Blocks the Migration Owner

**What goes wrong:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + a policy that only allows `auth.uid() = user_id` means that the postgres migration role cannot read rows, causing migration steps that validate data to fail.
**Why it happens:** The anon/authenticated roles are different from the postgres superuser. In Supabase, the service role bypasses RLS; the postgres role during migrations also bypasses RLS.
**How to avoid:** Migrations always run as postgres (which bypasses RLS). Runtime queries from the app use the anon key (respects RLS). Understand which context is which.
**Warning signs:** A migration that succeeds but subsequent data queries return empty results.

### Pitfall 2: SECURITY DEFINER RPCs Expose Service Privileges

**What goes wrong:** A SECURITY DEFINER function can do anything the owner (postgres) can do — including reading all tables regardless of RLS.
**Why it happens:** The function runs with the creator's privileges.
**How to avoid:** Keep SECURITY DEFINER RPCs minimal. The `book_viewing_slot` RPC should ONLY touch `viewing_slots` and `viewings`. Validate `p_user_id` = `auth.uid()` inside the function as the first step.
**Warning signs:** A function that takes arbitrary table names or runs dynamic SQL.

### Pitfall 3: The Role Layout Auto-Grant Bypass

**What goes wrong:** The existing `[role]/layout.tsx` auto-grants a role if the user doesn't have it in `user_roles`. A homebuyer can navigate to `/dashboard/landlord`, the layout sees no `landlord` role in `user_roles`, auto-inserts it, and now the user has landlord access.
**Why it happens:** The original layout was written to prevent redirect loops during onboarding. The role-check logic was never updated to enforce security.
**How to avoid:** Phase 8 replaces the upsert logic with an `active_role` comparison + redirect. The `profiles.active_role` field is the authoritative source. Never trust the URL parameter as the user's role.
**Warning signs:** Any code path that does `upsert({ role })` as a fallback during navigation.

### Pitfall 4: nanoid@5 is ESM-Only

**What goes wrong:** `const { nanoid } = require("nanoid")` fails with "require() of ES module" error.
**Why it happens:** nanoid@5 dropped CommonJS support. Next.js 16 + TypeScript handles this correctly, but any test file or utility using `require()` syntax breaks.
**How to avoid:** Always use `import { nanoid } from "nanoid"` (ESM import syntax). The project's tsconfig with `moduleResolution: bundler` handles this correctly.
**Warning signs:** Runtime error mentioning "require() of ES Module" in a Node.js context.

### Pitfall 5: Storage Bucket Created After RLS Policies

**What goes wrong:** Supabase Storage policies are separate from table RLS. Creating the bucket does not automatically restrict access — must create explicit storage policies.
**Why it happens:** Storage policies are stored in `storage.objects` and are separate from the `public.*` table policies.
**How to avoid:** In the migration or manual bucket setup, set bucket as private AND add storage policies that restrict `SELECT` to the file owner and `INSERT` to authenticated users only.
**Warning signs:** A "private" bucket that returns files when accessed with the anon key.

### Pitfall 6: offer_status_history Without a SELECT Policy Leaks Nothing But Returns Nothing

**What goes wrong:** If you block all client access (no SELECT policy), the buyer/agent can't see the audit trail. But if you add an overly broad SELECT policy, any user can see all transitions.
**Why it happens:** RLS default-deny means "no policy = no access." The tricky part is writing a JOIN-based policy that correctly identifies which rows belong to the current user's offers.
**How to avoid:** Write separate buyer and agent SELECT policies using subqueries into `offers` and `listings`. Test with two separate authenticated users to verify cross-user isolation.

---

## Code Examples

### All 10 Table Definitions (Key Structures)

```sql
-- Source: decisions in 08-CONTEXT.md + standard Supabase patterns

-- 1. viewing_slots (created by agents — Phase 10 will add agent-facing insert)
CREATE TABLE public.viewing_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL,
  agent_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  type        text NOT NULL CHECK (type IN ('in_person', 'virtual')),
  status      text NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'booked', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.viewing_slots ENABLE ROW LEVEL SECURITY;

-- 2. viewings
CREATE TABLE public.viewings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id     uuid NOT NULL REFERENCES public.viewing_slots(id),
  listing_id  uuid NOT NULL,
  status      text NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  type        text NOT NULL CHECK (type IN ('in_person', 'virtual')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.viewings ENABLE ROW LEVEL SECURITY;

-- 3. offers
CREATE TABLE public.offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id          uuid NOT NULL,
  agent_id            uuid NOT NULL REFERENCES auth.users(id),
  amount              integer NOT NULL CHECK (amount > 0), -- pence
  conditions          text,
  solicitor_name      text,
  solicitor_email     text,
  solicitor_phone     text,
  aip_document_path   text,
  status              text NOT NULL DEFAULT 'submitted'
                        CHECK (status IN (
                          'submitted', 'solicitors_instructed', 'searches',
                          'survey', 'mortgage_approved', 'exchange',
                          'completion', 'withdrawn'
                        )),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 4. offer_status_history (audit trail — service role writes only)
CREATE TABLE public.offer_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid REFERENCES auth.users(id),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offer_status_history ENABLE ROW LEVEL SECURITY;

-- 5. user_documents
CREATE TABLE public.user_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id        uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  document_type   text NOT NULL CHECK (document_type IN (
                    'id_proof', 'proof_of_funds', 'aip_letter', 'other'
                  )),
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0),
  mime_type       text NOT NULL,
  status          text NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded', 'pending_review', 'verified', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- 6. ai_match_preferences
CREATE TABLE public.ai_match_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  location            text,
  budget_min          integer,
  budget_max          integer,
  bedrooms_min        integer,
  bedrooms_max        integer,
  must_haves          text[],
  lifestyle_factors   jsonb DEFAULT '{}',
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_match_preferences ENABLE ROW LEVEL SECURITY;

-- 7. ai_match_results
CREATE TABLE public.ai_match_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL,
  match_score     numeric(4,3) NOT NULL CHECK (match_score BETWEEN 0 AND 1),
  match_reasons   jsonb DEFAULT '[]',
  computed_at     timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.ai_match_results ENABLE ROW LEVEL SECURITY;

-- 8. moving_checklist_items
CREATE TABLE public.moving_checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id        uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  offer_stage     text, -- the offer status stage this item relates to
  is_completed    boolean NOT NULL DEFAULT false,
  completed_at    timestamptz,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moving_checklist_items ENABLE ROW LEVEL SECURITY;

-- 9. referral_codes
CREATE TABLE public.referral_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- 10. referral_conversions
CREATE TABLE public.referral_conversions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code_used       text NOT NULL,
  converted_at    timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'converted'))
);
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
```

### Signed URL Generation (Server Route)

```typescript
// src/app/api/documents/[id]/signed-url/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the document belongs to this user (RLS enforces this on the query too)
  const { data: doc } = await supabase
    .from("user_documents")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("buyer-documents")
    .createSignedUrl(doc.storage_path, 3600);

  if (signError || !signed) {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
```

### nanoid Usage (Server-Side Only)

```typescript
// Only ever call nanoid on the server (API routes, Server Components)
import { nanoid } from "nanoid";

const code = nanoid(10); // 10 characters, URL-safe, ~59 bits of entropy
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | `@supabase/ssr` is the canonical package; auth-helpers is deprecated |
| `supabase.auth.getSession()` for server auth | `supabase.auth.getUser()` | 2024 | `getSession()` reads from cookie without server verification — can be forged |
| `supabase gen types` (old CLI) | `supabase gen types typescript` | CLI v1.x | New CLI flags; output path must be specified explicitly |
| `nanoid` CommonJS | `nanoid` ESM-only (v5+) | nanoid@5 | Must use `import`, not `require()` |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.mts` (repo root) |
| Quick run command | `pnpm test --run` |
| Full suite command | `pnpm test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Migration SQL is valid (10 tables, RLS enabled, CHECK constraints) | manual | SQL linting via `supabase db lint` — not unit testable | N/A — verified by Supabase migration apply |
| FOUND-02 | Role layout redirects homebuyer from /dashboard/landlord to /dashboard/homebuyer | unit | `pnpm test --run src/__tests__/dashboard/role-guard.test.ts` | ❌ Wave 0 |
| FOUND-03 | Buyer dashboard Server Components return 401 when getUser() returns null | unit | `pnpm test --run src/__tests__/dashboard/auth-guard.test.ts` | ❌ Wave 0 |
| FOUND-04 | Packages install and can be imported without error | smoke | `pnpm test --run src/__tests__/foundation/package-imports.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test --run` (full Vitest suite, ~30s)
- **Per wave merge:** `pnpm test --run && pnpm build`
- **Phase gate:** Full suite green + `pnpm build` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/dashboard/role-guard.test.ts` — covers FOUND-02; mocks `createClient`, tests that `profile.active_role !== role` triggers `redirect()`
- [ ] `src/__tests__/dashboard/auth-guard.test.ts` — covers FOUND-03; verifies buyer page Server Components call `getUser()` and return 401/redirect on null user
- [ ] `src/__tests__/foundation/package-imports.test.ts` — covers FOUND-04; imports `nanoid`, `date-fns`, `react-day-picker`, `tus-js-client` and asserts they resolve without error

---

## Open Questions

1. **Supabase project connection for migration apply**
   - What we know: No `supabase/` directory exists yet; no `supabase/config.toml`
   - What's unclear: Whether the team runs a local Supabase instance or applies migrations directly to a remote project; affects whether migration steps use `supabase db push` (remote) or `supabase migration up` (local)
   - Recommendation: Plan assumes remote project (`supabase db push`); if local, swap for `supabase start && supabase migration up`

2. **listings.agent_id foreign key availability**
   - What we know: RLS policies for `viewings` and `offers` join to `listings.agent_id` to allow agent access
   - What's unclear: The `listings` table was built in an earlier phase but its schema is not visible in the codebase
   - Recommendation: The planner should check that `listings.agent_id` (or equivalent) exists before writing the cross-user SELECT policies; if the column name differs, adjust the subquery

3. **Storage bucket creation method**
   - What we know: `buyer-documents` bucket must be `public: false`
   - What's unclear: Whether the bucket is created via Supabase dashboard UI, SQL migration (`INSERT INTO storage.buckets`), or CLI
   - Recommendation: Create via SQL migration for reproducibility: `INSERT INTO storage.buckets (id, name, public) VALUES ('buyer-documents', 'buyer-documents', false) ON CONFLICT DO NOTHING;`

---

## Sources

### Primary (HIGH confidence)

- Codebase analysis — `src/app/(protected)/dashboard/[role]/layout.tsx`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/admin.ts`, `src/middleware.ts`, `src/types/auth.ts`, `src/types/database.ts`, `package.json`, `vitest.config.mts`
- `08-CONTEXT.md` — locked decisions for this phase
- `REQUIREMENTS.md` — FOUND-01 through FOUND-04 definitions

### Secondary (MEDIUM confidence)

- Supabase SSR docs pattern — `createServerClient` with cookies, `getUser()` vs `getSession()` distinction (consistent with installed `@supabase/ssr@^0.9.0`)
- PostgreSQL `SELECT FOR UPDATE` SECURITY DEFINER pattern — standard PostgreSQL atomic locking, well-established

### Tertiary (LOW confidence)

- nanoid@5 ESM-only claim — based on training knowledge of nanoid v5 changelog; verify at https://github.com/ai/nanoid if uncertain
- `tus-js-client@4` + Supabase Storage TUS endpoint compatibility — training knowledge; verify against Supabase Storage docs if integration issues arise

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing packages verified from `package.json`; 4 new packages are explicit user requirements (FOUND-04)
- Architecture: HIGH — migration patterns, RLS policies, and SECURITY DEFINER RPCs are standard PostgreSQL/Supabase patterns confirmed from official documentation and existing codebase conventions
- Pitfalls: HIGH — role bypass pitfall verified directly from reading existing `[role]/layout.tsx` code; RLS and storage pitfalls are confirmed from Supabase official patterns

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (Supabase SSR API is stable; Next.js 16 App Router patterns stable)
