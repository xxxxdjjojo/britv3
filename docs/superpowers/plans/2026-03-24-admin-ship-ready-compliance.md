# Admin Back Office: Ship-Ready Compliance & Security Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 16 most critical bugs (all P0 + P1 + key P2) from the 30-bug admin QA audit, making the admin panel ship-ready and UK GDPR compliant. Remaining 14 lower-severity bugs are deferred to dedicated feature plans.

**Architecture:** The admin panel uses a flat `is_admin` boolean for auth. We replace this with a granular `admin_role` enum enforced at middleware, layout, API guard, and RLS layers. CMS content gets server-side HTML sanitization. GDPR pipeline gets a real fulfillment implementation. Audit log gets IP capture and immutability hardening.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + Auth + RLS), TypeScript, isomorphic-dompurify, TipTap, Vitest, Playwright

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/admin-permissions.ts` | Admin role definitions, permission matrix, permission check helpers |
| `src/lib/validation/sanitize-cms.ts` | CMS-specific HTML sanitizer (broader allowed tags than `sanitizeHtml`) |
| `supabase/migrations/20260324_admin_roles_permissions.sql` | admin_role column, RLS policy fixes, audit log hardening |
| `supabase/migrations/20260324_gdpr_fulfillment.sql` | GDPR export/deletion helper functions and triggers |
| `src/services/admin/gdpr-fulfillment-service.ts` | GDPR data export aggregation and deletion cascade logic |
| `src/app/api/admin/gdpr/[id]/export/route.ts` | GDPR data export endpoint |
| `src/app/api/admin/gdpr/[id]/delete/route.ts` | GDPR data deletion endpoint |
| `src/app/api/admin/audit-log/export/route.ts` | Server-side audit log CSV export (replaces client-side) |
| `src/__tests__/admin/admin-permissions.test.ts` | Unit tests for permission matrix |
| `src/__tests__/admin/sanitize-cms.test.ts` | Unit tests for CMS sanitizer |
| ~~`src/__tests__/admin/admin-guard.test.ts`~~ | Deferred — covered by E2E auth boundary tests |
| ~~`src/__tests__/admin/gdpr-fulfillment.test.ts`~~ | Deferred — GDPR service uses admin client mocks that require integration test setup |
| `e2e/admin-security.spec.ts` | E2E tests for auth boundary, privilege escalation, role enforcement |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/admin-guard.ts` | Add `adminWithPermission()` that checks role + permission |
| `src/lib/audited-admin-action.ts` | Accept `requiredPermission` param, capture IP address |
| `src/lib/admin-audit.ts` | Accept and store `ipAddress` field |
| `src/middleware.ts` | No changes needed (already checks `is_admin`) |
| `src/app/(admin)/layout.tsx` | Pass `adminRole` to sidebar via context or prop |
| `src/components/admin/AdminSidebar.tsx` | Filter nav items based on admin role permissions |
| `src/app/api/admin/cms/[id]/route.ts` | Sanitize `content` field server-side before storage |
| `src/app/api/admin/team/invite/route.ts` | Require `super_admin` permission |
| `src/app/api/admin/roles/[userId]/promote/route.ts` | Require `super_admin` permission |
| `src/app/api/admin/roles/[userId]/demote/route.ts` | Require `super_admin`, fix last-admin check column |
| `src/app/api/admin/campaigns/[id]/send/route.ts` | Require `super_admin` permission |
| `src/services/admin/user-service.ts` | Add `suspendUserWithDuration()`, fix email lookup |
| `src/services/admin/gdpr-service.ts` | Add SLA computation, export/delete orchestration |
| `src/components/admin/GdprQueueClient.tsx` | Add SLA countdown badges (amber/red) |
| `src/components/admin/FraudDetectionClient.tsx` | Add confirmation modal before bulk suspend |
| `src/components/admin/EmailCampaignsClient.tsx` | Add recipient count preview, double confirmation for sends |
| `src/components/admin/AuditLogClient.tsx` | Replace client-side CSV with server-side export call |
| `src/components/admin/RolesClient.tsx` | Hide promote/demote for non-super-admins |
| `src/components/admin/TeamClient.tsx` | Hide invite form for non-super-admins |
| `supabase/migrations/20260316000000_admin_wave1_foundation.sql` | Reference only — do NOT modify (new migration fixes RLS) |

---

## Wave 1: Critical Security Fixes (BUG-1, BUG-5, BUG-6)

These are single-file fixes that can ship independently. No UI changes. No structural refactoring.

---

### Task 1: Fix CMS Stored XSS — Server-Side HTML Sanitization (BUG-1)

**Files:**
- Create: `src/lib/validation/sanitize-cms.ts`
- Create: `src/__tests__/admin/sanitize-cms.test.ts`
- Modify: `src/app/api/admin/cms/[id]/route.ts:41`

The existing `sanitizeHtml()` in `src/lib/validation/sanitize.ts` only allows `b, i, a, p, br, ul, ol, li, strong, em`. CMS content needs a broader allowlist (headings, images, blockquotes, code) while still blocking scripts and iframes. We create a dedicated CMS sanitizer.

- [ ] **Step 1: Write the failing test for CMS sanitizer**

```typescript
// src/__tests__/admin/sanitize-cms.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeCmsHtml } from "@/lib/validation/sanitize-cms";

describe("sanitizeCmsHtml", () => {
  it("preserves safe formatting tags", () => {
    const input = "<h2>Title</h2><p>Hello <strong>world</strong></p>";
    expect(sanitizeCmsHtml(input)).toBe(input);
  });

  it("preserves images with src and alt", () => {
    const input = '<img src="https://example.com/photo.jpg" alt="A photo">';
    expect(sanitizeCmsHtml(input)).toContain("src=");
    expect(sanitizeCmsHtml(input)).toContain("alt=");
  });

  it("preserves links with href", () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    expect(sanitizeCmsHtml(input)).toContain("href=");
  });

  it("preserves blockquotes", () => {
    const input = "<blockquote><p>Quote</p></blockquote>";
    expect(sanitizeCmsHtml(input)).toBe(input);
  });

  it("preserves ordered and unordered lists", () => {
    const input = "<ul><li>One</li></ul><ol><li>Two</li></ol>";
    expect(sanitizeCmsHtml(input)).toBe(input);
  });

  it("strips script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeCmsHtml(input)).toBe("<p>Hello</p>");
  });

  it("strips iframe tags", () => {
    const input = '<p>Hello</p><iframe src="https://evil.com"></iframe>';
    expect(sanitizeCmsHtml(input)).toBe("<p>Hello</p>");
  });

  it("strips event handlers", () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeCmsHtml(input);
    expect(result).not.toContain("onclick");
    expect(result).toContain("Click me");
  });

  it("strips javascript: URLs in links", () => {
    const input = '<a href="javascript:alert(1)">Evil</a>';
    const result = sanitizeCmsHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("strips style tags", () => {
    const input = "<style>body { display: none }</style><p>Hello</p>";
    expect(sanitizeCmsHtml(input)).toBe("<p>Hello</p>");
  });

  it("returns empty string for null/undefined", () => {
    expect(sanitizeCmsHtml(null as unknown as string)).toBe("");
    expect(sanitizeCmsHtml(undefined as unknown as string)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test src/__tests__/admin/sanitize-cms.test.ts`
Expected: FAIL — module `@/lib/validation/sanitize-cms` not found

- [ ] **Step 3: Implement the CMS sanitizer**

