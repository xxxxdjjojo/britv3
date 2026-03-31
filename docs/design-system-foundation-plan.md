# BRITESTATE — Design System Foundation Fix Plan

## FAANG-Level Implementation Guide

**Date:** 2026-03-31
**Branch:** `feature/provider-3plus3-invite-pipeline`
**Scope:** Fix CSS/design foundations before Stitch screen implementation
**Estimated:** ~165 lines across 3 files + 1 dependency install

---

## 0. WHY THIS PLAN EXISTS

The previous Stage 6 work only did mechanical color token replacements (hardcoded hex -> Tailwind tokens) **without ever fetching the actual Stitch screen designs**. When we finally fetched the 14 Stage 6 screens from Stitch project `15021896094385971092`, they showed **completely different layouts and features** than what's built.

Before re-implementing any screens from Stitch, the design system foundation must be correct:
- Wrong color tokens = every screen renders wrong
- Missing animations = static where Stitch shows motion
- Missing letter-spacing = headings don't match Stitch
- Missing surface hierarchy in dark mode = broken dark theme

**Source of truth:** `britestatestyle.txt` (design tokens) + Stitch project screens (visual truth)

---

## 1. CURRENT STATE AUDIT

### What's Working (~40%)
| Item | Status | Location |
|------|--------|----------|
| CSS custom properties (50+ tokens) | OK | `src/app/globals.css` @theme inline |
| Light/Dark mode | OK | `:root` + `.dark` blocks |
| Plus Jakarta Sans + Inter fonts | OK | `src/app/layout.tsx` lines 14-26 |
| Tailwind v4 CSS-first config | OK | No tailwind.config.ts needed |
| 35+ Shadcn UI components | OK | `src/components/ui/` |
| Surface hierarchy (light only) | Partial | globals.css lines 101-105 |
| Dashboard sidebar + main layout | OK | `src/app/(protected)/dashboard/layout.tsx` |
| Touch targets 44x44 + safe areas | OK | globals.css lines 195-198 |
| Reduced motion media query | OK | globals.css lines 253-262 |

### Critical Gaps Found
| Gap | Impact | Fix Phase |
|-----|--------|-----------|
| `--color-brand-secondary` is `#A07D2E` (should be `#D4A853`) | Gold buttons/badges wrong color | A |
| `--color-neutral-400` is `#858593` (should be `#9E9EAB`) | Muted text slightly wrong | A |
| No dark mode surface hierarchy | Dark theme has no depth | A |
| No `--color-on-surface` defined (but used in code) | Runtime CSS errors possible | A |
| No glassmorphism utility | Stitch floating headers can't render | A |
| No `-0.02em` letter-spacing on headings | Headings don't match Stitch | B |
| No JetBrains Mono font | Code/mono text uses system fallback | B |
| Zero `@keyframes` defined | No fadeIn/slideUp/shimmer animations | C |
| No motion easing token `cubic-bezier(0.22, 1, 0.36, 1)` | Can't match Stitch transitions | C |
| No framer-motion installed | Can't do interactive animations | C |
| Button missing `accent`/`premium` variants | Can't render Stitch CTA buttons | D |
| Button missing `loading`/icon props | Can't match Stitch loading states | D |
| Never validated Stitch -> Implementation workflow | No proof any screen matches Stitch | E |

---

## 2. PHASE A — Fix globals.css Token Mismatches & Gaps

**File:** `src/app/globals.css`

### Task A1: Fix color mismatches

**In `@theme inline` block (~line 56-57):**
```css
/* BEFORE */
--color-brand-secondary: #A07D2E;
/* AFTER */
--color-brand-secondary: #D4A853;
```

```css
/* BEFORE */
--color-neutral-400: #858593;
/* AFTER */
--color-neutral-400: #9E9EAB;
```

**In `:root` block (~line 134):**
```css
/* BEFORE */
--chart-3: #A07D2E;
/* AFTER */
--chart-3: #D4A853;
```

