# Phase 07 UI — Britestate Design Token Alignment

**Date:** 2026-03-08
**Scope:** All Phase 07 UI files — admin components, PWA components, mobile components, help/contact pages
**Goal:** Replace generic Tailwind color utilities with Britestate design tokens; upgrade AdminSidebar to full spec

---

## Problem

All Phase 07 UI files were built but use generic Tailwind colors (`gray-*`, `amber-*`, `red-*`, `green-*`, `blue-*`) and `clsx` instead of the Britestate design token system and `cn()` utility. This breaks visual consistency with the rest of the platform.

---

## Token Replacement Rules

| Old utility | Britestate replacement |
|-------------|----------------------|
| `text-gray-900` | `text-neutral-900` |
| `text-gray-800` | `text-neutral-800` |
| `text-gray-700` | `text-neutral-700` |
| `text-gray-600` | `text-neutral-600` |
| `text-gray-500` | `text-neutral-500` |
| `text-gray-400` | `text-neutral-400` |
| `bg-gray-50` / `bg-gray-100` | `bg-neutral-50` / `bg-neutral-100` |
| `border-gray-*` | `border-neutral-*` |
| `bg-amber-500` / `bg-yellow-*` | `bg-warning` |
| `text-amber-*` | `text-warning` |
| `bg-red-*` | `bg-error` / `bg-error-light` |
| `text-red-*` | `text-error` |
| `border-red-*` | `border-error` |
| `bg-green-*` | `bg-success` / `bg-success-light` |
| `text-green-*` | `text-success` |
| `bg-blue-*` | `bg-brand-accent` / `bg-brand-accent-light` |
| `text-blue-*` | `text-brand-accent` |
| `clsx(...)` | `cn(...)` from `@/lib/utils` |

---

## Files to Update

### PWA Components
- `src/components/pwa/InstallPrompt.tsx` — token pass
- `src/components/pwa/OfflineIndicator.tsx` — `bg-amber-500` → `bg-warning`
- `src/components/pwa/PushManager.tsx` — token pass

### Mobile Components
- `src/components/mobile/BottomTabBar.tsx` — token pass; active state → `text-brand-primary`
- `src/components/mobile/PullToRefresh.tsx` — token pass

### Admin Components
- `src/components/admin/AdminSidebar.tsx`:
  - Replace `clsx` → `cn()` from `@/lib/utils`
  - Active state: `bg-brand-primary-lighter text-brand-primary border-l-2 border-brand-primary`
  - Add icon to each nav item (LayoutDashboard, Users, ShieldAlert, BadgeCheck, Star)
  - Hover state: `hover:bg-neutral-100 hover:text-neutral-900`
  - Collapsed icon-only mode at 64px width
- `src/components/admin/CountCard.tsx` — token pass; `gray-*`/`amber-*` → design tokens
- `src/components/admin/UserTable.tsx` — token pass
- `src/components/admin/UserDetailModal.tsx` — token pass
- `src/components/admin/UserManagementClient.tsx` — token pass
- `src/components/admin/ModerationQueue.tsx` — token pass; severity badges use semantic colors
- `src/components/admin/ModerationQueueClient.tsx` — token pass
- `src/components/admin/VerificationQueue.tsx` — token pass
- `src/components/admin/VerificationQueueClient.tsx` — token pass
- `src/components/admin/ReviewModerationQueue.tsx` — token pass
- `src/components/admin/ReviewModerationQueueClient.tsx` — token pass

### Admin Pages
- `src/app/(admin)/admin/page.tsx` — heading → `font-heading`; `gray-*` → `neutral-*`
- `src/app/(admin)/admin/users/page.tsx` — token pass
- `src/app/(admin)/admin/moderation/page.tsx` — token pass
- `src/app/(admin)/admin/verifications/page.tsx` — token pass
- `src/app/(admin)/admin/reviews/page.tsx` — token pass
- `src/app/(admin)/layout.tsx` — token pass

### Public Pages
- `src/app/(main)/help/page.tsx` — token pass; heading → `font-heading`
- `src/app/(main)/contact/page.tsx` — token pass

---

## AdminSidebar Upgrade Spec

Per britestatestyle.txt `<Sidebar>` component:

```
Nav item states:
- Default:   px-3 py-2 rounded-md text-neutral-700 hover:bg-neutral-100
- Active:    bg-brand-primary-lighter text-brand-primary font-medium border-l-2 border-brand-primary
- Icon:      20px, currentColor, mr-3

Structure:
- Logo area at top (64px height)
- Nav items with icon + label
- Bottom: "View Site" external link
```

---

## Success Criteria

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Zero `gray-*` / `amber-*` / `blue-*` / `green-*` / `red-*` color classes in Phase 07 files
- [ ] Zero `clsx` imports in Phase 07 files
- [ ] AdminSidebar active state uses brand-primary tokens
- [ ] AdminSidebar has icon per nav item
- [ ] All headings use `font-heading` class