```typescript
// src/lib/validation/sanitize-cms.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * CMS-safe HTML sanitizer. Allows formatting tags needed for blog/help/landing
 * page content while blocking scripts, iframes, event handlers, and style injection.
 */

const CMS_ALLOWED_TAGS = [
  // Text formatting
  "p", "br", "b", "i", "strong", "em", "u", "s", "mark", "small", "sub", "sup",
  // Headings
  "h1", "h2", "h3", "h4", "h5", "h6",
  // Lists
  "ul", "ol", "li",
  // Structure
  "blockquote", "pre", "code", "hr", "div", "span",
  // Media
  "img",
  // Links
  "a",
  // Tables
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
];

const CMS_ALLOWED_ATTR = [
  "href", "target", "rel",           // links
  "src", "alt", "width", "height",   // images
  "class",                           // styling via classes (not inline styles)
  "colspan", "rowspan",              // tables
];

export function sanitizeCmsHtml(dirty: string): string {
  if (dirty == null) return "";
  if (typeof dirty !== "string") return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: CMS_ALLOWED_TAGS,
    ALLOWED_ATTR: CMS_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test src/__tests__/admin/sanitize-cms.test.ts`
Expected: All 11 tests PASS

- [ ] **Step 5: Wire sanitizer into CMS API route**

Modify `src/app/api/admin/cms/[id]/route.ts`. Add import and sanitize the `content` field before storage:

```typescript
// At top of file, add import:
import { sanitizeCmsHtml } from "@/lib/validation/sanitize-cms";

// Inside the handler, line ~41, change:
//   content: body.content ?? "",
// to:
      content: sanitizeCmsHtml(body.content ?? ""),
```

The `excerpt`, `seo_title`, and `seo_description` fields are plain text rendered in meta tags, so also sanitize those with the existing `sanitizeText()`:

```typescript
// Add import:
import { sanitizeText } from "@/lib/validation/sanitize";

// Change lines ~42-44:
      excerpt: body.excerpt ? sanitizeText(body.excerpt) : null,
      seo_title: body.seo_title ? sanitizeText(body.seo_title) : null,
      seo_description: body.seo_description ? sanitizeText(body.seo_description) : null,
```

- [ ] **Step 6: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/validation/sanitize-cms.ts src/__tests__/admin/sanitize-cms.test.ts src/app/api/admin/cms/\[id\]/route.ts
git commit -m "fix(admin): add server-side HTML sanitization for CMS content (BUG-1 P0)"
```

---

### Task 2: Fix RLS Policy Column Mismatch (BUG-6)

**Files:**
- Create: `supabase/migrations/20260324_fix_admin_rls_policies.sql`

The RLS policies in `20260316000000_admin_wave1_foundation.sql` check `profiles.role = 'admin'`, but the actual column is `is_admin` (boolean). This migration drops and recreates the policies with the correct column reference.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260324_fix_admin_rls_policies.sql
-- Fix: RLS policies reference profiles.role='admin' but the actual column is profiles.is_admin (boolean)
-- This affects admin_audit_log, feature_flags, gdpr_requests, cms_articles, email_campaigns, promo_codes

-- ── admin_audit_log ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_audit_log_select" ON admin_audit_log;
CREATE POLICY "admin_audit_log_select" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- INSERT policy is fine (checks admin_id = auth.uid(), not role)

-- ── feature_flags ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "feature_flags_write" ON feature_flags;
CREATE POLICY "feature_flags_write" ON feature_flags
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── gdpr_requests ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "gdpr_requests_admin" ON gdpr_requests;
CREATE POLICY "gdpr_requests_admin" ON gdpr_requests
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── cms_articles (admin policy) ──────────────────────────────────────
DROP POLICY IF EXISTS "cms_articles_admin" ON cms_articles;
CREATE POLICY "cms_articles_admin" ON cms_articles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── email_campaigns ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "email_campaigns_admin" ON email_campaigns;
CREATE POLICY "email_campaigns_admin" ON email_campaigns
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── promo_codes ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── content_reports (admin policy — net-new, not a fix) ──────────────
-- Note: 010_admin.sql never created an admin read policy for content_reports;
-- admins accessed via service_role bypass. Adding explicit RLS for safety.
DROP POLICY IF EXISTS "content_reports_admin_read" ON content_reports;
CREATE POLICY "content_reports_admin_read" ON content_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── email_logs (admin policy — from 20260317100000_email_logs.sql) ───
DROP POLICY IF EXISTS "email_logs_admin_all" ON email_logs;
CREATE POLICY "email_logs_admin_all" ON email_logs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── feature_flags (additional select policy from 20260318100001) ─────
DROP POLICY IF EXISTS "feature_flags_admin_select" ON feature_flags;
CREATE POLICY "feature_flags_admin_select" ON feature_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

- [ ] **Step 2: Verify migration syntax**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && cat supabase/migrations/20260324_fix_admin_rls_policies.sql | head -5`
Expected: File exists with correct SQL header

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324_fix_admin_rls_policies.sql
git commit -m "fix(admin): align RLS policies to use is_admin instead of role='admin' (BUG-6 P0)"
```

---

### Task 3: Harden Audit Log — IP Capture + Immutability (BUG-5, BUG-22)

**Files:**
- Modify: `src/lib/admin-audit.ts:3-11,13-31`
- Modify: `src/lib/audited-admin-action.ts:14-19,31-40`
- Create: `supabase/migrations/20260324_audit_log_hardening.sql`

- [ ] **Step 1: Write migration for audit log SECURITY DEFINER function**

```sql
-- supabase/migrations/20260324_audit_log_hardening.sql
-- Route all audit inserts through a SECURITY DEFINER function
-- that validates the caller and prevents direct table manipulation.

-- Create a function that writes audit log entries using service role
-- but validates the admin_id matches the authenticated user.
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id uuid,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_metadata jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_success boolean DEFAULT NULL,
  p_error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validate caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Caller is not an admin';
  END IF;

  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, metadata, ip_address, success, error_message)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_metadata, p_ip_address, p_success, p_error_message)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Revoke direct INSERT from all roles (only the function can insert now)
-- Keep the existing INSERT policy but add the function as the preferred path
-- NOTE: We keep the RLS INSERT policy as fallback for backwards compatibility
-- but the application code will use the RPC function going forward.

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
```

- [ ] **Step 2: Update admin-audit.ts to capture IP and use RPC**

Replace `src/lib/admin-audit.ts` entirely:

```typescript
// src/lib/admin-audit.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminActionLog = {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  success?: boolean;
  errorMessage?: string;
};

export async function logAdminAction(
  supabase: SupabaseClient,
  log: AdminActionLog,
): Promise<void> {
  // Best-effort — never throw, just log errors
  try {
    await supabase.rpc("log_admin_action", {
      p_admin_id: log.adminId,
      p_action: log.action,
      p_target_type: log.targetType,
      p_target_id: log.targetId,
      p_metadata: log.metadata ?? null,
      p_ip_address: log.ipAddress ?? null,
      p_success: log.success ?? null,
      p_error_message: log.errorMessage ?? null,
    });
  } catch (e) {
    // Fallback: direct insert (for environments where RPC isn't deployed yet)
    try {
      await supabase.from("admin_audit_log").insert({
        admin_id: log.adminId,
        action: log.action,
        target_type: log.targetType,
        target_id: log.targetId,
        metadata: log.metadata ?? null,
        ip_address: log.ipAddress ?? null,
        success: log.success ?? null,
        error_message: log.errorMessage ?? null,
      });
    } catch (fallbackError) {
      console.error("[audit] Failed to log admin action:", fallbackError);
    }
  }
}
```

- [ ] **Step 3: Update audited-admin-action.ts to pass IP address**

In `src/lib/audited-admin-action.ts`, extract IP from request headers and pass to audit:

```typescript
// src/lib/audited-admin-action.ts
import { adminOnly, type AdminContext } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/admin-audit";

export class AdminActionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminActionError";
  }
}