**Also fix in:** `src/components/search/SearchMap.tsx` — grep for `#A07D2E` and replace with `brand-secondary` token.

### Task A2: Add missing gradient tokens

**In `@theme inline` block, after `--color-brand-accent-light` (~line 59):**
```css
--color-brand-primary-dark: #003629;
--color-brand-secondary-dark: #7B5804;
```

### Task A3: Add `--color-on-surface`

**In `@theme inline` block, after surface hierarchy (~line 106):**
```css
--color-on-surface: #1a1c1c;
```

**In `.dark` block (~line 181, before closing brace):**
```css
--color-on-surface: #F8F8FA;
```

### Task A4: Add dark mode surface hierarchy

**In `.dark` block, add after existing token overrides:**
```css
/* Surface hierarchy (dark) */
--color-surface: #171719;
--color-surface-container-low: #1e1e20;
--color-surface-container: #252527;
--color-surface-container-high: #2e2e33;
--color-surface-container-highest: #373739;
```

### Task A5: Add glassmorphism utility

**After `.focus-ring` block (~line 219), before `@layer base`:**
```css
/* === Glassmorphism (Invisible Estate) === */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.dark .glass {
  background: rgba(23, 23, 25, 0.8);
}
.glass-sm {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.dark .glass-sm {
  background: rgba(23, 23, 25, 0.6);
}
```

### Task A6: Add section gap spacing token

**In `@theme inline` block, after breakpoint (~line 109):**
```css
--spacing-section: 7rem;
```

---

## 3. PHASE B — Typography Foundation

### Task B1: Add letter-spacing to headings

**File:** `src/app/globals.css` (line 240-242)

```css
/* BEFORE */
h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}

/* AFTER */
h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.02em;
}
```

### Task B2: Import JetBrains Mono font

**File:** `src/app/layout.tsx`

Add import (after Inter definition, ~line 26):
```ts
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";

// ... existing plusJakartaSans and inter definitions ...

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
```

Add to body className (find the `<body>` tag):
```tsx
<body className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
```

### Task B3: Update font-mono token

**File:** `src/app/globals.css` (line 13)

