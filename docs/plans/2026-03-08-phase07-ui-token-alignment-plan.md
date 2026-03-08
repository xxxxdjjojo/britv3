# Phase 07 UI — Design Token Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all generic Tailwind color utilities (`gray-*`, `amber-*`, `indigo-*`, `blue-*`, `red-*`, `green-*`) and `clsx` with Britestate design tokens and `cn()` across all Phase 07 UI files; upgrade AdminSidebar to match the britestatestyle.txt spec.

**Architecture:** Pure styling pass — no logic changes. Each task targets a logical group of files, runs a grep verify, builds, and commits. AdminSidebar gets a full rewrite to add icon support and brand-primary active state.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · `cn()` from `@/lib/utils` · Lucide React

**Working directory for all commands:** `/Users/joanflerinbig/Documents/britv3.0`

---

## Token Reference (memorise before starting)

| Replace | With |
|---------|------|
| `gray-900` | `neutral-900` |
| `gray-800` | `neutral-800` |
| `gray-700` | `neutral-700` |
| `gray-600` | `neutral-600` |
| `gray-500` | `neutral-500` |
| `gray-400` | `neutral-400` |
| `gray-300` | `neutral-300` |
| `gray-200` | `neutral-200` |
| `gray-100` | `neutral-100` |
| `gray-50` | `neutral-50` |
| `indigo-50` / `indigo-100` | `brand-primary-lighter` |
| `indigo-600` / `indigo-700` | `brand-primary` |
| `amber-500` / `yellow-*` | `warning` |
| `red-50` / `red-100` | `error-light` |
| `red-600` / `red-700` | `error` |
| `green-50` / `green-100` | `success-light` |
| `green-600` / `green-700` | `success` |
| `blue-50` / `blue-100` | `brand-accent-light` |
| `blue-600` / `blue-700` | `brand-accent` |
| `clsx(` | `cn(` (update import too) |

---

## Task 1: OfflineIndicator + InstallPrompt + PushManager

**Files:**
- Modify: `src/components/pwa/OfflineIndicator.tsx`
- Modify: `src/components/pwa/InstallPrompt.tsx`
- Modify: `src/components/pwa/PushManager.tsx`

**Step 1: Update OfflineIndicator**

Replace entire file content:

```tsx
"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-warning py-1 text-center text-sm text-white">
      You&apos;re offline &mdash; some features may be unavailable
    </div>
  );
}
```

**Step 2: Update InstallPrompt and PushManager**

Open `src/components/pwa/InstallPrompt.tsx` and `src/components/pwa/PushManager.tsx`.
Apply the token reference table: replace every `gray-*`, `indigo-*`, `blue-*`, `clsx` occurrence.
Common patterns to find in these files:
- Any `bg-gray-*` → `bg-neutral-*`
- Any `text-gray-*` → `text-neutral-*`
- Any `border-gray-*` → `border-neutral-*`
- Any `bg-blue-*` → `bg-brand-accent` / `bg-brand-accent-light`
- Any `text-blue-*` → `text-brand-accent`
- `from clsx` import → `import { cn } from "@/lib/utils"`; `clsx(` → `cn(`

**Step 3: Verify no violations**

```bash
grep -n "gray-\|amber-\|indigo-\|clsx" src/components/pwa/*.tsx
```
Expected: no output.

**Step 4: Build check**

```bash
pnpm build 2>&1 | tail -15
```
Expected: exits 0.

**Step 5: Commit**

```bash
git add src/components/pwa/
git commit -m "style(pwa): replace generic colors with Britestate design tokens"
```

---

## Task 2: BottomTabBar + PullToRefresh

**Files:**
- Modify: `src/components/mobile/BottomTabBar.tsx`
- Modify: `src/components/mobile/BottomTabBarWrapper.tsx`
- Modify: `src/components/mobile/PullToRefresh.tsx`
- Modify: `src/components/mobile/PullToRefreshWrapper.tsx`

**Step 1: Update BottomTabBar active state**