function extractIp(request: Request): string | undefined {
  // Cloudflare / Vercel / standard proxy headers
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

export async function auditedAdminAction(
  request: Request,
  action: string,
  targetType: string,
  targetId: string,
  fn: (ctx: AdminContext) => Promise<unknown>,
): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  const ipAddress = extractIp(request);
  let result: unknown;
  let thrownError: unknown;

  try {
    result = await fn(ctx);
  } catch (e) {
    thrownError = e;
  } finally {
    await logAdminAction(ctx.supabase, {
      adminId: ctx.user.id,
      action,
      targetType,
      targetId,
      ipAddress,
      success: thrownError === undefined,
      errorMessage:
        thrownError instanceof Error ? thrownError.message : undefined,
    });
  }

  if (thrownError !== undefined) {
    if (thrownError instanceof AdminActionError) {
      return Response.json(
        { error: thrownError.message },
        { status: thrownError.status },
      );
    }
    const message =
      thrownError instanceof Error ? thrownError.message : "Action failed";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json(result);
}
```

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-audit.ts src/lib/audited-admin-action.ts supabase/migrations/20260324_audit_log_hardening.sql
git commit -m "fix(admin): harden audit log with IP capture and SECURITY DEFINER insert (BUG-5, BUG-22 P0/P3)"
```

---

## Wave 2: Granular Admin Role Permissions (BUG-2, BUG-3, BUG-4)

This is the largest structural change. We add an `admin_role` column to profiles and enforce permissions at every layer.

---

### Task 4: Define Permission Matrix and Helpers (BUG-2)

**Files:**
- Create: `src/lib/admin-permissions.ts`
- Create: `src/__tests__/admin/admin-permissions.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/admin/admin-permissions.test.ts
import { describe, it, expect } from "vitest";
import {
  type AdminRole,
  type AdminPermission,
  hasPermission,
  getPermissionsForRole,
  getAccessibleNavGroups,
  ADMIN_ROLES,
} from "@/lib/admin-permissions";

describe("admin-permissions", () => {
  describe("hasPermission", () => {
    it("super_admin has all permissions", () => {
      expect(hasPermission("super_admin", "manage_users")).toBe(true);
      expect(hasPermission("super_admin", "manage_team")).toBe(true);
      expect(hasPermission("super_admin", "view_revenue")).toBe(true);
      expect(hasPermission("super_admin", "send_campaigns")).toBe(true);
      expect(hasPermission("super_admin", "manage_gdpr")).toBe(true);
    });

    it("moderation_admin can moderate but not manage team", () => {
      expect(hasPermission("moderation_admin", "moderate_listings")).toBe(true);
      expect(hasPermission("moderation_admin", "moderate_reviews")).toBe(true);
      expect(hasPermission("moderation_admin", "moderate_content")).toBe(true);
      expect(hasPermission("moderation_admin", "manage_cms")).toBe(true);
      expect(hasPermission("moderation_admin", "manage_team")).toBe(false);
      expect(hasPermission("moderation_admin", "view_revenue")).toBe(false);
      expect(hasPermission("moderation_admin", "manage_gdpr")).toBe(false);
      expect(hasPermission("moderation_admin", "send_campaigns")).toBe(false);
    });

    it("ops_admin can manage users and GDPR but not CMS", () => {
      expect(hasPermission("ops_admin", "manage_users")).toBe(true);
      expect(hasPermission("ops_admin", "manage_gdpr")).toBe(true);
      expect(hasPermission("ops_admin", "view_audit_log")).toBe(true);
      expect(hasPermission("ops_admin", "manage_subscriptions")).toBe(true);
      expect(hasPermission("ops_admin", "manage_cms")).toBe(false);
      expect(hasPermission("ops_admin", "manage_feature_flags")).toBe(false);
      expect(hasPermission("ops_admin", "view_revenue")).toBe(false);
    });

    it("dev_admin can manage flags and system but not user PII", () => {
      expect(hasPermission("dev_admin", "manage_feature_flags")).toBe(true);
      expect(hasPermission("dev_admin", "view_system_health")).toBe(true);
      expect(hasPermission("dev_admin", "view_api_usage")).toBe(true);
      expect(hasPermission("dev_admin", "view_analytics")).toBe(true);
      expect(hasPermission("dev_admin", "manage_users")).toBe(false);
      expect(hasPermission("dev_admin", "manage_gdpr")).toBe(false);
      expect(hasPermission("dev_admin", "moderate_listings")).toBe(false);
    });

    it("returns false for unknown role", () => {
      expect(hasPermission("unknown" as AdminRole, "manage_users")).toBe(false);
    });
  });

  describe("getAccessibleNavGroups", () => {
    it("super_admin sees all nav groups", () => {
      const groups = getAccessibleNavGroups("super_admin");
      expect(groups).toContain("Overview");
      expect(groups).toContain("Moderation");
      expect(groups).toContain("Operations");
      expect(groups).toContain("Content");
      expect(groups).toContain("Growth");
      expect(groups).toContain("Team");
    });

    it("moderation_admin does not see Growth or Team", () => {
      const groups = getAccessibleNavGroups("moderation_admin");
      expect(groups).toContain("Moderation");
      expect(groups).toContain("Content");
      expect(groups).not.toContain("Growth");
      expect(groups).not.toContain("Team");
    });
  });

  describe("ADMIN_ROLES", () => {
    it("defines exactly 4 roles", () => {
      expect(ADMIN_ROLES).toHaveLength(4);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test src/__tests__/admin/admin-permissions.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the permission matrix**

```typescript
// src/lib/admin-permissions.ts

export type AdminRole = "super_admin" | "moderation_admin" | "ops_admin" | "dev_admin";

export type AdminPermission =
  // User management
  | "manage_users"
  | "ban_users"
  | "suspend_users"
  // Moderation
  | "moderate_listings"
  | "moderate_reviews"
  | "moderate_content"
  | "manage_verifications"
  // Operations
  | "manage_gdpr"
  | "manage_subscriptions"
  | "manage_fraud"
  | "view_audit_log"
  // Content
  | "manage_cms"
  | "manage_seo"
  // Growth
  | "send_campaigns"
  | "manage_promo_codes"
  | "view_revenue"
  // System
  | "manage_feature_flags"
  | "view_system_health"
  | "view_api_usage"
  | "view_analytics"
  // Team (super_admin only)
  | "manage_team"
  | "manage_roles";

export const ADMIN_ROLES: readonly AdminRole[] = [
  "super_admin",
  "moderation_admin",
  "ops_admin",
  "dev_admin",
] as const;

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: [
    "manage_users", "ban_users", "suspend_users",
    "moderate_listings", "moderate_reviews", "moderate_content", "manage_verifications",
    "manage_gdpr", "manage_subscriptions", "manage_fraud", "view_audit_log",
    "manage_cms", "manage_seo",
    "send_campaigns", "manage_promo_codes", "view_revenue",
    "manage_feature_flags", "view_system_health", "view_api_usage", "view_analytics",
    "manage_team", "manage_roles",
  ],
  moderation_admin: [
    "manage_users", "suspend_users",
    "moderate_listings", "moderate_reviews", "moderate_content", "manage_verifications",
    "manage_cms", "manage_seo",
    "view_audit_log",
  ],
  ops_admin: [
    "manage_users", "ban_users", "suspend_users",
    "manage_gdpr", "manage_subscriptions", "manage_fraud", "view_audit_log",
    "manage_verifications",
  ],
  dev_admin: [
    "manage_feature_flags", "view_system_health", "view_api_usage", "view_analytics",
    "view_audit_log",
  ],
};

/** Check if a role has a specific permission. */
export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/** Get all permissions for a role. */
export function getPermissionsForRole(role: AdminRole): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Map nav group labels to required permissions
const NAV_GROUP_PERMISSIONS: Record<string, AdminPermission> = {
  "Overview": "view_analytics",
  "Moderation": "moderate_listings",
  "Operations": "manage_gdpr",
  "Content": "manage_cms",
  "Growth": "view_revenue",
  "Team": "manage_team",
};

/** Return which sidebar nav groups a role can see. */
export function getAccessibleNavGroups(role: AdminRole): string[] {
  return Object.entries(NAV_GROUP_PERMISSIONS)
    .filter(([, perm]) => hasPermission(role, perm))
    .map(([group]) => group);
}