```css
/* BEFORE */
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

/* AFTER */
--font-mono: var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

---

## 4. PHASE C — Animation System

**File:** `src/app/globals.css`

### Task C1: Add motion tokens

**In `@theme inline` block, after shadow definitions (~line 98):**
```css
/* --- Motion (Invisible Estate design system) --- */
--ease-default: cubic-bezier(0.22, 1, 0.36, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 600ms;
```

### Task C2: Add keyframes

**Insert before `@media (prefers-reduced-motion: reduce)` (~line 253):**
```css
/* === Animation Keyframes (Invisible Estate) === */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Task C3: Add animation utility tokens

**In `@theme inline` block, after motion tokens:**
```css
/* --- Animation Utilities --- */
--animate-fade-in: fadeIn var(--duration-normal) var(--ease-default) both;
--animate-fade-out: fadeOut var(--duration-normal) var(--ease-default) both;
--animate-slide-up: slideUp var(--duration-slow) var(--ease-default) both;
--animate-slide-down: slideDown var(--duration-slow) var(--ease-default) both;
--animate-slide-in-right: slideInRight var(--duration-slow) var(--ease-default) both;
--animate-scale-in: scaleIn var(--duration-normal) var(--ease-default) both;
--animate-shimmer: shimmer 1.5s infinite linear;
```

### Task C4: Install framer-motion

```bash
cd britv3.0 && pnpm add framer-motion
```

---

## 5. PHASE D — Button Component Upgrade

**File:** `src/components/ui/button.tsx`

### Task D1: Add missing variants

**In `buttonVariants` -> `variants` -> `variant` object (~line 13-24), add after `link`:**
```ts
accent:
  "bg-brand-accent text-white hover:bg-brand-accent/90 focus-visible:border-brand-accent/40 focus-visible:ring-brand-accent/20",
premium:
  "bg-brand-secondary text-neutral-950 hover:bg-brand-secondary/90 focus-visible:border-brand-secondary/40 focus-visible:ring-brand-secondary/20",
"outline-destructive":
  "border-error text-error bg-background hover:bg-error-light focus-visible:border-error/40 focus-visible:ring-error/20",
```

### Task D2: Add `loading` prop

**Update `ButtonProps` type (~line 46-50):**
```ts
type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
  };
```

**Update `Button` function to handle new props:**
```tsx
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  ...props
}: ButtonProps) {
  const resolvedClassName = cn(
    buttonVariants({ variant, size }),
    fullWidth && "w-full",
    loading && "pointer-events-none",
    className,
  );
  // ... existing asChild logic ...

  return (
    <ButtonPrimitive
      data-slot="button"
      className={resolvedClassName}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span data-icon="inline-start">{leftIcon}</span>}
          {children}
          {rightIcon && <span data-icon="inline-end">{rightIcon}</span>}
        </>
      )}
    </ButtonPrimitive>
  );
}
```

**Add import at top:**
```ts
import { Loader2 } from "lucide-react";
```

---

## 6. PHASE E — Stitch Workflow Validation

**Target:** Login screen (simple, exercises all foundation tokens)

### E1: Fetch login screen from Stitch

**Stitch Project ID:** `15021896094385971092`
**Login Screen ID:** `7fd902bb1e0e41b4a7a7e342c921220b`

Use the Stitch SDK script at `/tmp/fetch-stitch-screens.mjs` (already tested and working) or fetch via Stitch MCP:
```
mcp__stitch__get_screen with screenName: "projects/15021896094385971092/screens/7fd902bb1e0e41b4a7a7e342c921220b"
```

Download both the screenshot (PNG) and HTML from the response URLs.

### E2: Extract design spec from Stitch

From the Stitch HTML/screenshot, extract:
- Exact background colors (surface hierarchy usage)
- Heading font sizes, weights, letter-spacing
- Button colors, border-radius, padding
- Input field styling
- Spacing between elements (to 4px grid)
- Any animations/transitions visible

### E3: Compare against current implementation

**File:** `src/app/(auth)/login/page.tsx` + `src/components/auth/LoginForm.tsx`

Document every deviation:
- Color mismatches
- Typography differences
- Spacing differences
- Missing components
- Layout structure differences

### E4: Implement pixel-perfect fixes

Apply the design spec from E2 to match Stitch exactly, using the now-corrected tokens from Phases A-D.

### E5: Visual verification with browse tool

```bash
# Start dev server
pnpm dev

# Navigate and screenshot
$B goto http://localhost:3000/login
$B viewport 1440x900
$B screenshot /tmp/login-desktop.png
$B viewport 390x844
$B screenshot /tmp/login-mobile.png
```

Compare screenshots against Stitch PNG. Flag any >4px deviations.

### E6: Success criteria

- [ ] Heading: Plus Jakarta Sans with -0.02em letter-spacing (verify in DevTools)
- [ ] Primary CTA button: `#1B4D3E` (brand-primary)
- [ ] Gold/secondary elements: `#D4A853` (NOT `#A07D2E`)
- [ ] Surface hierarchy creates visual depth
- [ ] No hardcoded hex in JSX
- [ ] Layout matches Stitch within 4px tolerance at 1440px
- [ ] Mobile layout matches at 390px
- [ ] `pnpm build` TypeScript passes
- [ ] No new lint errors

---

## 7. EXECUTION ORDER & DEPENDENCIES

```
Phase A (globals.css tokens)    ──┐
Phase B (typography)             ──├── Can run in parallel (different sections)
Phase C (animations + keyframes) ──┘
              │
              ▼
Phase D (button component) ── needs Phase A colors to be correct
              │
              ▼
Phase E (Stitch validation) ── integration test of A+B+C+D
```

---

## 8. VERIFICATION CHECKLIST

After all phases, run these commands:

```bash
# 1. Build check
pnpm build 2>&1 | grep -E "TypeScript|error"

# 2. Lint changed files
npx eslint src/app/globals.css src/app/layout.tsx src/components/ui/button.tsx

# 3. Grep for old color (should be 0)
grep -r "#A07D2E" src/

# 4. Verify letter-spacing applied
# (use browse tool DevTools or Chrome inspector)

# 5. Verify surface tokens in dark mode
# (toggle dark mode, inspect computed --color-surface)
```

---

## 9. STITCH SCREEN REFERENCE (All 14 Stage 6 Screens)

For the next session — these screens were successfully fetched from Stitch project `15021896094385971092`:

| Screen | Stitch ID | Screenshot |
|--------|-----------|------------|
| Provider Jobs Overview | `1bf6885e6b804bc994a1e3d99b78f23b` | `/tmp/stitch-stage6/jobs-overview.png` |
| Provider Job Detail | `c2575e99b4b54c848e477a07bdcb5530` | `/tmp/stitch-stage6/job-detail.png` |
| Provider Job Leads | `90f0352b5fdc4decb824844adf5aa3b1` | `/tmp/stitch-stage6/job-leads.png` |
| Availability Management | `92794e9c5140494c987d8bf6f12300fd` | `/tmp/stitch-stage6/availability.png` |
| Quotes Overview | `d977b225de3f4a3b8bf8e76ade7d679a` | `/tmp/stitch-stage6/quotes-overview.png` |
| Quote Builder | `2187d52e49fb491996181c7d523814e5` | `/tmp/stitch-stage6/quote-builder.png` |
| Provider Payments | `b4c407f198bd4fbd97dd16f021fd66e5` | `/tmp/stitch-stage6/payments.png` |
| Billing & Earnings | `6f7f39b6af624d989a530f1f61c5fecb` | `/tmp/stitch-stage6/billing-earnings.png` |
| Provider Profile Settings | `4a5686c82177496ea49754e172071ba8` | `/tmp/stitch-stage6/profile-settings.png` |
| Provider Work Portfolio | `4c92c8b20d0345ddb6f068820d18eaa2` | `/tmp/stitch-stage6/work-portfolio.png` |
| Credentials & Documents | `2efca7c05f2343d49af1760f7c874f43` | `/tmp/stitch-stage6/credentials.png` |
| Verification Hub | `07419fc42a6b44f7a2394aa575823621` | `/tmp/stitch-stage6/verification-hub.png` |
| Badge Management | `ea191b5152b740bfa0aceaa141a3eae9` | `/tmp/stitch-stage6/badge-management.png` |
| Provider Analytics | `955e25e2bad34c8880579113e37d8494` | `/tmp/stitch-stage6/analytics.png` |

**Note:** `/tmp/` screenshots will be deleted on reboot. Re-fetch using the Stitch SDK script:
```bash
cd /tmp && node fetch-stitch-screens.mjs
```

The script is at `/tmp/fetch-stitch-screens.mjs` and uses API key from `.mcp.json`.

---

## 10. AFTER FOUNDATION IS FIXED — STITCH IMPLEMENTATION PROTOCOL

Once this plan is complete, every future stage follows this per-screen protocol:

1. **FETCH** — `mcp__stitch__get_screen` or Stitch SDK to get screenshot + HTML
2. **SPEC** — Extract exact colors, typography, spacing, components from Stitch HTML
3. **IMPLEMENT** — Build/restyle to match pixel-for-pixel using design tokens
4. **VERIFY** — Screenshot with browse tool at 1440px + 390px
5. **COMPARE** — Side-by-side with Stitch screenshot, flag >4px deviations
6. **FIX** — Self-healing loop (max 3 iterations)
7. **SIGN-OFF** — Visual fidelity PASS, build PASS, lint PASS

Full protocol at: `docs/stitch-implementation-protocol.md`