Open `src/components/mobile/BottomTabBar.tsx`.
Find the active tab styling. Replace any `text-blue-*` / `text-indigo-*` active colour with `text-brand-primary`.
Replace any `gray-*` inactive colour with `neutral-*`.
Replace any `clsx` with `cn` from `@/lib/utils`.

Key patterns:
- Active icon/label: → `text-brand-primary`
- Inactive icon/label: → `text-neutral-500`
- Border/bg: `border-gray-200` → `border-neutral-200`, `bg-white` stays

**Step 2: Update PullToRefresh + wrappers**

Open `src/components/mobile/PullToRefresh.tsx` and both wrapper files.
Apply token table replacements throughout.

**Step 3: Verify**

```bash
grep -n "gray-\|amber-\|indigo-\|blue-\|clsx" src/components/mobile/*.tsx
```
Expected: no output.

**Step 4: Commit**

```bash
git add src/components/mobile/
git commit -m "style(mobile): replace generic colors with Britestate design tokens"
```

---

## Task 3: AdminSidebar — full rewrite

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

**Step 1: Replace the entire file**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BadgeCheck,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type ExternalNavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { label: "Verifications", href: "/admin/verifications", icon: BadgeCheck },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
];

const EXTERNAL_LINKS: ExternalNavItem[] = [
  { label: "Supabase Dashboard", href: "https://supabase.com/dashboard" },
  { label: "Sentry Dashboard", href: "https://sentry.io" },
  { label: "PostHog Dashboard", href: "https://app.posthog.com" },
  { label: "Stripe Dashboard", href: "https://dashboard.stripe.com" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-neutral-200 bg-white">
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <span className="font-heading text-lg font-semibold text-neutral-900">
          Britestate Admin
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-brand-primary bg-brand-primary-lighter text-brand-primary"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          External Dashboards
        </p>
        <div className="flex flex-col gap-1">
          {EXTERNAL_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Verify no violations**

```bash
grep -n "gray-\|indigo-\|clsx" src/components/admin/AdminSidebar.tsx
```
Expected: no output.

**Step 3: Build check**

```bash
pnpm build 2>&1 | tail -15
```
Expected: exits 0.

**Step 4: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "style(admin): upgrade AdminSidebar to Britestate design tokens and brand-primary active state"
```

---

## Task 4: CountCard + Admin Dashboard page

**Files:**
- Modify: `src/components/admin/CountCard.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/layout.tsx`

**Step 1: Replace CountCard**

```tsx
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

type CountCardProps = Readonly<{
  title: string;
  count: number;
  href: string;
  icon: string;
}>;

export function CountCard({ title, count, href, icon }: CountCardProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[icon];

  return (
    <Link
      href={href}
      className="block rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
            <Icon className="h-5 w-5 text-brand-primary" />
          </div>
        ) : null}
        <div>
          <p className="text-3xl font-bold text-neutral-900">
            {count.toLocaleString()}
          </p>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Update Admin Dashboard page**

Replace `text-gray-900` → `text-neutral-900`, `text-gray-500` → `text-neutral-500`, and add `font-heading` to the h1:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getAdminCounts } from "@/services/admin-service";
import { CountCard } from "@/components/admin/CountCard";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const counts = await getAdminCounts(supabase);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of platform activity and content moderation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <CountCard
          title="Total Users"
          count={counts.totalUsers}
          href="/admin/users"
          icon="Users"
        />
        <CountCard
          title="Active Listings"
          count={counts.activeListings}
          href="/admin/moderation"
          icon="Building2"
        />
        <CountCard
          title="Pending Verifications"
          count={counts.pendingVerifications}
          href="/admin/verifications"
          icon="BadgeCheck"
        />
        <CountCard
          title="Open Reports"
          count={counts.openReports}
          href="/admin/moderation"
          icon="ShieldAlert"
        />
        <CountCard
          title="Total Reviews"
          count={counts.totalReviews}
          href="/admin/reviews"
          icon="Star"
        />
      </div>
    </div>
  );
}
```

**Step 3: Update admin layout**

Open `src/app/(admin)/layout.tsx`. Apply token table: replace any `gray-*` with `neutral-*`.

**Step 4: Verify**

```bash
grep -n "gray-\|indigo-\|amber-\|clsx" src/components/admin/CountCard.tsx src/app/\(admin\)/admin/page.tsx src/app/\(admin\)/layout.tsx
```
Expected: no output.

**Step 5: Commit**

```bash
git add src/components/admin/CountCard.tsx src/app/\(admin\)/admin/page.tsx src/app/\(admin\)/layout.tsx
git commit -m "style(admin): update CountCard and dashboard page to Britestate design tokens"
```

---

## Task 5: UserTable + UserDetailModal + UserManagementClient

**Files:**
- Modify: `src/components/admin/UserTable.tsx`
- Modify: `src/components/admin/UserDetailModal.tsx`
- Modify: `src/components/admin/UserManagementClient.tsx`
- Modify: `src/app/(admin)/admin/users/page.tsx`

**Step 1: Token-pass all four files**

Open each file. Apply token table replacements:
- `gray-*` → `neutral-*`
- `red-*` → `error` / `error-light`
- `green-*` → `success` / `success-light`
- `blue-*` → `brand-accent` / `brand-accent-light`
- `indigo-*` → `brand-primary` / `brand-primary-lighter`
- `clsx(` → `cn(` — update import to `import { cn } from "@/lib/utils"`; remove `import { clsx } from "clsx"`

Status badge patterns (common in UserTable):
- Active/green badge: `bg-success-light text-success`
- Suspended/red badge: `bg-error-light text-error`
- Pending/amber badge: `bg-warning-light text-warning`

**Step 2: Verify**

```bash
grep -n "gray-\|amber-\|indigo-\|blue-\|red-\|green-\|clsx" \
  src/components/admin/UserTable.tsx \
  src/components/admin/UserDetailModal.tsx \
  src/components/admin/UserManagementClient.tsx \
  src/app/\(admin\)/admin/users/page.tsx
```
Expected: no output.

**Step 3: Build check**

```bash
pnpm build 2>&1 | tail -15
```
Expected: exits 0.

**Step 4: Commit**

```bash
git add src/components/admin/UserTable.tsx src/components/admin/UserDetailModal.tsx src/components/admin/UserManagementClient.tsx src/app/\(admin\)/admin/users/page.tsx
git commit -m "style(admin): update user management components to Britestate design tokens"
```

---

## Task 6: ModerationQueue

**Files:**
- Modify: `src/components/admin/ModerationQueue.tsx`
- Modify: `src/components/admin/ModerationQueueClient.tsx`
- Modify: `src/app/(admin)/admin/moderation/page.tsx`

**Step 1: Token-pass all three files**

Apply token table. Severity badge patterns in ModerationQueue:
- `severity === "high"`: `bg-error-light text-error`
- `severity === "medium"`: `bg-warning-light text-warning`
- `severity === "low"`: `bg-neutral-100 text-neutral-600`

**Step 2: Verify**

```bash
grep -n "gray-\|amber-\|indigo-\|blue-\|red-\|green-\|clsx" \
  src/components/admin/ModerationQueue.tsx \
  src/components/admin/ModerationQueueClient.tsx \
  src/app/\(admin\)/admin/moderation/page.tsx
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/components/admin/ModerationQueue.tsx src/components/admin/ModerationQueueClient.tsx src/app/\(admin\)/admin/moderation/page.tsx
git commit -m "style(admin): update moderation queue to Britestate design tokens"
```

---

## Task 7: VerificationQueue

**Files:**
- Modify: `src/components/admin/VerificationQueue.tsx`
- Modify: `src/components/admin/VerificationQueueClient.tsx`
- Modify: `src/app/(admin)/admin/verifications/page.tsx`

**Step 1: Token-pass all three files**

Verification status badge patterns:
- Pending: `bg-warning-light text-warning`
- Approved: `bg-success-light text-success`
- Rejected: `bg-error-light text-error`

Apply full token table across all three files.

**Step 2: Verify**

```bash
grep -n "gray-\|amber-\|indigo-\|blue-\|red-\|green-\|clsx" \
  src/components/admin/VerificationQueue.tsx \
  src/components/admin/VerificationQueueClient.tsx \
  src/app/\(admin\)/admin/verifications/page.tsx
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/components/admin/VerificationQueue.tsx src/components/admin/VerificationQueueClient.tsx src/app/\(admin\)/admin/verifications/page.tsx
git commit -m "style(admin): update verification queue to Britestate design tokens"
```

---

## Task 8: ReviewModerationQueue

**Files:**
- Modify: `src/components/admin/ReviewModerationQueue.tsx`
- Modify: `src/components/admin/ReviewModerationQueueClient.tsx`
- Modify: `src/app/(admin)/admin/reviews/page.tsx`

**Step 1: Token-pass all three files**

Apply full token table. Star rating colours if present: `text-brand-secondary` (gold).

**Step 2: Verify**

```bash
grep -n "gray-\|amber-\|indigo-\|blue-\|red-\|green-\|clsx" \
  src/components/admin/ReviewModerationQueue.tsx \
  src/components/admin/ReviewModerationQueueClient.tsx \
  src/app/\(admin\)/admin/reviews/page.tsx
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/components/admin/ReviewModerationQueue.tsx src/components/admin/ReviewModerationQueueClient.tsx src/app/\(admin\)/admin/reviews/page.tsx
git commit -m "style(admin): update review moderation queue to Britestate design tokens"
```

---

## Task 9: Help + Contact pages

**Files:**
- Modify: `src/app/(main)/help/page.tsx`
- Modify: `src/app/(main)/contact/page.tsx`

**Step 1: Update help page**

Open `src/app/(main)/help/page.tsx`. Apply token table.
The file already uses `font-heading` and `neutral-*` in places — check for any remaining `gray-*`.

**Step 2: Update contact page**

Open `src/app/(main)/contact/page.tsx` (256 lines). Apply token table throughout:
- Form labels: `text-neutral-700`
- Input borders: `border-neutral-200`
- Error states: `text-error`, `border-error`
- Success state: `text-success`, `bg-success-light`
- Rate limited / info states: `text-warning`, `bg-warning-light`
- Button: ensure uses `<Button>` from `@/components/ui/button` with variant props — not raw `bg-blue-*`

**Step 3: Verify**

```bash
grep -n "gray-\|amber-\|indigo-\|clsx" \
  src/app/\(main\)/help/page.tsx \
  src/app/\(main\)/contact/page.tsx
```
Expected: no output.

**Step 4: Commit**

```bash
git add src/app/\(main\)/help/page.tsx src/app/\(main\)/contact/page.tsx
git commit -m "style(pages): update help and contact pages to Britestate design tokens"
```

---

## Task 10: Final scan + build + lint

**Step 1: Full violation scan across all Phase 07 files**

```bash
grep -rn "gray-\|amber-\|indigo-\|clsx" \
  src/components/pwa/ \
  src/components/mobile/ \
  src/components/admin/ \
  src/app/\(admin\)/ \
  src/app/\(main\)/help/ \
  src/app/\(main\)/contact/ \
  --include="*.tsx"
```
Expected: no output. If anything appears, fix it before continuing.

**Step 2: Full build**

```bash
pnpm build 2>&1 | tail -30
```
Expected: exits 0, zero TypeScript errors.

**Step 3: Lint**

```bash
pnpm lint 2>&1 | tail -20
```
Expected: exits 0, zero warnings.

**Step 4: Final commit (if any stragglers were fixed)**

```bash
git add -u
git status
# Only commit if there are actual changes
git commit -m "style: final token cleanup — remove remaining generic color utilities from Phase 07 UI"
```

---

## Done Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] `grep -rn "gray-\|amber-\|indigo-\|clsx" src/components/pwa/ src/components/mobile/ src/components/admin/ src/app/(admin)/` returns no output
- [ ] AdminSidebar active state uses `bg-brand-primary-lighter text-brand-primary border-l-2 border-brand-primary`
- [ ] AdminSidebar uses `cn()` not `clsx()`
- [ ] CountCard icon bg uses `bg-brand-primary-lighter` and `text-brand-primary`
- [ ] OfflineIndicator uses `bg-warning`
- [ ] All admin page headings use `font-heading`