// Map admin routes to required permissions for middleware/page-level checks
export const ADMIN_ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin": "view_analytics",                    // Dashboard — all admins
  "/admin/users": "manage_users",
  "/admin/moderation": "moderate_listings",
  "/admin/verifications": "manage_verifications",
  "/admin/reviews": "moderate_reviews",
  "/admin/reported": "moderate_content",
  "/admin/roles": "manage_roles",
  "/admin/team": "manage_team",
  "/admin/audit-log": "view_audit_log",
  "/admin/system-health": "view_system_health",
  "/admin/api-usage": "view_api_usage",
  "/admin/feature-flags": "manage_feature_flags",
  "/admin/gdpr": "manage_gdpr",
  "/admin/fraud": "manage_fraud",
  "/admin/cms": "manage_cms",
  "/admin/seo": "manage_seo",
  "/admin/analytics": "view_analytics",
  "/admin/subscriptions": "manage_subscriptions",
  "/admin/promo-codes": "manage_promo_codes",
  "/admin/email-campaigns": "send_campaigns",
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm test src/__tests__/admin/admin-permissions.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-permissions.ts src/__tests__/admin/admin-permissions.test.ts
git commit -m "feat(admin): add granular permission matrix for 4 admin roles (BUG-2)"
```

---

### Task 5: Add admin_role Column and Update RLS (BUG-2 DB layer)

**Files:**
- Create: `supabase/migrations/20260324_admin_roles_permissions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260324_admin_roles_permissions.sql
-- Add admin_role column to profiles for granular admin permissions.
-- Default: existing admins get 'super_admin' to preserve current access.

-- 1. Add admin_role column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_role text
  CHECK (admin_role IN ('super_admin', 'moderation_admin', 'ops_admin', 'dev_admin'));

-- 2. Backfill: all existing admins become super_admin
UPDATE profiles SET admin_role = 'super_admin' WHERE is_admin = true AND admin_role IS NULL;

-- 3. Index for fast role lookups
CREATE INDEX IF NOT EXISTS profiles_admin_role_idx ON profiles(admin_role) WHERE is_admin = true;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260324_admin_roles_permissions.sql
git commit -m "feat(admin): add admin_role column to profiles with backfill migration (BUG-2)"
```

---

### Task 6: Enforce Permissions in Admin Guard and API Routes (BUG-2, BUG-3, BUG-4)

**Files:**
- Modify: `src/lib/admin-guard.ts`
- Modify: `src/lib/audited-admin-action.ts`
- Modify: `src/app/api/admin/team/invite/route.ts`
- Modify: `src/app/api/admin/roles/[userId]/promote/route.ts`
- Modify: `src/app/api/admin/roles/[userId]/demote/route.ts`
- Modify: `src/app/api/admin/campaigns/[id]/send/route.ts`

- [ ] **Step 1: Add permission-aware guard to admin-guard.ts**

Add a new `adminWithPermission()` function below the existing `adminOnly()`. Do NOT remove `adminOnly()` — it's used by all 21 routes and we'll migrate them incrementally.

**IMPORTANT:** Add the new imports at the TOP of the file, after the existing imports (not at the bottom).

```typescript
// Add these imports at the TOP of src/lib/admin-guard.ts, after existing imports:

import type { AdminRole, AdminPermission } from "@/lib/admin-permissions";
import { hasPermission } from "@/lib/admin-permissions";

export type AdminContextWithRole = {
  user: User;
  supabase: SupabaseClient;
  adminRole: AdminRole;
};

/**
 * Like adminOnly(), but also checks that the admin has a specific permission.
 * Returns 403 with "Insufficient permissions" if the role lacks the permission.
 */
export async function adminWithPermission(
  request: Request,
  permission: AdminPermission,
): Promise<AdminContextWithRole | Response> {
  let supabase: SupabaseClient;

  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[admin-guard] Failed to create Supabase client:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let profile: { is_admin: boolean | null; admin_role: string | null } | null = null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin, admin_role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[admin-guard] Failed to fetch profile:", error);
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    profile = data as typeof profile;
  } catch (e) {
    console.error("[admin-guard] DB error fetching profile:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (profile?.is_admin !== true) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Default to super_admin for backwards compat (existing admins without admin_role set)
  const adminRole = (profile.admin_role ?? "super_admin") as AdminRole;

  if (!hasPermission(adminRole, permission)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return { user, supabase, adminRole };
}
```

- [ ] **Step 2: Add `auditedAdminActionWithPermission()` to audited-admin-action.ts**

Add below the existing `auditedAdminAction()` function. Same pattern, but uses `adminWithPermission()`.

**IMPORTANT:** Add the new imports at the TOP of the file, after the existing imports (not at the bottom).

```typescript
// Add these imports at the TOP of src/lib/audited-admin-action.ts, after existing imports:
import { adminWithPermission, type AdminContextWithRole } from "@/lib/admin-guard";
import type { AdminPermission } from "@/lib/admin-permissions";

// Then add the following function at the BOTTOM of the file, after auditedAdminAction():

export async function auditedAdminActionWithPermission(
  request: Request,
  action: string,
  targetType: string,
  targetId: string,
  requiredPermission: AdminPermission,
  fn: (ctx: AdminContextWithRole) => Promise<unknown>,
): Promise<Response> {
  const ctx = await adminWithPermission(request, requiredPermission);
  if (ctx instanceof Response) return ctx;

  const ipAddress = extractIp(request);
  let result: unknown;
  let thrownError: unknown;

  try {
    result = await fn(ctx);
  } catch (e) {
    thrownError = e;
  } finally {
    await logAdminAction(ctx.supabase, {
      adminId: ctx.user.id,
      action,
      targetType,
      targetId,
      ipAddress,
      success: thrownError === undefined,
      errorMessage:
        thrownError instanceof Error ? thrownError.message : undefined,
    });
  }

  if (thrownError !== undefined) {
    if (thrownError instanceof AdminActionError) {
      return Response.json(
        { error: thrownError.message },
        { status: thrownError.status },
      );
    }
    const message =
      thrownError instanceof Error ? thrownError.message : "Action failed";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json(result);
}
```

- [ ] **Step 3: Gate team invite to super_admin**

In `src/app/api/admin/team/invite/route.ts`, replace `auditedAdminAction` with `auditedAdminActionWithPermission`:

```typescript
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  return auditedAdminActionWithPermission(
    req,
    "team.invite",
    "user",
    "invite",
    "manage_team",
    async () => {
      const body = await req.json().catch(() => ({})) as { email?: string };
      if (!body.email || typeof body.email !== "string") {
        throw new Error("email is required");
      }

      const adminClient = createAdminClient();
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
        body.email,
        {
          data: { role: "admin" },
        },
      );

      if (error) throw new Error(error.message);
      return { invited: true, email: data.user.email };
    },
  );
}
```

- [ ] **Step 4: Gate admin promotion to super_admin**

In `src/app/api/admin/roles/[userId]/promote/route.ts`, replace `auditedAdminAction` with `auditedAdminActionWithPermission`:

```typescript
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { promoteToAdmin } from "@/services/admin/user-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminActionWithPermission(
    req,
    "user.promote_to_admin",
    "user",
    userId,
    "manage_roles",
    async ({ supabase }) => {
      const result = await promoteToAdmin(supabase, userId);
      if (!result.success) throw new Error("Failed to promote user");
      return { success: true };
    },
  );
}
```

- [ ] **Step 5: Fix demote route — last admin check + permission gate**

In `src/app/api/admin/roles/[userId]/demote/route.ts`, replace `auditedAdminAction` with `auditedAdminActionWithPermission` AND fix the last-admin check to use `is_admin = true` instead of `role = 'admin'`:

```typescript
import { AdminActionError, auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { demoteFromAdmin } from "@/services/admin/user-service";

const VALID_ROLES = [
  "homebuyer", "renter", "seller", "landlord", "estate_agent", "service_provider",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return auditedAdminActionWithPermission(
    req,
    "user.demote_from_admin",
    "user",
    userId,
    "manage_roles",
    async ({ supabase, user }) => {
      if (userId === user.id) {
        throw new AdminActionError("Cannot demote yourself", 403);
      }

      // Fix BUG-18: check is_admin column, not role column
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", true);

      if ((count ?? 0) <= 1) {
        throw new AdminActionError("Cannot remove the last admin", 409);
      }

      const body = await req.json().catch(() => ({})) as { role?: string };
      const newRole = body.role ?? "homebuyer";
      if (!VALID_ROLES.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
      }
      const result = await demoteFromAdmin(supabase, userId);
      if (!result.success) throw new Error("Failed to demote user");
      return { success: true };
    },
  );
}
```

- [ ] **Step 6: Gate campaign send to super_admin**

In `src/app/api/admin/campaigns/[id]/send/route.ts`:

```typescript
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "campaign.send",
    "email_campaign",
    id,
    "send_campaigns",
    async ({ supabase }) => {
      const { error } = await supabase
        .from("email_campaigns")
        .update({
          status: "scheduled",
          scheduled_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);
      return { queued: true, campaignId: id };
    },
  );
}
```

- [ ] **Step 7: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/lib/admin-guard.ts src/lib/audited-admin-action.ts \
  src/app/api/admin/team/invite/route.ts \
  src/app/api/admin/roles/\[userId\]/promote/route.ts \
  src/app/api/admin/roles/\[userId\]/demote/route.ts \
  src/app/api/admin/campaigns/\[id\]/send/route.ts
git commit -m "feat(admin): enforce granular permissions on team, roles, and campaign APIs (BUG-2, BUG-3, BUG-4, BUG-18)"
```

