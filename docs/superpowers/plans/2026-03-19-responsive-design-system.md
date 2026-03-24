# Responsive Design System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page in Britestate truly responsive across Mobile (375px), Tablet (768px), and Desktop (1280px) — fixing 5 broken dashboard sidebars, creating reusable responsive primitives, and establishing patterns that make future pages responsive by default.

**Architecture:** Introduce a `BreakpointProvider` context that shares viewport state app-wide. Build `ResponsiveSidebar` wrapper that converts any sidebar content into a Sheet on mobile / collapsed on tablet / full on desktop. Add `Container`, `Grid`, `Stack` layout primitives from the britestatestyle.txt design spec. Fix all dashboard layouts to remove hardcoded `ml-64`/`pl-64`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (`@theme`), Radix Sheet (via Shadcn `ui/sheet`), existing `useIsMobile` hook pattern.

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/contexts/BreakpointContext.tsx` | Shared viewport breakpoint state via React context |
| `src/hooks/useBreakpoint.ts` | Consumer hook for BreakpointProvider |
| `src/components/responsive/Container.tsx` | Responsive max-width + padding wrapper |
| `src/components/responsive/Grid.tsx` | Responsive CSS Grid with breakpoint-aware column counts |
| `src/components/responsive/Stack.tsx` | Flexbox with responsive direction switching |
| `src/components/responsive/ResponsiveSidebar.tsx` | Sheet (mobile) / full (desktop) sidebar wrapper |
| `src/components/responsive/DevBreakpointIndicator.tsx` | Dev-mode only breakpoint badge |
| `src/hooks/useScrollDirection.ts` | Detects scroll up/down for auto-hide header |
| `src/hooks/useVirtualKeyboard.ts` | Detects virtual keyboard open/close |
| `src/__tests__/responsive/BreakpointContext.test.tsx` | Unit tests for breakpoint provider |
| `src/__tests__/responsive/Container.test.tsx` | Unit tests for Container |
| `src/__tests__/responsive/Grid.test.tsx` | Unit tests for Grid |
| `src/__tests__/responsive/Stack.test.tsx` | Unit tests for Stack |
| `src/__tests__/responsive/ResponsiveSidebar.test.tsx` | Unit tests for ResponsiveSidebar |

### Modified Files

| File | Change |
|------|--------|
| `src/app/globals.css` | Add custom breakpoints to `@theme` block |
| `src/app/layout.tsx` | Wrap with `BreakpointProvider` |
| `src/app/(protected)/layout.tsx` | Update BottomTabBar breakpoint to `lg:hidden` |
| `src/app/(protected)/dashboard/seller/layout.tsx` | Remove `ml-64`, use ResponsiveSidebar |
| `src/app/(protected)/dashboard/landlord/layout.tsx` | Remove `lg:pl-64`, use ResponsiveSidebar |
| `src/app/(protected)/dashboard/provider/layout.tsx` | Remove `lg:pl-64`, use ResponsiveSidebar |
| `src/app/(protected)/dashboard/broker/layout.tsx` | Remove `lg:pl-64`, use ResponsiveSidebar |
| `src/app/(admin)/layout.tsx` | Remove `ml-64`, use ResponsiveSidebar |
| `src/components/seller/SellerSidebar.tsx` | Extract content from fixed layout wrapper |
| `src/components/admin/AdminSidebar.tsx` | Extract content from fixed layout wrapper |
| `src/components/mobile/BottomTabBar.tsx` | Change `md:hidden` to `lg:hidden`, add keyboard hide |
| `src/components/layout/ProtectedHeader.tsx` | Add scroll-aware auto-hide on mobile |

---

## Wave 1: Foundation — Breakpoint System + Responsive Primitives

### Task 1: BreakpointProvider Context

**Files:**
- Create: `src/contexts/BreakpointContext.tsx`
- Create: `src/hooks/useBreakpoint.ts`
- Create: `src/__tests__/responsive/BreakpointContext.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/responsive/BreakpointContext.test.tsx
import { renderHook } from "@testing-library/react";
import { BreakpointProvider } from "@/contexts/BreakpointContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <BreakpointProvider>{children}</BreakpointProvider>;
}