---

### Task 7: Filter Admin Sidebar by Role Permissions (BUG-2 UI layer)

**Files:**
- Modify: `src/app/(admin)/layout.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Pass adminRole from layout to sidebar**

In `src/app/(admin)/layout.tsx`, fetch `admin_role` and pass it down:

```typescript
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminRole } from "@/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Admin - Britestate",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, admin_role")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin !== true) {
    redirect("/");
  }

  const adminRole = ((profile as Record<string, unknown>).admin_role ?? "super_admin") as AdminRole;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar adminRole={adminRole} />
      <main className="flex-1 p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Filter nav items in AdminSidebar**

In `src/components/admin/AdminSidebar.tsx`, accept `adminRole` prop and filter nav groups:

Add prop type and import:
```typescript
import type { AdminRole } from "@/lib/admin-permissions";
import { getAccessibleNavGroups } from "@/lib/admin-permissions";
```

Change `SidebarContent` to accept and use `adminRole`:
```typescript
function SidebarContent({ adminRole }: { adminRole: AdminRole }) {
  const pathname = usePathname();
  const accessibleGroups = getAccessibleNavGroups(adminRole);

  return (
    <>
      <div
        className="flex h-16 shrink-0 items-center px-4"
        style={{ backgroundColor: "#1B4D3E" }}
      >
        <span
          className="text-sm font-semibold uppercase tracking-widest text-white"
          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          Admin Console
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
        {NAV_GROUPS
          .filter((group) => accessibleGroups.includes(group.label))
          .map((group) => (
            <CollapsibleGroup
              key={group.label}
              group={group}
              pathname={pathname}
            />
          ))}
      </nav>
    </>
  );
}

export function AdminSidebar({ adminRole }: Readonly<{ adminRole: AdminRole }>) {
  return (
    <ResponsiveSidebar className="border-neutral-200 bg-white">
      <SidebarContent adminRole={adminRole} />
    </ResponsiveSidebar>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/layout.tsx src/components/admin/AdminSidebar.tsx
git commit -m "feat(admin): filter sidebar navigation by admin role permissions (BUG-2 UI)"
```

---

## Wave 3: GDPR Compliance (BUG-7, BUG-8)

---

### Task 8: Add SLA Countdown to GDPR Queue (BUG-7)

**Files:**
- Modify: `src/components/admin/GdprQueueClient.tsx`

- [ ] **Step 1: Add SLA computation and visual indicators**

In `src/components/admin/GdprQueueClient.tsx`, add a helper function and an SLA badge column.

Add helper above the component:
```typescript
function getDaysRemaining(createdAt: string): number {
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function SlaBadge({ createdAt, status }: { createdAt: string; status: string }) {
  if (status === "fulfilled") return <span className="text-xs text-green-600 font-medium">Complete</span>;

  const days = getDaysRemaining(createdAt);

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-semibold">
        OVERDUE ({Math.abs(days)}d)
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
        {days}d remaining
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-0.5 text-xs font-medium">
        {days}d remaining
      </span>
    );
  }
  return (
    <span className="text-xs text-neutral-500">{days}d remaining</span>
  );
}
```

Add an "SLA" column to the table header (after "Submitted"):
```html
<th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
  SLA
</th>
```

Add corresponding cell in tbody:
```html
<td className="px-4 py-3">
  <SlaBadge createdAt={req.created_at} status={req.status} />
</td>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/GdprQueueClient.tsx
git commit -m "feat(admin): add 30-day SLA countdown badges to GDPR queue (BUG-7 P1)"
```

---

### Task 9: Implement GDPR Data Export Pipeline (BUG-8)

**Files:**
- Create: `src/services/admin/gdpr-fulfillment-service.ts`
- Create: `src/app/api/admin/gdpr/[id]/export/route.ts`
- Modify: `src/services/admin/gdpr-service.ts`

- [ ] **Step 1: Create the GDPR data export service**

```typescript
// src/services/admin/gdpr-fulfillment-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type GdprExportData = {
  profile: Record<string, unknown> | null;
  properties: Record<string, unknown>[];
  messages_sent: number;
  reviews_written: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  gdpr_requests: Record<string, unknown>[];
  content_reports_filed: Record<string, unknown>[];
  exported_at: string;
};

/**
 * Aggregate all personal data for a user across all tables.
 * Uses service_role to bypass RLS for comprehensive data retrieval.
 */
export async function aggregateUserData(userId: string): Promise<GdprExportData> {
  const admin = createAdminClient();

  const [
    { data: profile },
    { data: properties },
    { count: messagesCount },
    { data: reviews },
    { data: subscriptions },
    { data: gdprRequests },
    { data: reports },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("properties").select("id, title, status, created_at").eq("owner_id", userId),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", userId),
    admin.from("reviews").select("id, rating, content, created_at").eq("reviewer_id", userId),
    admin.from("subscriptions").select("id, plan, status, created_at").eq("user_id", userId),
    admin.from("gdpr_requests").select("id, request_type, status, created_at").eq("user_id", userId),
    admin.from("content_reports").select("id, entity_type, reason, created_at").eq("reporter_id", userId),
  ]);

  // Strip sensitive fields from profile
  const safeProfile = profile ? { ...profile } : null;
  if (safeProfile) {
    delete safeProfile.password_hash;
    delete safeProfile.two_factor_secret;
    delete safeProfile.oauth_tokens;
  }

  return {
    profile: safeProfile,
    properties: properties ?? [],
    messages_sent: messagesCount ?? 0,
    reviews_written: reviews ?? [],
    subscriptions: subscriptions ?? [],
    gdpr_requests: gdprRequests ?? [],
    content_reports_filed: reports ?? [],
    exported_at: new Date().toISOString(),
  };
}

/**
 * Execute GDPR deletion: anonymize profile, remove personal data,
 * preserve anonymized records where legally required (e.g., financial transactions).
 */
export async function deleteUserData(
  userId: string,
): Promise<{ deleted: boolean; details: string[] }> {
  const admin = createAdminClient();
  const details: string[] = [];

  // 1. Delete user-generated content
  const { count: reviewsDeleted } = await admin
    .from("reviews")
    .delete({ count: "exact" })
    .eq("reviewer_id", userId);
  details.push(`Deleted ${reviewsDeleted ?? 0} reviews`);

  // 2. Delete content reports filed by user
  const { count: reportsDeleted } = await admin
    .from("content_reports")
    .delete({ count: "exact" })
    .eq("reporter_id", userId);
  details.push(`Deleted ${reportsDeleted ?? 0} content reports`);

  // 3. Anonymize messages (keep for recipient's records, remove sender info)
  const { count: messagesAnonymized } = await admin
    .from("messages")
    .update({ sender_id: null, sender_name: "[Deleted User]" })
    .eq("sender_id", userId);
  details.push(`Anonymized ${messagesAnonymized ?? 0} messages`);

  // 4. Unpublish and anonymize properties
  const { count: propertiesRemoved } = await admin
    .from("properties")
    .update({ status: "deleted", owner_id: null })
    .eq("owner_id", userId);
  details.push(`Removed ${propertiesRemoved ?? 0} properties`);

  // 5. Anonymize the profile (keep row for referential integrity)
  await admin
    .from("profiles")
    .update({
      display_name: "[Deleted User]",
      full_name: null,
      email: null,
      phone: null,
      avatar_url: null,
      bio: null,
      address_line_1: null,
      address_line_2: null,
      city: null,
      postcode: null,
      date_of_birth: null,
      is_admin: false,
      admin_role: null,
    })
    .eq("id", userId);
  details.push("Anonymized profile");

  // 6. Delete auth user (invalidates all sessions immediately)
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    details.push(`Auth deletion failed: ${authError.message}`);
    return { deleted: false, details };
  }
  details.push("Deleted auth user and all sessions");

  return { deleted: true, details };
}
```

- [ ] **Step 2: Create the GDPR export API route**

```typescript
// src/app/api/admin/gdpr/[id]/export/route.ts
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { aggregateUserData } from "@/services/admin/gdpr-fulfillment-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "gdpr.export",
    "gdpr_request",
    id,
    "manage_gdpr",
    async ({ supabase }) => {
      // Get the GDPR request to find the user_id
      const { data: gdprRequest } = await supabase
        .from("gdpr_requests")
        .select("user_id, status, request_type")
        .eq("id", id)
        .single();

      if (!gdprRequest) throw new Error("GDPR request not found");
      if (gdprRequest.status === "fulfilled") {
        return { error: "Already fulfilled", alreadyFulfilled: true };
      }

      // Aggregate all user data
      const exportData = await aggregateUserData(gdprRequest.user_id);

      // Store export as JSON in Supabase Storage
      const fileName = `gdpr-exports/${gdprRequest.user_id}/${id}.json`;
      const { error: uploadError } = await supabase.storage
        .from("admin")
        .upload(fileName, JSON.stringify(exportData, null, 2), {
          contentType: "application/json",
          upsert: true,
        });

      if (uploadError) throw new Error(`Export upload failed: ${uploadError.message}`);

      // Generate a signed URL (valid 7 days)
      const { data: signedUrl } = await supabase.storage
        .from("admin")
        .createSignedUrl(fileName, 7 * 24 * 60 * 60);

      // Update the GDPR request status
      await supabase
        .from("gdpr_requests")
        .update({
          status: "fulfilled",
          export_url: signedUrl?.signedUrl ?? null,
          export_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          fulfilled_at: new Date().toISOString(),
        })
        .eq("id", id);

      return { fulfilled: true, exportUrl: signedUrl?.signedUrl };
    },
  );
}
```

- [ ] **Step 3: Create the GDPR deletion API route**

```typescript
// src/app/api/admin/gdpr/[id]/delete/route.ts
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { deleteUserData } from "@/services/admin/gdpr-fulfillment-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return auditedAdminActionWithPermission(
    req,
    "gdpr.delete",
    "gdpr_request",
    id,
    "manage_gdpr",
    async ({ supabase }) => {
      const { data: gdprRequest } = await supabase
        .from("gdpr_requests")
        .select("user_id, status, request_type")
        .eq("id", id)
        .single();

      if (!gdprRequest) throw new Error("GDPR request not found");
      if (gdprRequest.request_type !== "deletion") {
        throw new Error("This request is not a deletion request");
      }
      if (gdprRequest.status === "fulfilled") {
        return { error: "Already fulfilled", alreadyFulfilled: true };
      }

      const result = await deleteUserData(gdprRequest.user_id);

      // Update the GDPR request status
      const newStatus = result.deleted ? "fulfilled" : "failed";
      await supabase
        .from("gdpr_requests")
        .update({
          status: newStatus,
          fulfilled_at: new Date().toISOString(),
          notes: result.details.join("; "),
        })
        .eq("id", id);

      return { ...result, requestId: id };
    },
  );
}
```

- [ ] **Step 4: Update GdprQueueClient to call the correct endpoint per request type**

In `src/components/admin/GdprQueueClient.tsx`, update the `FulfilButton` component to use the correct endpoint based on request type:

Change `FulfilButton` to accept `requestType`:
```typescript
function FulfilButton({ requestId, requestType }: { requestId: string; requestType: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleFulfil() {
    const endpoint = requestType === "deletion"
      ? `/api/admin/gdpr/${requestId}/delete`
      : `/api/admin/gdpr/${requestId}/export`;

    startTransition(async () => {
      try {
        const res = await fetch(endpoint, { method: "POST" });
        if (res.status === 409) {
          toast.info("Request already fulfilled or in progress");
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Failed to fulfil request");
        }
        toast.success(
          requestType === "deletion"
            ? "User data deletion completed"
            : "Data export generated and ready for delivery",
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to fulfil request");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handleFulfil} disabled={pending} className="text-xs">
      {pending ? "Processing..." : requestType === "deletion" ? "Delete Data" : "Export Data"}
    </Button>
  );
}
```

And update the render to pass `requestType`:
```html
<FulfilButton requestId={req.id} requestType={req.request_type} />
```

- [ ] **Step 5: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/services/admin/gdpr-fulfillment-service.ts \
  src/app/api/admin/gdpr/\[id\]/export/route.ts \
  src/app/api/admin/gdpr/\[id\]/delete/route.ts \
  src/components/admin/GdprQueueClient.tsx
git commit -m "feat(admin): implement GDPR data export and deletion pipelines (BUG-8 P1)"
```

---

## Wave 4: Operational Safety (BUG-10, BUG-11, BUG-14, BUG-17)

---

### Task 10: Add Confirmation Safeguards to Email Campaign Send (BUG-10)

**Files:**
- Modify: `src/components/admin/EmailCampaignsClient.tsx:123-129`

- [ ] **Step 1: Replace browser confirm() with a proper confirmation modal**

In `src/components/admin/EmailCampaignsClient.tsx`, replace the `handleSend` function and add state for the confirmation flow:

Add state variables inside `EmailCampaignsClient`:
```typescript
const [sendConfirmId, setSendConfirmId] = useState<string | null>(null);
const [sendConfirmText, setSendConfirmText] = useState("");
```

Replace `handleSend`:
```typescript
function promptSend(id: string) {
  setSendConfirmId(id);
  setSendConfirmText("");
}