describe("useBreakpoint", () => {
  it("returns a valid breakpoint name", () => {
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(["xs", "sm", "md", "lg", "xl", "2xl"]).toContain(result.current.breakpoint);
  });

  it("returns boolean helpers", () => {
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(typeof result.current.isMobile).toBe("boolean");
    expect(typeof result.current.isTablet).toBe("boolean");
    expect(typeof result.current.isDesktop).toBe("boolean");
  });

  it("defaults to xl during SSR (no window)", () => {
    // In happy-dom, window exists but matchMedia may not — we test the fallback
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    // Should not throw and should return a valid value
    expect(result.current.breakpoint).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/BreakpointContext.test.tsx`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Create the BreakpointContext**

```tsx
// src/contexts/BreakpointContext.tsx
"use client";

import { createContext, useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

type BreakpointState = {
  breakpoint: Breakpoint;
  isMobile: boolean;  // xs, sm (< 640px)
  isTablet: boolean;  // md, lg (640px–1023px)
  isDesktop: boolean; // xl, 2xl (>= 1024px — sidebar visible)
};

// Breakpoint values match Tailwind v4 defaults exactly:
//   sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
// Plus our custom xs: 375px from britestatestyle.txt
//
// Semantic mapping (used in isMobile/isTablet/isDesktop):
//   Mobile:  xs, sm (< 640px)  — phone-sized viewports
//   Tablet:  md, lg (640px–1023px) — tablet and small laptop
//   Desktop: xl, 2xl (>= 1024px) — full desktop with sidebar visible
//
// This aligns with our sidebar breakpoint: sidebars use `lg:flex` (1024px+),
// so isDesktop=true when the sidebar is visible.
const BREAKPOINTS: { name: Breakpoint; minWidth: number }[] = [
  { name: "2xl", minWidth: 1536 },
  { name: "xl", minWidth: 1280 },
  { name: "lg", minWidth: 1024 },
  { name: "md", minWidth: 768 },
  { name: "sm", minWidth: 640 },
  { name: "xs", minWidth: 375 },
  // anything below 375px also resolves to "xs"
];

function resolveBreakpoint(width: number): Breakpoint {
  for (const bp of BREAKPOINTS) {
    if (width >= bp.minWidth) return bp.name;
  }
  return "xs";
}

function deriveState(bp: Breakpoint): BreakpointState {
  return {
    breakpoint: bp,
    isMobile: bp === "xs" || bp === "sm",
    isTablet: bp === "md" || bp === "lg",
    isDesktop: bp === "xl" || bp === "2xl",
  };
}

// Default to "xl" (desktop) during SSR — safe fallback that shows full layout
const DEFAULT_STATE = deriveState("xl");

export const BreakpointContext = createContext<BreakpointState>(DEFAULT_STATE);

export function BreakpointProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [bp, setBp] = useState<Breakpoint>("xl");

  useEffect(() => {
    // Resolve immediately on mount
    setBp(resolveBreakpoint(window.innerWidth));

    // Create matchMedia listeners for each breakpoint boundary
    const queries = BREAKPOINTS.map((b) =>
      window.matchMedia(`(min-width: ${b.minWidth}px)`),
    );

    const handleChange = () => {
      setBp(resolveBreakpoint(window.innerWidth));
    };

    for (const mql of queries) {
      mql.addEventListener("change", handleChange);
    }

    return () => {
      for (const mql of queries) {
        mql.removeEventListener("change", handleChange);
      }
    };
  }, []);

  // Memoize the derived state object to prevent unnecessary re-renders
  const value = useMemo(() => deriveState(bp), [bp]);

  return (
    <BreakpointContext value={value}>
      {children}
    </BreakpointContext>
  );
}
```

- [ ] **Step 4: Create the useBreakpoint hook**

```tsx
// src/hooks/useBreakpoint.ts
"use client";

import { useContext } from "react";
import { BreakpointContext } from "@/contexts/BreakpointContext";
import type { Breakpoint } from "@/contexts/BreakpointContext";

export type { Breakpoint };

export function useBreakpoint() {
  return useContext(BreakpointContext);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/BreakpointContext.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/contexts/BreakpointContext.tsx src/hooks/useBreakpoint.ts src/__tests__/responsive/BreakpointContext.test.tsx
git commit -m "feat(responsive): add BreakpointProvider context + useBreakpoint hook"
```

---

### Task 2: Add Custom Breakpoints to globals.css

**Files:**
- Modify: `src/app/globals.css`

The britestatestyle.txt defines: Mobile 375px, Tablet 768px, Desktop 1280px, Wide 1440px. We need to add a custom `xs` breakpoint at 375px to Tailwind v4's `@theme` block.

- [ ] **Step 1: Add custom breakpoints to the @theme block**

In `src/app/globals.css`, add inside the `@theme inline { ... }` block, after the shadows section (line ~98):

```css
  /* --- Custom Breakpoints (britestatestyle.txt) --- */
  --breakpoint-xs: 375px;
  /* sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px) are Tailwind defaults */
```

Note: Tailwind v4 uses `--breakpoint-*` CSS custom properties in `@theme` for breakpoints. We only need to add `xs` since the others match Tailwind defaults closely enough.

- [ ] **Step 2: Verify the build still works**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds. The `xs:` prefix is now available in Tailwind classes.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(responsive): add xs breakpoint (375px) to Tailwind theme"
```

---

### Task 3: Container Component

**Files:**
- Create: `src/components/responsive/Container.tsx`
- Create: `src/__tests__/responsive/Container.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/responsive/Container.test.tsx
import { render, screen } from "@testing-library/react";
import { Container } from "@/components/responsive/Container";

describe("Container", () => {
  it("renders children", () => {
    render(<Container>Hello</Container>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies default xl max-width", () => {
    const { container } = render(<Container>Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("max-w-7xl");
  });

  it("applies responsive padding classes", () => {
    const { container } = render(<Container>Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("px-4");
    expect(el.className).toContain("sm:px-6");
    expect(el.className).toContain("lg:px-8");
  });

  it("accepts size prop", () => {
    const { container } = render(<Container size="sm">Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("max-w-2xl");
  });

  it("accepts custom className", () => {
    const { container } = render(<Container className="bg-red-500">Test</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("bg-red-500");
  });

  it("renders as specified element", () => {
    render(<Container as="section">Test</Container>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("SECTION");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/Container.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Container**

```tsx
// src/components/responsive/Container.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE_CLASSES: Record<ContainerSize, string> = {
  sm: "max-w-2xl",       // 672px
  md: "max-w-4xl",       // 896px
  lg: "max-w-6xl",       // 1152px
  xl: "max-w-7xl",       // 1280px — default, matches britestatestyle Desktop
  full: "max-w-[1440px]",// britestatestyle Wide
};

type ContainerProps = Readonly<{
  size?: ContainerSize;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "main" | "article";
}>;

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ size = "xl", className, children, as: Tag = "div" }, ref) {
    return (
      <Tag
        ref={ref}
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          SIZE_CLASSES[size],
          className,
        )}
      >
        {children}
      </Tag>
    );
  },
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/Container.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/responsive/Container.tsx src/__tests__/responsive/Container.test.tsx
git commit -m "feat(responsive): add Container layout primitive"
```

---

### Task 4: Grid Component

**Files:**
- Create: `src/components/responsive/Grid.tsx`
- Create: `src/__tests__/responsive/Grid.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/responsive/Grid.test.tsx
import { render, screen } from "@testing-library/react";
import { Grid } from "@/components/responsive/Grid";