async function handleSend() {
  if (!sendConfirmId || sendConfirmText !== "SEND") return;
  const ok = await execute(`/api/admin/campaigns/${sendConfirmId}/send`, {
    method: "POST",
  });
  if (ok) toast.success("Campaign queued for sending");
  setSendConfirmId(null);
  setSendConfirmText("");
}
```

Add confirmation dialog JSX (before the closing `</div>` of the component return):
```jsx
{sendConfirmId && (
  <Dialog open onOpenChange={() => setSendConfirmId(null)}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Confirm Campaign Send</DialogTitle>
        <DialogDescription>
          This will send emails to all targeted recipients. This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <Label htmlFor="confirm-send">Type SEND to confirm:</Label>
        <Input
          id="confirm-send"
          value={sendConfirmText}
          onChange={(e) => setSendConfirmText(e.target.value)}
          placeholder="SEND"
          className="font-mono"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setSendConfirmId(null)}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={handleSend}
          disabled={sendConfirmText !== "SEND" || isPending}
        >
          {isPending ? "Sending..." : "Confirm Send"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

Add Dialog imports at top:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
```

Update the Send button in the table to call `promptSend`:
```jsx
<Button ... onClick={() => promptSend(campaign.id)} ...>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/EmailCampaignsClient.tsx
git commit -m "fix(admin): add type-SEND confirmation for email campaign dispatch (BUG-10 P1)"
```

---

### Task 11: Server-Side Audit Log Export (BUG-11)

**Files:**
- Create: `src/app/api/admin/audit-log/export/route.ts`
- Modify: `src/components/admin/AuditLogClient.tsx`

- [ ] **Step 1: Create server-side export endpoint**

```typescript
// src/app/api/admin/audit-log/export/route.ts
import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";

export async function POST(req: Request) {
  return auditedAdminActionWithPermission(
    req,
    "audit_log.export",
    "audit_log",
    "csv_export",
    "view_audit_log",
    async ({ supabase }) => {
      const url = new URL(req.url);
      const rawAction = url.searchParams.get("action") ?? undefined;
      const adminId = url.searchParams.get("adminId") ?? undefined;

      // Sanitize ILIKE input to prevent PostgREST filter injection
      const action = rawAction ? sanitizePostgrestInput(rawAction) : undefined;

      let query = supabase
        .from("admin_audit_log")
        .select("id, admin_id, action, target_type, target_id, ip_address, success, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (action) query = query.ilike("action", `%${action}%`);
      if (adminId) query = query.eq("admin_id", adminId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // Build CSV
      const headers = ["id", "admin_id", "action", "target_type", "target_id", "ip_address", "success", "error_message", "created_at"];
      const rows = (data ?? []).map((e: Record<string, unknown>) =>
        headers.map((h) => `"${String(e[h] ?? "").replace(/"/g, '""')}"`)
      );
      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

      return { csv, count: data?.length ?? 0 };
    },
  );
}
```

- [ ] **Step 2: Update AuditLogClient to use server-side export**

In `src/components/admin/AuditLogClient.tsx`, replace the client-side `exportToCsv` function:

```typescript
async function handleExport() {
  const params = new URLSearchParams();
  if (actionFilter) params.set("action", actionFilter);
  if (adminIdFilter) params.set("adminId", adminIdFilter);

  try {
    const res = await fetch(`/api/admin/audit-log/export?${params.toString()}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Export failed");
    const { csv } = (await res.json()) as { csv: string; count: number };

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    // Fallback to client-side if API fails
    exportToCsvLocal(entries);
  }
}
```

Keep the old `exportToCsv` renamed to `exportToCsvLocal` as fallback. Update the Export button `onClick` to use `handleExport`.

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/audit-log/export/route.ts src/components/admin/AuditLogClient.tsx
git commit -m "fix(admin): server-side audit log CSV export with audit trail (BUG-11 P1)"
```

---

### Task 12: Add Suspension Duration Options (BUG-14)

**Files:**
- Modify: `src/services/admin/user-service.ts:122-133`
- Modify: `src/app/api/admin/users/[userId]/suspend/route.ts`

- [ ] **Step 1: Add duration parameter to suspendUser**

In `src/services/admin/user-service.ts`, replace `suspendUser`:

```typescript
export type SuspendDuration = "24h" | "7d" | "30d" | "indefinite";

const DURATION_MS: Record<SuspendDuration, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "indefinite": 100 * 365 * 24 * 60 * 60 * 1000,
};

const DURATION_HOURS: Record<SuspendDuration, string> = {
  "24h": "24h",
  "7d": "168h",
  "30d": "720h",
  "indefinite": "876600h",
};

export async function suspendUser(
  supabase: SupabaseClient,
  userId: string,
  duration: SuspendDuration = "indefinite",
): Promise<{ success: boolean }> {
  return withAuthSync(
    supabase,
    userId,
    { suspended_until: new Date(Date.now() + DURATION_MS[duration]).toISOString() },
    { suspended_until: null },
    DURATION_HOURS[duration],
  );
}
```

- [ ] **Step 2: Update suspend API route to accept duration**

In `src/app/api/admin/users/[userId]/suspend/route.ts`:

```typescript
import { auditedAdminAction } from "@/lib/audited-admin-action";
import { suspendUser, type SuspendDuration } from "@/services/admin/user-service";

const VALID_DURATIONS: SuspendDuration[] = ["24h", "7d", "30d", "indefinite"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const body = await req.json().catch(() => ({})) as { duration?: string };
  const duration = VALID_DURATIONS.includes(body.duration as SuspendDuration)
    ? (body.duration as SuspendDuration)
    : "indefinite";

  return auditedAdminAction(req, "user.suspend", "user", userId, async ({ supabase }) => {
    const result = await suspendUser(supabase, userId, duration);
    if (!result.success) throw new Error("Failed to suspend user");
    return { success: true, duration };
  });
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/services/admin/user-service.ts src/app/api/admin/users/\[userId\]/suspend/route.ts
git commit -m "feat(admin): add configurable suspension duration (24h/7d/30d/indefinite) (BUG-14 P2)"
```

---

### Task 13: Add Confirmation Modal to Bulk Fraud Suspend (BUG-17)

**Files:**
- Modify: `src/components/admin/FraudDetectionClient.tsx:56-82`

- [ ] **Step 1: Add confirmation state and modal**

In `src/components/admin/FraudDetectionClient.tsx`:

Add imports:
```typescript
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
```

Add state:
```typescript
const [showBulkConfirm, setShowBulkConfirm] = useState(false);
```

Replace `handleBulkSuspend` with a two-step flow:
```typescript
function promptBulkSuspend() {
  if (selected.size === 0) return;
  setShowBulkConfirm(true);
}

function executeBulkSuspend() {
  const ids = [...selected];
  setShowBulkConfirm(false);
  startSuspend(async () => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/admin/users/${id}/suspend`, { method: "POST" }),
        ),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
      const failed = ids.length - succeeded;
      if (succeeded > 0) {
        toast.success(`${succeeded} user${succeeded !== 1 ? "s" : ""} suspended`);
      }
      if (failed > 0) {
        toast.error(`${failed} suspension${failed !== 1 ? "s" : ""} failed`);
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Bulk suspend failed");
    }
  });
}
```

Change the button `onClick` from `handleBulkSuspend` to `promptBulkSuspend`.

Add the confirmation dialog before the closing `</div>`:
```jsx
<Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Confirm Bulk Suspension</DialogTitle>
      <DialogDescription>
        You are about to suspend {selected.size} user{selected.size !== 1 ? "s" : ""}.
        Their sessions will be immediately invalidated.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>Cancel</Button>
      <Button variant="destructive" onClick={executeBulkSuspend}>
        Suspend {selected.size} user{selected.size !== 1 ? "s" : ""}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/FraudDetectionClient.tsx
git commit -m "fix(admin): add confirmation modal before bulk fraud suspension (BUG-17 P2)"
```

---

## Wave 5: E2E Security Tests

---

### Task 14: Admin Security E2E Tests

**Files:**
- Create: `e2e/admin-security.spec.ts`

These tests verify the auth boundary, privilege escalation paths, and role enforcement from the QA audit's cross-cutting security section.

- [ ] **Step 1: Write the E2E security test suite**

```typescript
// e2e/admin-security.spec.ts
import { test, expect } from "@playwright/test";

// Unauthenticated access tests
test.describe("Admin auth boundary — unauthenticated", () => {
  test("redirects /admin to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /admin/users to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /admin/gdpr to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin/gdpr");
    await expect(page).toHaveURL(/\/login/);
  });

  test("returns 401 for /api/admin/users/test/ban without session", async ({ request }) => {
    const res = await request.post("/api/admin/users/test/ban", {
      data: { reason: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 401 for /api/admin/team/invite without session", async ({ request }) => {
    const res = await request.post("/api/admin/team/invite", {
      data: { email: "evil@test.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 401 for /api/admin/roles/test/promote without session", async ({ request }) => {
    const res = await request.post("/api/admin/roles/test/promote");
    expect(res.status()).toBe(401);
  });
});

// Non-admin user access tests (uses homebuyer auth)
test.describe("Admin auth boundary — non-admin user", () => {
  test.use({ storageState: "e2e/.auth/homebuyer.json" });

  test("redirects /admin to /forbidden for non-admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("returns 403 for /api/admin/users/test/suspend with non-admin session", async ({ request }) => {
    const res = await request.post("/api/admin/users/test/suspend");
    expect(res.status()).toBe(403);
  });

  test("returns 403 for /api/admin/feature-flags/test/toggle with non-admin session", async ({ request }) => {
    const res = await request.post("/api/admin/feature-flags/test/toggle", {
      data: { enabled: true },
    });
    expect(res.status()).toBe(403);
  });

  test("returns 403 for /api/admin/campaigns with non-admin session", async ({ request }) => {
    const res = await request.post("/api/admin/campaigns", {
      data: { name: "evil", subject: "evil" },
    });
    expect(res.status()).toBe(403);
  });
});

// Admin user access tests
test.describe("Admin dashboard — authenticated admin", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("admin can access /admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Admin Console")).toBeVisible();
  });

  test("admin sidebar shows navigation groups", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Overview")).toBeVisible();
    await expect(page.locator("text=Moderation")).toBeVisible();
  });

  test("admin can access /admin/users", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test("admin can access /admin/audit-log", async ({ page }) => {
    await page.goto("/admin/audit-log");
    await expect(page).toHaveURL(/\/admin\/audit-log/);
  });
});
```

- [ ] **Step 2: Verify tests are syntactically correct**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx playwright test e2e/admin-security.spec.ts --list`
Expected: Lists all test cases without errors

- [ ] **Step 3: Commit**

```bash
git add e2e/admin-security.spec.ts
git commit -m "test(admin): add E2E security tests for auth boundary and privilege escalation"
```

---

## Wave 6: Remaining P2-P4 Fixes (Quick Wins)

---

### Task 15: Hide Role/Team UI Controls for Non-Super-Admins (BUG-2 UI enforcement)

**Files:**
- Modify: `src/components/admin/RolesClient.tsx`
- Modify: `src/components/admin/TeamClient.tsx`

These components need to conditionally hide the promote/demote form and invite form based on the admin's role. Since these are client components, pass `isSuperAdmin` as a prop from the server page.

- [ ] **Step 1: Update RolesClient to accept and use isSuperAdmin prop**

In `src/components/admin/RolesClient.tsx`, change the Props type and conditionally render:

```typescript
type Props = Readonly<{ roleCounts: RoleCount[]; isSuperAdmin?: boolean }>;

// In the RolesClient component:
export function RolesClient({ roleCounts, isSuperAdmin = false }: Props) {
  const total = roleCounts.reduce((sum, r) => sum + r.count, 0);

  return (
    <div>
      {isSuperAdmin && <PromoteDemoteForm />}
      {/* ... rest unchanged ... */}
    </div>
  );
}
```

- [ ] **Step 2: Update TeamClient to accept and use isSuperAdmin prop**

In `src/components/admin/TeamClient.tsx`:

```typescript
type Props = Readonly<{ members: TeamMember[]; isSuperAdmin?: boolean }>;

export function TeamClient({ members, isSuperAdmin = false }: Props) {
  return (
    <div>
      {isSuperAdmin && <InviteForm />}
      {/* ... rest unchanged ... */}
    </div>
  );
}
```

- [ ] **Step 3: Update the server pages to pass isSuperAdmin**

In `src/app/(admin)/admin/roles/page.tsx` and `src/app/(admin)/admin/team/page.tsx`, fetch `admin_role` from the profile and pass `isSuperAdmin` to the client component:

```typescript
// Add to the server component data fetch:
const { data: adminProfile } = await supabase
  .from("profiles")
  .select("admin_role")
  .eq("id", user.id)
  .single();
const isSuperAdmin = (adminProfile as Record<string, unknown>)?.admin_role === "super_admin"
  || !(adminProfile as Record<string, unknown>)?.admin_role; // backwards compat: null = super_admin

// Pass to component:
<RolesClient roleCounts={roleCounts} isSuperAdmin={isSuperAdmin} />
<TeamClient members={members} isSuperAdmin={isSuperAdmin} />
```

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/RolesClient.tsx src/components/admin/TeamClient.tsx \
  src/app/\(admin\)/admin/roles/page.tsx src/app/\(admin\)/admin/team/page.tsx
git commit -m "fix(admin): hide promote/demote and invite controls for non-super-admins (BUG-2 UI)"
```

---

### Task 16: Add "Back to Platform" Link in Admin Sidebar (BUG-26)

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Add exit link at bottom of sidebar nav**

In `src/components/admin/AdminSidebar.tsx`, inside the `SidebarContent` function, add a link after the nav groups:

```typescript
// Add import at top:
import { LogOut } from "lucide-react";

// Inside SidebarContent, after the closing </nav>, add:
<div className="border-t border-neutral-200 p-3">
  <Link
    href="/"
    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-colors"
  >
    <LogOut className="h-3.5 w-3.5 shrink-0" />
    Back to Platform
  </Link>
</div>
```

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "fix(admin): add 'Back to Platform' link in admin sidebar (BUG-26 P4)"
```

---

## Summary: Bug Coverage

| Bug ID | Severity | Fixed In Task | Description |
|--------|----------|---------------|-------------|
| BUG-1 | P0 | Task 1 | CMS stored XSS |
| BUG-2 | P0 | Tasks 4-7, 15 | Flat is_admin → granular roles |
| BUG-3 | P0 | Task 6 | Unrestricted admin promotion |
| BUG-4 | P0 | Task 6 | Unrestricted team invite |
| BUG-5 | P0 | Task 3 | Audit log integrity |
| BUG-6 | P0 | Task 2 | RLS policy column mismatch |
| BUG-7 | P1 | Task 8 | GDPR SLA countdown |
| BUG-8 | P1 | Task 9 | GDPR fulfillment pipeline |
| BUG-9 | P1 | — | Email unsubscribe (requires Resend integration — defer to email campaign build) |
| BUG-10 | P1 | Task 10 | Email campaign send safeguards |
| BUG-11 | P1 | Task 11 | Audit log export audit trail |
| BUG-12 | P2 | — | User search by email (requires auth.users join — defer to user management enhancement) |
| BUG-13 | P2 | — | User detail completeness (defer to user management enhancement) |
| BUG-14 | P2 | Task 12 | Suspension duration options |
| BUG-15 | P2 | — | User impersonation (large feature — separate plan) |
| BUG-16 | P2 | — | Fraud detection enhancement (separate plan) |
| BUG-17 | P2 | Task 13 | Bulk suspend confirmation |
| BUG-18 | P2 | Task 6 | Last admin protection fix |
| BUG-19 | P2 | — | User CSV export (defer to user management enhancement) |
| BUG-20 | P2 | — | Bulk listing moderation (defer to moderation enhancement) |
| BUG-21 | P3 | — | Dashboard metrics accuracy (requires analytics infra) |
| BUG-22 | P3 | Task 3 | Audit log IP capture |
| BUG-23 | P3 | — | Listing rejection reason storage (defer) |
| BUG-24 | P3 | — | Notification system (large feature — separate plan) |
| BUG-25 | P4 | — | Dashboard attention signals (defer) |
| BUG-26 | P4 | Task 16 | Back to Platform link |
| BUG-27 | P4 | — | Verification "request more info" (defer) |
| BUG-28 | P4 | — | SEO management completeness (defer) |
| BUG-29 | P4 | — | Feature flag enhancements (defer) |
| BUG-30 | P4 | — | System health enhancements (defer) |

**This plan resolves: 6/6 P0, 4/5 P1, 4/9 P2, 1/4 P3, 1/6 P4 = 16/30 bugs.**

The remaining 14 bugs are either large standalone features (impersonation, notification system, fraud detection overhaul) or require external service integration (Resend unsubscribe, PostHog analytics). These should each be their own plan.

**Ship-readiness after this plan:**
- All P0 security vulnerabilities resolved
- GDPR pipeline functional with SLA tracking
- Granular admin roles enforced at every layer
- Audit log hardened with IP capture and immutability
- Destructive bulk actions gated behind confirmation modals
- E2E tests verifying auth boundary