describe("Grid", () => {
  it("renders children", () => {
    render(<Grid cols={2}><div>A</div><div>B</div></Grid>);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies static column count", () => {
    const { container } = render(<Grid cols={3}><div>A</div></Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid-cols-3");
  });

  it("applies responsive column object", () => {
    const { container } = render(
      <Grid cols={{ default: 1, sm: 2, lg: 3 }}><div>A</div></Grid>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("grid-cols-1");
    expect(el.className).toContain("sm:grid-cols-2");
    expect(el.className).toContain("lg:grid-cols-3");
  });

  it("applies gap", () => {
    const { container } = render(<Grid cols={2} gap={6}><div>A</div></Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("gap-6");
  });

  it("accepts custom className", () => {
    const { container } = render(<Grid cols={2} className="mt-4"><div>A</div></Grid>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("mt-4");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/Grid.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Grid**

```tsx
// src/components/responsive/Grid.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Breakpoint = "default" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ColCount = 1 | 2 | 3 | 4 | 5 | 6 | 12;
type ResponsiveCols = Partial<Record<Breakpoint, ColCount>>;

const COL_CLASSES: Record<ColCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

const PREFIX: Record<Breakpoint, string> = {
  default: "",
  xs: "xs:",
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
  "2xl": "2xl:",
};

function resolveColsClasses(cols: ColCount | ResponsiveCols): string {
  if (typeof cols === "number") {
    return COL_CLASSES[cols];
  }

  return Object.entries(cols)
    .map(([bp, count]) => {
      const prefix = PREFIX[bp as Breakpoint] ?? "";
      return `${prefix}${COL_CLASSES[count as ColCount]}`;
    })
    .join(" ");
}

// Static lookup — Tailwind v4 scanner cannot detect dynamically constructed classes
const GAP_CLASSES: Record<number, string> = {
  1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4",
  5: "gap-5", 6: "gap-6", 8: "gap-8", 10: "gap-10", 12: "gap-12",
};

type GridProps = Readonly<{
  cols: ColCount | ResponsiveCols;
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  className?: string;
  children: React.ReactNode;
}>;

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  function Grid({ cols, gap = 4, className, children }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          resolveColsClasses(cols),
          GAP_CLASSES[gap],
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/Grid.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/responsive/Grid.tsx src/__tests__/responsive/Grid.test.tsx
git commit -m "feat(responsive): add Grid layout primitive with responsive cols"
```

---

### Task 5: Stack Component

**Files:**
- Create: `src/components/responsive/Stack.tsx`
- Create: `src/__tests__/responsive/Stack.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/responsive/Stack.test.tsx
import { render, screen } from "@testing-library/react";
import { Stack } from "@/components/responsive/Stack";

describe("Stack", () => {
  it("renders children", () => {
    render(<Stack><div>A</div><div>B</div></Stack>);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("defaults to column direction", () => {
    const { container } = render(<Stack><div>A</div></Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-col");
  });

  it("accepts row direction", () => {
    const { container } = render(<Stack direction="row"><div>A</div></Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-row");
  });

  it("applies responsive direction", () => {
    const { container } = render(
      <Stack direction={{ default: "col", lg: "row" }}><div>A</div></Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("flex-col");
    expect(el.className).toContain("lg:flex-row");
  });

  it("applies gap", () => {
    const { container } = render(<Stack gap={6}><div>A</div></Stack>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("gap-6");
  });

  it("applies alignment props", () => {
    const { container } = render(
      <Stack align="center" justify="between"><div>A</div></Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("items-center");
    expect(el.className).toContain("justify-between");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/Stack.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Stack**

```tsx
// src/components/responsive/Stack.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Direction = "row" | "col";
type Breakpoint = "default" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ResponsiveDirection = Partial<Record<Breakpoint, Direction>>;

const DIR_CLASSES: Record<Direction, string> = {
  row: "flex-row",
  col: "flex-col",
};

const PREFIX: Record<Breakpoint, string> = {
  default: "",
  xs: "xs:",
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
  "2xl": "2xl:",
};

const ALIGN_MAP: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const JUSTIFY_MAP: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

function resolveDirectionClasses(dir: Direction | ResponsiveDirection): string {
  if (typeof dir === "string") {
    return DIR_CLASSES[dir];
  }
  return Object.entries(dir)
    .map(([bp, d]) => `${PREFIX[bp as Breakpoint] ?? ""}${DIR_CLASSES[d as Direction]}`)
    .join(" ");
}

// Static lookup — Tailwind v4 scanner cannot detect dynamically constructed classes
const GAP_CLASSES: Record<number, string> = {
  0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4",
  5: "gap-5", 6: "gap-6", 8: "gap-8", 10: "gap-10", 12: "gap-12",
};

type StackProps = Readonly<{
  direction?: Direction | ResponsiveDirection;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "nav" | "ul";
}>;

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  function Stack(
    { direction = "col", gap = 4, align, justify, wrap, className, children, as: Tag = "div" },
    ref,
  ) {
    return (
      <Tag
        ref={ref}
        className={cn(
          "flex",
          resolveDirectionClasses(direction),
          GAP_CLASSES[gap],
          align && ALIGN_MAP[align],
          justify && JUSTIFY_MAP[justify],
          wrap && "flex-wrap",
          className,
        )}
      >
        {children}
      </Tag>
    );
  },
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/Stack.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/responsive/Stack.tsx src/__tests__/responsive/Stack.test.tsx
git commit -m "feat(responsive): add Stack layout primitive with responsive direction"
```

---

### Task 6: Barrel Export for Responsive Primitives

**Files:**
- Create: `src/components/responsive/index.ts`

- [ ] **Step 1: Create barrel export**

```tsx
// src/components/responsive/index.ts
export { Container } from "./Container";
export { Grid } from "./Grid";
export { Stack } from "./Stack";
// ResponsiveSidebar will be added in Task 7 after it is created
```

- [ ] **Step 2: Commit**

```bash
git add src/components/responsive/index.ts
git commit -m "feat(responsive): add barrel export for responsive primitives"
```

---

## Wave 2: ResponsiveSidebar + Dashboard Layout Fixes

### Task 7: ResponsiveSidebar Component

This is the key component. It wraps any sidebar content and handles:
- **Mobile (< 768px):** Hidden, opens as Sheet via hamburger button
- **Desktop (>= 1024px):** Fixed sidebar, full-width (w-64)
- **Tablet (768–1023px):** Same as mobile (Sheet) — BottomTabBar handles primary nav

The LandlordSidebar, ProviderSidebar, and BrokerSidebar already have this pattern (desktop: `hidden lg:block`, mobile: Sheet trigger). The SellerSidebar and AdminSidebar are completely broken (always fixed, never collapse). ResponsiveSidebar unifies all of them.

**Files:**
- Create: `src/components/responsive/ResponsiveSidebar.tsx`
- Create: `src/__tests__/responsive/ResponsiveSidebar.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/responsive/ResponsiveSidebar.test.tsx
import { render, screen } from "@testing-library/react";
import { ResponsiveSidebar } from "@/components/responsive/ResponsiveSidebar";

describe("ResponsiveSidebar", () => {
  it("renders sidebar content in desktop aside", () => {
    render(
      <ResponsiveSidebar>
        <nav>Dashboard Nav</nav>
      </ResponsiveSidebar>,
    );
    // The desktop aside should exist (hidden via CSS, but present in DOM)
    expect(screen.getByText("Dashboard Nav")).toBeInTheDocument();
  });

  it("renders with custom className on aside", () => {
    const { container } = render(
      <ResponsiveSidebar className="bg-green-900">
        <nav>Nav</nav>
      </ResponsiveSidebar>,
    );
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("bg-green-900");
  });

  it("renders hamburger button for mobile", () => {
    render(
      <ResponsiveSidebar>
        <nav>Nav</nav>
      </ResponsiveSidebar>,
    );
    expect(screen.getByRole("button", { name: /open navigation/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/ResponsiveSidebar.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement ResponsiveSidebar**

```tsx
// src/components/responsive/ResponsiveSidebar.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger as SheetTriggerBase,
} from "@/components/ui/sheet";

// Type cast needed for base-ui Dialog.Trigger prop compatibility
const SheetTrigger = SheetTriggerBase as React.ComponentType<{ asChild?: boolean; children: React.ReactNode }>;

type ResponsiveSidebarProps = Readonly<{
  children: React.ReactNode;
  /** Extra classes on the desktop <aside> element */
  className?: string;
  /** Width class for the sidebar. Default: "w-64" */
  width?: string;
  /** Side the mobile sheet slides in from. Default: "left" */
  side?: "left" | "right";
}>;

/**
 * ResponsiveSidebar
 *
 * Desktop (lg+): Fixed sidebar on the left.
 * Mobile/Tablet (<lg): Hidden. Hamburger button opens a Sheet drawer.
 *
 * Usage:
 *   <ResponsiveSidebar className="bg-[#1B4D3E]">
 *     <SidebarInner />  ← your nav items, logo, user info
 *   </ResponsiveSidebar>
 *
 * The parent layout should use `lg:pl-64` (or matching width) on <main>.
 */
export function ResponsiveSidebar({
  children,
  className,
  width = "w-64",
  side = "left",
}: ResponsiveSidebarProps) {
  return (
    <>
      {/* Desktop: fixed sidebar, visible lg+ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-background lg:flex lg:flex-col",
          width,
          className,
        )}
      >
        {children}
      </aside>

      {/* Mobile/Tablet: hamburger button + Sheet drawer, visible <lg */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
              className="bg-white/90 backdrop-blur-sm shadow-sm"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={side} className={cn(width, "p-0")} showCloseButton>
            {children}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/responsive/ResponsiveSidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Update barrel export to include ResponsiveSidebar**

In `src/components/responsive/index.ts`, add the ResponsiveSidebar export:
```tsx
// src/components/responsive/index.ts
export { Container } from "./Container";
export { Grid } from "./Grid";
export { Stack } from "./Stack";
export { ResponsiveSidebar } from "./ResponsiveSidebar";
```

- [ ] **Step 6: Commit**

```bash
git add src/components/responsive/ResponsiveSidebar.tsx src/__tests__/responsive/ResponsiveSidebar.test.tsx src/components/responsive/index.ts
git commit -m "feat(responsive): add ResponsiveSidebar — Sheet on mobile, fixed on desktop"
```

---

### Task 8: Fix SellerSidebar + Seller Layout

The SellerSidebar is the worst offender: `fixed inset-y-0 left-0 w-64` with no breakpoint awareness. The layout uses `ml-64` which is hardcoded.

**Strategy:** Extract the sidebar *content* (nav items, logo, user info) from the fixed wrapper. Wrap it with `ResponsiveSidebar`. Update the layout to use `lg:pl-64` instead of `ml-64`.

**Files:**
- Modify: `src/components/seller/SellerSidebar.tsx`
- Modify: `src/app/(protected)/dashboard/seller/layout.tsx`

- [ ] **Step 1: Rewrite SellerSidebar to use ResponsiveSidebar**

Replace the entire content of `src/components/seller/SellerSidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  Eye,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveSidebar } from "@/components/responsive/ResponsiveSidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/seller", icon: LayoutDashboard },
  { label: "My Listings", href: "/dashboard/seller/listings", icon: Home },
  { label: "Enquiries", href: "/dashboard/seller/enquiries", icon: MessageSquare },
  { label: "Viewings", href: "/dashboard/seller/viewings", icon: Eye },
  { label: "Market Analytics", href: "/dashboard/seller/analytics", icon: BarChart2 },
  { label: "Settings", href: "/dashboard/seller/settings", icon: Settings },
] as const;

type Props = Readonly<{
  userName: string;
  avatarUrl: string | null;
}>;

function SidebarContent({ userName, avatarUrl }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#1B4D3E]">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white tracking-tight">
          britestate
        </span>
        <p className="text-white/60 text-xs mt-0.5">Seller Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard/seller"
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                active ? "bg-white/20" : "bg-white/10",
              )}>
                <Icon size={16} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <p className="text-white/50 text-xs">Premium Seller</p>
          </div>
          <Link href="/logout" className="text-white/40 hover:text-white transition-colors" title="Sign out">
            <LogOut size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SellerSidebar({ userName, avatarUrl }: Props) {
  return (
    <ResponsiveSidebar className="bg-[#1B4D3E] border-r-0">
      <SidebarContent userName={userName} avatarUrl={avatarUrl} />
    </ResponsiveSidebar>
  );
}
```

- [ ] **Step 2: Fix the seller layout — remove ml-64**

Replace the entire content of `src/app/(protected)/dashboard/seller/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerSidebar } from "@/components/seller/SellerSidebar";

export default async function SellerDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SellerSidebar
        userName={profile?.full_name ?? "Seller"}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-h-screen p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {props.children}
      </main>
    </div>
  );
}
```

Key change: `ml-64 p-8` → `p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8`. The `lg:pl-72` accounts for `w-64` sidebar + `p-8` padding on desktop. On mobile, full-width with `p-4`.

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/seller/SellerSidebar.tsx src/app/(protected)/dashboard/seller/layout.tsx
git commit -m "fix(responsive): make SellerSidebar responsive — Sheet on mobile, fixed on desktop"
```

---

### Task 9: Fix AdminSidebar + Admin Layout

Same pattern as Task 8. AdminSidebar has `fixed inset-y-0 left-0 flex w-64` with no breakpoint. Layout uses `ml-64`.

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Wrap AdminSidebar content with ResponsiveSidebar**

In `src/components/admin/AdminSidebar.tsx`, the current structure renders the sidebar directly in `<aside className="fixed inset-y-0 left-0 flex w-64 ...">`. We need to:

1. Extract the inner content (logo + nav groups) into a `SidebarContent` component
2. Wrap with `ResponsiveSidebar`

Replace the `AdminSidebar` export function (lines 206-234) with:

```tsx
function SidebarContent({ pathname }: Readonly<{ pathname: string }>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
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

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_GROUPS.map((group) => (
          <CollapsibleGroup
            key={group.label}
            group={group}
            pathname={pathname}
          />
        ))}
      </nav>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <ResponsiveSidebar className="border-neutral-200 bg-white">
      <SidebarContent pathname={pathname} />
    </ResponsiveSidebar>
  );
}
```

Add import at top of file:
```tsx
import { ResponsiveSidebar } from "@/components/responsive/ResponsiveSidebar";
```

- [ ] **Step 2: Fix the admin layout — remove ml-64**

In `src/app/(admin)/layout.tsx`, change line 37 from:
```tsx
<main className="ml-64 flex-1 p-8">{children}</main>
```
to:
```tsx
<main className="flex-1 p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">{children}</main>
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx src/app/(admin)/layout.tsx
git commit -m "fix(responsive): make AdminSidebar responsive — Sheet on mobile, fixed on desktop"
```

---

### Task 10: Fix Landlord Layout

The LandlordSidebar already has the correct pattern (`hidden lg:block` + Sheet on mobile). The layout just needs the padding adjusted for consistency. Currently uses `lg:pl-64` which is correct but inconsistent with other layouts.

**Files:**
- Modify: `src/app/(protected)/dashboard/landlord/layout.tsx`

- [ ] **Step 1: Update the landlord layout**

Replace the entire content:

```tsx
import { LandlordSidebar } from "@/components/landlord/LandlordSidebar";

export default function LandlordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <LandlordSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
```

Key changes: Added `min-h-screen` (was `h-screen` which breaks on long content), added mobile-first padding `p-4 sm:p-6`, adjusted desktop padding `lg:pl-72 lg:pr-8 lg:py-8`.

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/dashboard/landlord/layout.tsx
git commit -m "fix(responsive): update landlord layout with mobile-first responsive padding"
```

---

### Task 11: Fix Provider + Broker Layouts

Both use the same pattern as Landlord. Their sidebars already have `hidden lg:block` + Sheet. Just need layout padding fixes.

**Files:**
- Modify: `src/app/(protected)/dashboard/provider/layout.tsx`
- Modify: `src/app/(protected)/dashboard/broker/layout.tsx`

- [ ] **Step 1: Fix provider layout**

Replace entire content of `src/app/(protected)/dashboard/provider/layout.tsx`:

```tsx
import { ProviderSidebar } from "@/components/dashboard/provider/ProviderSidebar";

export default function ProviderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <ProviderSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Fix broker layout**

Replace entire content of `src/app/(protected)/dashboard/broker/layout.tsx`:

```tsx
import { BrokerSidebar } from "@/components/dashboard/broker/BrokerSidebar";

export default function BrokerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <BrokerSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/dashboard/provider/layout.tsx src/app/(protected)/dashboard/broker/layout.tsx
git commit -m "fix(responsive): update provider + broker layouts with mobile-first responsive padding"
```

---

### Task 12: Extend BottomTabBar Visibility + Keyboard Hide

Currently `md:hidden` (hidden >= 768px). Since sidebars are `hidden lg:block` (hidden < 1024px), there's a gap at 768-1023px where users have neither sidebar nor tab bar.

**Fix:** Change `md:hidden` → `lg:hidden` so tab bar is visible on tablets too.

Also add: hide tab bar when virtual keyboard opens (iOS/Android).

**Files:**
- Create: `src/hooks/useVirtualKeyboard.ts`
- Modify: `src/components/mobile/BottomTabBar.tsx`

- [ ] **Step 1: Create useVirtualKeyboard hook**

```tsx
// src/hooks/useVirtualKeyboard.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the virtual keyboard is likely open.
 *
 * Uses the VirtualKeyboard API where available, otherwise falls back
 * to detecting focus on input/textarea/select elements combined with
 * a viewport height reduction (common on mobile when keyboard appears).
 */
export function useVirtualKeyboard(): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Try VirtualKeyboard API (Chrome 94+)
    type VirtualKeyboard = {
      overlaysContent: boolean;
      boundingRect: { height: number };
      addEventListener: (event: string, cb: () => void) => void;
      removeEventListener: (event: string, cb: () => void) => void;
    };

    if ("virtualKeyboard" in navigator) {
      const vk = (navigator as unknown as { virtualKeyboard: VirtualKeyboard }).virtualKeyboard;
      vk.overlaysContent = true;
      const handleGeometryChange = () => {
        setIsOpen(vk.boundingRect.height > 0);
      };
      vk.addEventListener("geometrychange", handleGeometryChange);
      return () => vk.removeEventListener("geometrychange", handleGeometryChange);
    }

    // Fallback: detect focus on input elements + visual viewport shrink
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        setIsOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Delay to avoid flash when moving between inputs
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT" &&
            !(active as HTMLElement).isContentEditable)
        ) {
          setIsOpen(false);
        }
      }, 100);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return isOpen;
}
```

- [ ] **Step 2: Update BottomTabBar**

In `src/components/mobile/BottomTabBar.tsx`:

1. Add imports at top:
```tsx
import { cn } from "@/lib/utils";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
```

2. Inside the `BottomTabBar` function, after `const tabs = TAB_CONFIG[activeRole];`:
```tsx
const keyboardOpen = useVirtualKeyboard();
```

3. Change the `<nav>` element's className (line 98) from:
```tsx
className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-neutral-200 bg-white pb-safe md:hidden"
```
to:
```tsx
className={cn(
  "fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-neutral-200 bg-white pb-safe lg:hidden transition-transform duration-200",
  keyboardOpen && "translate-y-full",
)}
```

Key changes: `md:hidden` → `lg:hidden` (visible on tablets), `translate-y-full` when keyboard open (slides off-screen).

- [ ] **Step 3: Update protected layout bottom padding**

In `src/app/(protected)/layout.tsx`, change line 31 from:
```tsx
<main className="pb-16 md:pb-0">{children}</main>
```
to:
```tsx
<main className="pb-16 lg:pb-0">{children}</main>
```

This matches the BottomTabBar's new `lg:hidden` breakpoint.

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useVirtualKeyboard.ts src/components/mobile/BottomTabBar.tsx src/app/(protected)/layout.tsx
git commit -m "fix(responsive): extend BottomTabBar to tablets (lg:hidden) + hide on keyboard open"
```

---

## Wave 3: Polish — Dev Tools + Auto-Hide Header + Form Grid Fixes

### Task 13: BreakpointProvider in Root Layout + Dev-Mode Breakpoint Indicator

**IMPORTANT:** This task MUST come before Task 14 because the ProtectedHeader in Task 14 uses `useBreakpoint()`, which requires `BreakpointProvider` to be an ancestor in the component tree.

Small badge in bottom-right corner showing current breakpoint. Only renders in development. Also wires up the BreakpointProvider at the root.

**Files:**
- Create: `src/components/responsive/DevBreakpointIndicator.tsx`
- Modify: `src/app/layout.tsx` (add BreakpointProvider + DevBreakpointIndicator)

- [ ] **Step 1: Create DevBreakpointIndicator**

```tsx
// src/components/responsive/DevBreakpointIndicator.tsx
"use client";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useEffect, useState } from "react";

const BP_COLORS: Record<string, string> = {
  xs: "bg-red-500",
  sm: "bg-orange-500",
  md: "bg-yellow-500",
  lg: "bg-green-500",
  xl: "bg-blue-500",
  "2xl": "bg-purple-500",
};

/**
 * Dev-only breakpoint indicator badge.
 * Also logs a console warning if the page has horizontal overflow.
 */
export function DevBreakpointIndicator() {
  const { breakpoint } = useBreakpoint();
  const [width, setWidth] = useState<number | null>(null);

  // Track viewport width after mount to avoid hydration mismatch
  useEffect(() => {
    setWidth(window.innerWidth);
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Horizontal overflow detection
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const check = () => {
      if (document.documentElement.scrollWidth > window.innerWidth) {
        console.warn(
          `[Responsive] Horizontal overflow detected: page is ${document.documentElement.scrollWidth}px wide, viewport is ${window.innerWidth}px`,
        );
      }
    };

    // Check after layout settles
    const timer = setTimeout(check, 1000);
    window.addEventListener("resize", check);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className={`fixed bottom-20 right-4 z-[9999] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg lg:bottom-4 ${BP_COLORS[breakpoint] ?? "bg-gray-500"}`}
    >
      <span className="size-2 animate-pulse rounded-full bg-white/50" />
      {breakpoint}
      {width !== null && (
        <span className="text-white/70">{width}px</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add BreakpointProvider + DevBreakpointIndicator to root layout**

Read `src/app/layout.tsx` first to see current structure, then add the provider wrapping `{children}` and the indicator component.

In `src/app/layout.tsx`, add imports:
```tsx
import { BreakpointProvider } from "@/contexts/BreakpointContext";
import { DevBreakpointIndicator } from "@/components/responsive/DevBreakpointIndicator";
```

Then wrap the existing `{children}` with:
```tsx
<BreakpointProvider>
  {children}
  <DevBreakpointIndicator />
</BreakpointProvider>
```

Note: The root layout is a Server Component. `BreakpointProvider` is a Client Component, which is fine — it renders as a client boundary around children.

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Verify dev server shows the indicator**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm dev`
Open http://localhost:3000 — should see a colored badge in bottom-right with current breakpoint name and pixel width.

- [ ] **Step 5: Commit**

```bash
git add src/components/responsive/DevBreakpointIndicator.tsx src/app/layout.tsx
git commit -m "feat(responsive): add BreakpointProvider + dev-mode breakpoint indicator"
```

---

### Task 14: Scroll-Aware Auto-Hide Header

On mobile, the ProtectedHeader takes 56px. Auto-hiding it on scroll-down reclaims that space for content. Scroll-up brings it back.

**Depends on:** Task 13 (BreakpointProvider must be in root layout for `useBreakpoint()` to work).

**Files:**
- Create: `src/hooks/useScrollDirection.ts`
- Modify: `src/components/layout/ProtectedHeader.tsx`

- [ ] **Step 1: Create useScrollDirection hook**

```tsx
// src/hooks/useScrollDirection.ts
"use client";

import { useEffect, useState, useRef } from "react";

type ScrollDirection = "up" | "down" | null;

/**
 * Detects scroll direction with a threshold to avoid jitter.
 * Returns "up" when user scrolls up, "down" when scrolling down, null initially.
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateDirection = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      setDirection(diff > 0 ? "down" : "up");
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return direction;
}
```

- [ ] **Step 2: Update ProtectedHeader with auto-hide**

Replace the entire content of `src/components/layout/ProtectedHeader.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import NotificationBell from "@/components/notifications/NotificationBell";
import UnreadBadge from "@/components/messaging/UnreadBadge";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

export function ProtectedHeader() {
  const scrollDirection = useScrollDirection();
  const { isMobile, isTablet } = useBreakpoint();
  const shouldAutoHide = (isMobile || isTablet) && scrollDirection === "down";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-sm transition-transform duration-200",
        shouldAutoHide && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Inbox"
          >
            <Mail className="h-5 w-5" />
            <span className="absolute -right-1 -top-1">
              <UnreadBadge />
            </span>
          </Link>

          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useScrollDirection.ts src/components/layout/ProtectedHeader.tsx
git commit -m "feat(responsive): add scroll-aware auto-hide header on mobile + tablet"
```

---

### Task 15: Fix Form Grid Dialogs That Don't Collapse on Mobile

There are ~20 instances of `grid grid-cols-2 gap-4` that don't collapse to 1 column on mobile. The fix is adding `grid-cols-1 sm:grid-cols-2` to each.

**Files to modify (highest impact ones — auth onboarding forms are used by every new user):**
- `src/components/auth/onboarding/LandlordOnboarding.tsx`
- `src/components/auth/onboarding/BuyerOnboarding.tsx`
- `src/components/auth/onboarding/TradespersonOnboarding.tsx`
- `src/components/auth/onboarding/MortgageBrokerOnboarding.tsx`
- `src/components/auth/onboarding/SellerOnboarding.tsx`
- `src/components/reviews/EditReviewForm.tsx`
- `src/components/reviews/ReviewForm.tsx`
- `src/components/marketplace/RFQCreateForm.tsx`
- `src/components/listings/ListingFormSteps/PropertyDetails.tsx`
- `src/components/listings/ListingFormSteps/Description.tsx`
- `src/components/listings/ListingFormSteps/Pricing.tsx`
- `src/components/calculators/MortgageCalculator.tsx`
- `src/components/properties/detail/ShareModal.tsx`

- [ ] **Step 1: Apply the fix across all files**

For each file above, find every instance of:
```tsx
className="grid grid-cols-2 gap-4"
```
and replace with:
```tsx
className="grid grid-cols-1 sm:grid-cols-2 gap-4"
```

Also find:
```tsx
className="grid grid-cols-2 gap-2"
```
and replace with:
```tsx
className="grid grid-cols-1 sm:grid-cols-2 gap-2"
```

And for the data-table.tsx instances:
```tsx
<div className="grid grid-cols-2 gap-4">
```
becomes:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

**Important:** Do NOT change grids that are intentionally 2-column at all sizes (e.g., a before/after photo comparison where 2 columns is the point). Use judgment — if the grid is inside a dialog or form, it should collapse. If it's a fixed layout element (like a comparison), leave it.

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Run lint**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm lint`
Expected: No new errors

- [ ] **Step 4: Commit**

Stage only the specific files you modified (do NOT use `git add -A`):
```bash
git add src/components/auth/onboarding/LandlordOnboarding.tsx \
  src/components/auth/onboarding/BuyerOnboarding.tsx \
  src/components/auth/onboarding/TradespersonOnboarding.tsx \
  src/components/auth/onboarding/MortgageBrokerOnboarding.tsx \
  src/components/auth/onboarding/SellerOnboarding.tsx \
  src/components/reviews/EditReviewForm.tsx \
  src/components/reviews/ReviewForm.tsx \
  src/components/marketplace/RFQCreateForm.tsx \
  src/components/listings/ListingFormSteps/PropertyDetails.tsx \
  src/components/listings/ListingFormSteps/Description.tsx \
  src/components/listings/ListingFormSteps/Pricing.tsx \
  src/components/calculators/MortgageCalculator.tsx \
  src/components/properties/detail/ShareModal.tsx \
  src/components/data-table.tsx
git commit -m "fix(responsive): add mobile collapse to form grids (grid-cols-1 sm:grid-cols-2)"
```

**Note:** There are additional files with `grid-cols-2` patterns (agent analytics, charts, etc.). This task covers the highest-impact user-facing forms. Remaining files can be swept in a follow-up using: `grep -r "grid grid-cols-2 gap" src/ --include="*.tsx" -l`

---

## Wave 4: Verification + TODOS

### Task 16: Update TODOS.md with Deferred Items

**Files:**
- Modify: `/Users/joanflerinbig/Documents/britv3.0/TODOS.md`

- [ ] **Step 1: Append the following section to TODOS.md**

```markdown

## Responsive Design System — Deferred TODOs

### Add `sizes` prop to all Next.js Image components
**What:** Audit ~20 files using `next/image` and add appropriate `sizes` prop for responsive image loading.
**Why:** Without `sizes`, images download full-resolution on mobile, wasting bandwidth and hurting LCP (Largest Contentful Paint). Example: a 1440px hero image downloaded on a 375px phone.
**Pattern:** `sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"` — adjust per component.
**Effort:** M | **Priority:** P2
**Where to start:** `grep -r "from \"next/image\"" src/ --include="*.tsx" -l` to find all files.
**Depends on:** Nothing — can be done independently.

### Add Playwright viewport regression tests
**What:** E2E tests that load each dashboard role at 375px, 768px, and 1280px viewports. Assert: (a) no horizontal overflow, (b) navigation accessible, (c) main content visible and not obscured.
**Why:** Catches responsive regressions in CI. Without automated tests, mobile breakage is only caught by manual QA.
**Effort:** M | **Priority:** P1
**Where to start:** Install Playwright, create `e2e/responsive/` test directory. One test per dashboard role × 3 viewports.
**Depends on:** Playwright being installed (currently planned but not set up).

### Migrate existing pages to Container component
**What:** Replace ad-hoc `px-4 sm:px-6 lg:px-8` + `max-w-*` + `mx-auto` patterns with `<Container>` component across ~30 pages.
**Why:** DRY — Container enforces consistent responsive padding. Currently 30+ pages each define their own padding.
**Effort:** L | **Priority:** P2
**Where to start:** `grep -r "mx-auto.*max-w" src/app/ --include="*.tsx" -l` to find candidates.
**Depends on:** Container component from responsive design system (now built).

### Add container query support to Card components
**What:** Use Tailwind v4 `@container` to make Cards adapt to their container width, not viewport width.
**Why:** A Card in a 2-col grid at 1280px should behave like a Card on a 640px viewport. Currently all Cards use viewport breakpoints, so Cards in narrow containers look cramped.
**Effort:** M | **Priority:** P3
**Where to start:** Add `@container` to Card parent, use `@sm:`, `@md:` etc. in Card component.
**Depends on:** Responsive design system + Tailwind v4 container query setup.

### Swipe-to-navigate mobile dashboard tabs (vision)
**What:** Swipe left/right to move between dashboard tabs (Overview → Listings → Viewings).
**Why:** Makes the app feel native on mobile. Like iOS tab swiping.
**Effort:** M | **Priority:** P3
**Where to start:** Use gesture library (e.g., `@use-gesture/react`) on dashboard wrapper.
**Depends on:** Responsive sidebar system (now built).

### Responsive morphing stat cards (vision)
**What:** Dashboard stat cards that morph on mobile: Desktop shows grid with icon + label + value + sparkline. Mobile shows horizontal scroll strip with value + mini label.
**Why:** Users see more data in less space on mobile. Swipeable horizontal scroll feels native.
**Effort:** M | **Priority:** P3
**Where to start:** New `ResponsiveStatCard` component wrapping existing `StatCard`.
**Depends on:** Responsive design system.

### Haptic feedback on mobile interactions (vision)
**What:** Subtle vibration via `navigator.vibrate(10)` on key interactions: nav taps, sidebar toggle, form submit.
**Why:** Makes the web app feel native. Progressive enhancement — no-op on unsupported browsers.
**Effort:** S | **Priority:** P3
**Where to start:** Create `useHaptics()` hook, apply to BottomTabBar and ResponsiveSidebar.
**Depends on:** Nothing.

### Responsive empty states (vision)
**What:** Mobile-optimized empty state illustrations + CTAs that fill the screen when a dashboard section has no data.
**Why:** Current empty states show a small centered message. On mobile, full-screen empty states feel intentional, not broken.
**Effort:** M | **Priority:** P3
**Where to start:** Create `<EmptyState>` component with responsive illustration sizing.
**Depends on:** Nothing — can be done independently.
```

- [ ] **Step 2: Commit**

```bash
git add TODOS.md
git commit -m "docs: add responsive design system deferred TODOs from CEO + eng review"
```

---

### Task 17: Final Build Verification

- [ ] **Step 1: Run full build**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run lint**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm lint`
Expected: No new lint errors

- [ ] **Step 3: Run existing tests**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run`
Expected: All tests pass (existing + new responsive tests)

- [ ] **Step 4: Manual visual verification at 3 breakpoints**

Start dev server: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm dev`

Check each at 375px (mobile), 768px (tablet), 1280px (desktop) using browser DevTools responsive mode:

1. **`/dashboard/seller`** — Sidebar is Sheet on mobile, full on desktop. Content is full-width on mobile.
2. **`/admin`** — Same behavior. Collapsible groups work in Sheet.
3. **`/dashboard/landlord`** — Sheet on mobile, sidebar on desktop. Consistent padding.
4. **`/dashboard/provider`** — Same as landlord.
5. **`/dashboard/broker`** — Same as landlord.
6. **`/`** (homepage) — No regressions. Header still has hamburger on mobile.
7. **Bottom tab bar** — Visible at 375px and 768px. Hidden at 1280px.
8. **Dev breakpoint indicator** — Shows colored badge with current breakpoint.
9. **Form grids** — Open any onboarding form at 375px. Fields stack to 1 column.
10. **Header auto-hide** — Scroll down on mobile dashboard. Header slides up. Scroll up, it returns.

- [ ] **Step 5: Final commit (if any manual fixes needed)**

Stage only the specific files you fixed (do NOT use `git add -A`):
```bash
git add <specific-files-you-fixed>
git commit -m "fix(responsive): address visual verification findings"
```

---

## Summary of All Changes

| Wave | Tasks | What Changes |
|------|-------|-------------|
| **Wave 1: Foundation** | Tasks 1-6 | BreakpointProvider, custom breakpoints, Container, Grid, Stack, barrel export |
| **Wave 2: Sidebar Fixes** | Tasks 7-12 | ResponsiveSidebar, fix Seller/Admin/Landlord/Provider/Broker layouts, BottomTabBar to `lg:hidden` + keyboard hide |
| **Wave 3: Polish** | Tasks 13-15 | BreakpointProvider + dev indicator, auto-hide header, form grid mobile collapse |
| **Wave 4: Verification** | Tasks 16-17 | TODOS.md updates, full build + visual verification |

**Total: 17 tasks, ~2-3 days of implementation.**

### Files Created (14)
- `src/contexts/BreakpointContext.tsx`
- `src/hooks/useBreakpoint.ts`
- `src/hooks/useScrollDirection.ts`
- `src/hooks/useVirtualKeyboard.ts`
- `src/components/responsive/Container.tsx`
- `src/components/responsive/Grid.tsx`
- `src/components/responsive/Stack.tsx`
- `src/components/responsive/ResponsiveSidebar.tsx`
- `src/components/responsive/DevBreakpointIndicator.tsx`
- `src/components/responsive/index.ts`
- `src/__tests__/responsive/BreakpointContext.test.tsx`
- `src/__tests__/responsive/Container.test.tsx`
- `src/__tests__/responsive/Grid.test.tsx`
- `src/__tests__/responsive/Stack.test.tsx`
- `src/__tests__/responsive/ResponsiveSidebar.test.tsx`

### Files Modified (12+)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/dashboard/seller/layout.tsx`
- `src/app/(protected)/dashboard/landlord/layout.tsx`
- `src/app/(protected)/dashboard/provider/layout.tsx`
- `src/app/(protected)/dashboard/broker/layout.tsx`
- `src/app/(admin)/layout.tsx`
- `src/components/seller/SellerSidebar.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/mobile/BottomTabBar.tsx`
- `src/components/layout/ProtectedHeader.tsx`
- 13+ form/dialog components (grid collapse fix)
- `TODOS.md`
