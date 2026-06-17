# Marketing/Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5 missing Britestate legal pages (Fair Housing, Refunds, Third-Party Services Disclosure, Regulatory Information, Professional Standards) to the re-branded Stitch design, wire them into navigation, and confirm the 4 existing pages are on-brand.

**Architecture:** Each page is a static Server Component that reuses the **existing** `LegalPageShell` (3-column: left doc-nav · content · right scroll-spy TOC) — the same pattern every current `/legal/*` page uses. Two small shared presentational components (`NumberedSteps`, `LabeledGrid`) cover the Stitch "numbered procedure" and "labelled grid" blocks, reused across ≥3 pages each. All accents use the green `primary` token; **no blue**. Pages are then registered in the legal left-nav, legal hub, footer, XML sitemap, and HTML sitemap so they are reachable.

**Tech Stack:** Next.js 16 App Router (RSC), React 19, TypeScript, Tailwind v4, lucide-react icons, Vitest + Testing Library (happy-dom), Playwright (link-render).

**Working dir:** All paths are relative to `britv3/` (the canonical clone). Run all `pnpm` commands from `britv3/`.

**Key conventions discovered (follow exactly):**
- Reuse `@/components/legal/LegalPageShell` with `toc={SECTIONS}` (`SECTIONS: {id,label}[]`). Template page: `src/app/(main)/legal/disclaimer/page.tsx`.
- Internal links use `next/link` `<Link>` (enforced by `src/__tests__/navigation/internal-links.test.ts`). Hash (`#id`) and `mailto:` use plain `<a>`.
- Never use `href="#"` placeholders (enforced for public pages).
- Accent classes: `text-primary`, `bg-primary`, `bg-primary/10`, `border-primary` (= `#1B4D3E`). Body text `text-neutral-600/700/900`. Banned: `brand-accent`, `*-blue-*`, `#2563EB`.
- Page chrome (Header/Breadcrumbs/Footer/CookieBanner) comes from `(main)/layout.tsx` — pages render content only.
- `BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"`.
- Company facts: Britestate Ltd; England & Wales; emails `support@britestate.co.uk`, `privacy@britestate.co.uk`. Registered address/number stay as `[REGISTERED ADDRESS]` / `[COMPANY NUMBER]` (legal-review placeholders, matching the existing `terms` page).

---

## Task 0: Feature branch

- [ ] **Step 1: Create a feature branch** (current branch is `fix/supabase-migration-version-collisions`).

```bash
cd britv3
git checkout -b feature/marketing-legal-pages
```

- [ ] **Step 2: Confirm clean baseline** — tests pass before changes.

Run: `pnpm test --run src/__tests__/navigation`
Expected: PASS (these guard the wiring we add later).

---

## Task 1: Test infra — IntersectionObserver stub

`LegalRightToc` (used by `LegalPageShell`) calls `new IntersectionObserver(...)` in a `useEffect`. happy-dom does not provide it, so any test that renders a legal page would throw. Add a no-op stub to the global test setup.

**Files:**
- Modify: `src/__tests__/setup.ts`

- [ ] **Step 1: Add the stub** to the end of `src/__tests__/setup.ts` (before the `afterEach` block is fine; append after the Supabase mocks):

```ts
// ---------------------------------------------------------------------------
// IntersectionObserver stub (happy-dom does not implement it).
// Used by LegalRightToc scroll-spy in legal page render tests.
// ---------------------------------------------------------------------------
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  },
);
```

- [ ] **Step 2: Verify existing tests still pass.**

Run: `pnpm test --run src/__tests__/navigation`
Expected: PASS (no regressions).

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/setup.ts
git commit -m "test: stub IntersectionObserver for legal page render tests"
```

---

## Task 2: `NumberedSteps` shared component

Renders an ordered procedure (zero-padded mono numerals + title + body). Reused by Fair Housing (reporting), Refunds (how to request), Professional Standards (verification).

**Files:**
- Create: `src/components/legal/NumberedSteps.tsx`
- Test: `src/components/legal/NumberedSteps.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NumberedSteps } from "./NumberedSteps";

describe("NumberedSteps", () => {
  it("renders each step's title and body inside an ordered list", () => {
    render(
      <NumberedSteps
        steps={[
          { title: "Document the incident", body: "Keep records." },
          { title: "Contact us", body: "Email compliance." },
        ]}
      />,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Document the incident")).toBeInTheDocument();
    expect(screen.getByText("Contact us")).toBeInTheDocument();
  });

  it("zero-pads the step numbers", () => {
    render(<NumberedSteps steps={[{ title: "First", body: "x" }]} />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run src/components/legal/NumberedSteps.test.tsx`
Expected: FAIL ("Failed to resolve import ./NumberedSteps").

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { ReactNode } from "react";

type Step = Readonly<{ title: string; body: ReactNode }>;

type NumberedStepsProps = Readonly<{ steps: readonly Step[] }>;

export function NumberedSteps({ steps }: NumberedStepsProps) {
  return (
    <ol className="not-prose space-y-6">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-bold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-semibold text-neutral-900">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run src/components/legal/NumberedSteps.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/legal/NumberedSteps.tsx src/components/legal/NumberedSteps.test.tsx
git commit -m "feat(legal): add NumberedSteps shared component"
```

---

## Task 3: `LabeledGrid` shared component

Renders a responsive grid of labelled cells (title + optional description). Reused by Fair Housing (protected characteristics), Third-Party Services (processors), Regulatory (regulatory bodies).

**Files:**
- Create: `src/components/legal/LabeledGrid.tsx`
- Test: `src/components/legal/LabeledGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabeledGrid } from "./LabeledGrid";

describe("LabeledGrid", () => {
  it("renders each cell title and description", () => {
    render(
      <LabeledGrid
        cells={[
          { title: "Stripe", description: "Payments" },
          { title: "Supabase", description: "Database" },
        ]}
      />,
    );

    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Supabase")).toBeInTheDocument();
  });

  it("renders cells without a description", () => {
    render(<LabeledGrid cells={[{ title: "Age" }]} columns={3} />);
    expect(screen.getByText("Age")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run src/components/legal/LabeledGrid.test.tsx`
Expected: FAIL ("Failed to resolve import ./LabeledGrid").

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { ReactNode } from "react";

type GridCell = Readonly<{ title: string; description?: ReactNode }>;

type LabeledGridProps = Readonly<{
  cells: readonly GridCell[];
  columns?: 2 | 3;
}>;

export function LabeledGrid({ cells, columns = 3 }: LabeledGridProps) {
  const colClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3";
  return (
    <div className={`not-prose grid grid-cols-1 gap-3 ${colClass}`}>
      {cells.map((cell) => (
        <div
          key={cell.title}
          className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <p className="text-sm font-semibold text-neutral-900">{cell.title}</p>
          {cell.description ? (
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{cell.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run src/components/legal/LabeledGrid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/legal/LabeledGrid.tsx src/components/legal/LabeledGrid.test.tsx
git commit -m "feat(legal): add LabeledGrid shared component"
```

---

## Shared page-test recipe (Tasks 4–8)

Each page test mocks `next/navigation` (because `LegalLeftNav` calls `usePathname`), imports the page + `metadata`, and asserts: metadata is indexable with the right canonical, the `h1` renders, and every TOC section `id` is present in the DOM.

---

## Task 4: Fair Housing Policy — `/legal/fair-housing`

**Files:**
- Create: `src/app/(main)/legal/fair-housing/page.tsx`
- Test: `src/app/(main)/legal/fair-housing/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/fair-housing" }));

import FairHousingPage, { metadata } from "./page";

describe("Fair Housing page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Fair Housing");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/fair-housing");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<FairHousingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Fair Housing Policy/i }),
    ).toBeInTheDocument();
    for (const id of [
      "our-commitment",
      "non-discrimination",
      "accessibility",
      "reporting",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run "src/app/(main)/legal/fair-housing/page.test.tsx"`
Expected: FAIL ("Failed to resolve import ./page").

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Users, Accessibility, Megaphone } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LabeledGrid } from "@/components/legal/LabeledGrid";
import { NumberedSteps } from "@/components/legal/NumberedSteps";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "our-commitment", label: "Our Commitment" },
  { id: "non-discrimination", label: "Non-Discrimination" },
  { id: "accessibility", label: "Accessibility" },
  { id: "reporting", label: "Reporting Procedures" },
];

export const metadata: Metadata = {
  title: "Fair Housing Policy | Britestate",
  description:
    "Britestate's commitment to equal access to housing and a discrimination-free experience for all buyers, renters, sellers, and landlords under the Equality Act 2010.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/fair-housing` },
  openGraph: {
    title: "Fair Housing Policy | Britestate",
    description: "Our commitment to equality and inclusion in the UK property market.",
  },
};

export default function FairHousingPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Fair Housing Policy</span>
      </nav>

      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Scale size={14} /> Corporate Policy
      </div>
      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Fair Housing Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This policy statement is drafted for clarity and is pending final review by Britestate&rsquo;s
        legal team. Specific statutory references should be confirmed before publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="our-commitment" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Users className="text-primary" size={22} /> Our Commitment
          </h2>
          <p>
            Britestate believes every individual deserves equal access to housing. This policy sets
            out our commitment to equality, diversity, and inclusion across every part of our
            property platform &mdash; search, listings, messaging, offers, and the services
            marketplace.
          </p>
          <p>
            We act in line with the <strong>Equality Act 2010</strong> and the{" "}
            <strong>Human Rights Act 1998</strong>, and we expect the estate agents, landlords, and
            service providers operating on Britestate to do the same.
          </p>
        </section>

        <section id="non-discrimination" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Scale className="text-primary" size={22} /> Non-Discrimination
          </h2>
          <p>
            We prohibit discrimination in any housing-related transaction on the platform based on
            the protected characteristics defined by the Equality Act 2010, including:
          </p>
          <LabeledGrid
            cells={[
              { title: "Age" },
              { title: "Disability" },
              { title: "Gender reassignment" },
              { title: "Marriage & civil partnership" },
              { title: "Pregnancy & maternity" },
              { title: "Race & ethnicity" },
              { title: "Religion or belief" },
              { title: "Sex" },
              { title: "Sexual orientation" },
            ]}
          />
        </section>

        <section id="accessibility" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Accessibility className="text-primary" size={22} /> Accessibility
          </h2>
          <div className="not-prose my-6 rounded-2xl bg-primary p-8 text-white">
            <h3 className="text-xl font-bold font-heading">Reasonable adjustments</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              We aim to ensure disabled users are not put at a substantial disadvantage compared to
              non-disabled users. If you need an adjustment to use Britestate or to engage with a
              listing, we will do our best to help.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-2 text-sm font-bold text-primary transition-opacity hover:opacity-90"
            >
              Request an adjustment
            </Link>
          </div>
          <p>
            Our broader accessibility commitments and WCAG status are described in our{" "}
            <Link href="/legal/accessibility" className="text-primary underline hover:no-underline">
              Accessibility Statement
            </Link>
            .
          </p>
        </section>

        <section id="reporting" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Megaphone className="text-primary" size={22} /> Reporting Procedures
          </h2>
          <p>If you believe you have experienced discrimination on Britestate, please:</p>
          <NumberedSteps
            steps={[
              {
                title: "Document the incident",
                body: "Keep records of correspondence, dates, listings, and the people involved.",
              },
              {
                title: "Raise it with us",
                body: (
                  <>
                    Contact our team at{" "}
                    <a href="mailto:support@britestate.co.uk" className="text-primary underline hover:no-underline">
                      support@britestate.co.uk
                    </a>{" "}
                    or through our{" "}
                    <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
                      Complaints Procedure
                    </Link>
                    .
                  </>
                ),
              },
              {
                title: "Formal review",
                body: "We investigate fair-housing reports promptly and independently of the team involved, and we will keep you informed of the outcome.",
              },
            ]}
          />
        </section>
      </div>
    </LegalPageShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run "src/app/(main)/legal/fair-housing/page.test.tsx"`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/legal/fair-housing"
git commit -m "feat(legal): add Fair Housing Policy page"
```

---

## Task 5: Refund & Cancellation Policy — `/legal/refunds`

**Files:**
- Create: `src/app/(main)/legal/refunds/page.tsx`
- Test: `src/app/(main)/legal/refunds/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/refunds" }));

import RefundsPage, { metadata } from "./page";

describe("Refunds page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Refund");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/refunds");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<RefundsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Refund (&|and) Cancellation/i }),
    ).toBeInTheDocument();
    for (const id of ["scope", "cooling-off", "non-refundable", "how-to-request", "timescales"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run "src/app/(main)/legal/refunds/page.test.tsx"`
Expected: FAIL ("Failed to resolve import ./page").

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText, Clock, Ban, BadgePoundSterling } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { NumberedSteps } from "@/components/legal/NumberedSteps";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "scope", label: "Scope & Eligibility" },
  { id: "cooling-off", label: "Cooling-Off Rights" },
  { id: "non-refundable", label: "Non-Refundable Items" },
  { id: "how-to-request", label: "How to Request a Refund" },
  { id: "timescales", label: "Timescales" },
];

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Britestate",
  description:
    "How refunds and cancellations work for Britestate subscriptions and platform fees, including your statutory cooling-off rights and how to request a refund.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/refunds` },
  openGraph: {
    title: "Refund & Cancellation Policy | Britestate",
    description: "Refunds, cancellations, and your cooling-off rights on Britestate.",
  },
};

export default function RefundsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Refund & Cancellation Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Refund &amp; Cancellation Policy
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This policy is drafted for clarity and is pending final review by Britestate&rsquo;s legal
        team. Statutory cooling-off periods and fee-specific terms should be confirmed before
        publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="scope" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ReceiptText className="text-primary" size={22} /> Scope &amp; Eligibility
          </h2>
          <p>
            This policy covers paid Britestate products: subscription plans and platform/listing
            fees. Charges levied by third parties you engage through the marketplace (for example,
            conveyancers or surveyors) are governed by that provider&rsquo;s own terms. Our platform
            fees are described in our{" "}
            <Link href="/legal/fee-transparency" className="text-primary underline hover:no-underline">
              Fee Transparency
            </Link>{" "}
            page.
          </p>
        </section>

        <section id="cooling-off" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <BadgePoundSterling className="text-primary" size={22} /> Cooling-Off Rights
          </h2>
          <p>
            Where you are a consumer, you may have a statutory right to cancel a new subscription
            within <strong>14 days</strong> of purchase under the Consumer Contracts Regulations
            2013. Where you ask us to begin a service within that period, we may retain a
            proportionate amount for the service already provided. [Confirm exact cooling-off
            treatment with legal before publication.]
          </p>
        </section>

        <section id="non-refundable" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Ban className="text-primary" size={22} /> Non-Refundable Items
          </h2>
          <p>The following are generally non-refundable once delivered or consumed:</p>
          <ul>
            <li>Completed one-off services (for example, a published premium listing that has run).</li>
            <li>Pay-as-you-go credits that have already been used.</li>
            <li>The portion of a subscription period already elapsed at the point of cancellation.</li>
          </ul>
        </section>

        <section id="how-to-request" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ReceiptText className="text-primary" size={22} /> How to Request a Refund
          </h2>
          <NumberedSteps
            steps={[
              {
                title: "Contact billing support",
                body: (
                  <>
                    Email{" "}
                    <a href="mailto:support@britestate.co.uk" className="text-primary underline hover:no-underline">
                      support@britestate.co.uk
                    </a>{" "}
                    from the address on your account, with your invoice or order reference.
                  </>
                ),
              },
              {
                title: "Tell us what and why",
                body: "Describe the charge and the reason for the refund so we can review it quickly.",
              },
              {
                title: "We review and respond",
                body: "We confirm eligibility and, where approved, process the refund to your original payment method via Stripe.",
              },
            ]}
          />
        </section>

        <section id="timescales" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Clock className="text-primary" size={22} /> Timescales
          </h2>
          <p>
            We aim to acknowledge refund requests within 5 working days and to process approved
            refunds within 14 days. Once processed, your bank or card issuer may take a few
            additional days to show the funds. If you are unhappy with a refund decision, you can
            escalate through our{" "}
            <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
              Complaints Procedure
            </Link>
            .
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run "src/app/(main)/legal/refunds/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/legal/refunds"
git commit -m "feat(legal): add Refund & Cancellation Policy page"
```

---

## Task 6: Third-Party Services Disclosure — `/legal/third-party-services`

**Files:**
- Create: `src/app/(main)/legal/third-party-services/page.tsx`
- Test: `src/app/(main)/legal/third-party-services/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/third-party-services" }));

import ThirdPartyPage, { metadata } from "./page";

describe("Third-Party Services Disclosure page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Third-Party");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/third-party-services");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1, processor list, and every TOC section anchor", () => {
    render(<ThirdPartyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Third-Party Services Disclosure/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    for (const id of ["overview", "processors", "vetting", "related"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run "src/app/(main)/legal/third-party-services/page.test.tsx"`
Expected: FAIL ("Failed to resolve import ./page").

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Network, ShieldCheck, Layers, Link2 } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LabeledGrid } from "@/components/legal/LabeledGrid";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "processors", label: "Authorised Processors" },
  { id: "vetting", label: "How We Vet Partners" },
  { id: "related", label: "Related Policies" },
];

export const metadata: Metadata = {
  title: "Third-Party Services Disclosure | Britestate",
  description:
    "The third-party service providers and data processors Britestate relies on to run the platform, what each is used for, and how we vet them.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/third-party-services` },
  openGraph: {
    title: "Third-Party Services Disclosure | Britestate",
    description: "The processors that power Britestate and how we vet them.",
  },
};

export default function ThirdPartyServicesPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Third-Party Services Disclosure</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Third-Party Services Disclosure
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This disclosure is drafted for clarity and is pending final review by Britestate&rsquo;s
        legal team. The processor list should be reconciled against the current vendor register
        before publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="overview" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Network className="text-primary" size={22} /> Overview
          </h2>
          <p>
            To run Britestate we use a number of trusted third-party providers (&ldquo;data
            processors&rdquo;). They process data only on our instructions and under contract. This
            page summarises who they are and what they do; how we handle your personal data is set
            out in full in our{" "}
            <Link href="/legal/privacy" className="text-primary underline hover:no-underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section id="processors" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Layers className="text-primary" size={22} /> Authorised Processors
          </h2>
          <LabeledGrid
            columns={2}
            cells={[
              { title: "Supabase", description: "Database, authentication, and file storage." },
              { title: "Stripe", description: "Payments and subscription billing." },
              { title: "Resend", description: "Transactional and notification email delivery." },
              { title: "Sentry", description: "Error monitoring and diagnostics." },
              { title: "PostHog", description: "Product analytics and feature flags." },
              { title: "Upstash Redis", description: "Rate limiting and caching." },
              { title: "MapTiler", description: "Maps and location data rendering." },
              { title: "Anthropic", description: "AI features (e.g. property insights)." },
            ]}
          />
        </section>

        <section id="vetting" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ShieldCheck className="text-primary" size={22} /> How We Vet Partners
          </h2>
          <p>Before onboarding a processor and on an ongoing basis, we assess:</p>
          <ul>
            <li>Security posture and recognised certifications.</li>
            <li>UK GDPR compliance and a written data-processing agreement.</li>
            <li>Data residency and any international transfer safeguards.</li>
            <li>Sub-processor transparency and breach-notification commitments.</li>
          </ul>
        </section>

        <section id="related" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Link2 className="text-primary" size={22} /> Related Policies
          </h2>
          <ul>
            <li><Link href="/legal/privacy" className="text-primary underline hover:no-underline">Privacy Policy</Link></li>
            <li><Link href="/legal/cookies" className="text-primary underline hover:no-underline">Cookie Policy</Link></li>
            <li><Link href="/legal/data-processing" className="text-primary underline hover:no-underline">Data Processing Agreement</Link></li>
          </ul>
        </section>
      </div>
    </LegalPageShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run "src/app/(main)/legal/third-party-services/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/legal/third-party-services"
git commit -m "feat(legal): add Third-Party Services Disclosure page"
```

---

## Task 7: Regulatory & Compliance Information — `/legal/regulatory`

**Files:**
- Create: `src/app/(main)/legal/regulatory/page.tsx`
- Test: `src/app/(main)/legal/regulatory/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/regulatory" }));

import RegulatoryPage, { metadata } from "./page";

describe("Regulatory Information page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Regulatory");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/regulatory");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<RegulatoryPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Regulatory (&|and) Compliance/i }),
    ).toBeInTheDocument();
    for (const id of ["company", "bodies", "aml", "complaints"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run "src/app/(main)/legal/regulatory/page.test.tsx"`
Expected: FAIL ("Failed to resolve import ./page").

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, ShieldCheck, Banknote, MessageSquare } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LabeledGrid } from "@/components/legal/LabeledGrid";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "company", label: "Company Identity" },
  { id: "bodies", label: "Regulatory Bodies & Redress" },
  { id: "aml", label: "AML Supervision" },
  { id: "complaints", label: "Complaints & Escalation" },
];

export const metadata: Metadata = {
  title: "Regulatory & Compliance Information | Britestate",
  description:
    "Britestate's company identity, the regulatory and redress bodies relevant to our service, our AML supervision, and how to escalate a complaint.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/regulatory` },
  openGraph: {
    title: "Regulatory & Compliance Information | Britestate",
    description: "Britestate's regulatory status, redress routes, and AML supervision.",
  },
};

export default function RegulatoryPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Regulatory & Compliance Information</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Regulatory &amp; Compliance Information
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This page is drafted for clarity and is pending final review by Britestate&rsquo;s legal
        team. The applicable regulators, redress-scheme memberships, and registration numbers must
        be confirmed before publication &mdash; do not assert membership of a scheme that has not
        been verified.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="company" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Landmark className="text-primary" size={22} /> Company Identity
          </h2>
          <p>
            Britestate is operated by <strong>Britestate Ltd</strong>, a company registered in
            England and Wales under company number <strong>[COMPANY NUMBER]</strong>, with its
            registered office at <strong>[REGISTERED ADDRESS]</strong>.
          </p>
        </section>

        <section id="bodies" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ShieldCheck className="text-primary" size={22} /> Regulatory Bodies &amp; Redress
          </h2>
          <p>
            Britestate is a technology platform connecting consumers with property professionals.
            The bodies most relevant to our service and the professionals who use it include:
          </p>
          <LabeledGrid
            columns={2}
            cells={[
              { title: "Information Commissioner's Office (ICO)", description: "Data protection and privacy." },
              { title: "Trading Standards", description: "Consumer protection and fair trading." },
              { title: "Property redress scheme", description: "Independent redress for property complaints. [Confirm membership.]" },
              { title: "HMRC", description: "Anti-money-laundering supervision (see below)." },
            ]}
          />
          <p className="text-sm text-neutral-500">
            Note: estate-agency and financial-services activities are regulated differently. Where a
            professional you engage is independently regulated (for example, a RICS surveyor or an
            FCA-authorised mortgage broker), their own regulator and redress route apply.
          </p>
        </section>

        <section id="aml" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Banknote className="text-primary" size={22} /> AML Supervision
          </h2>
          <p>
            We operate anti-money-laundering controls in line with the Money Laundering Regulations
            2017. Details of our obligations and customer due-diligence approach are set out in our{" "}
            <Link href="/legal/aml-policy" className="text-primary underline hover:no-underline">
              Anti-Money Laundering Policy
            </Link>
            . [Confirm HMRC AML registration status and number before publication.]
          </p>
        </section>

        <section id="complaints" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <MessageSquare className="text-primary" size={22} /> Complaints &amp; Escalation
          </h2>
          <p>
            If something has gone wrong, please tell us first via our{" "}
            <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
              Complaints Procedure
            </Link>
            . If we cannot resolve your complaint, you may be able to escalate to the relevant
            redress scheme or regulator listed above.
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run "src/app/(main)/legal/regulatory/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/legal/regulatory"
git commit -m "feat(legal): add Regulatory & Compliance Information page"
```

---

## Task 8: Professional Standards — `/legal/professional-standards`

**Files:**
- Create: `src/app/(main)/legal/professional-standards/page.tsx`
- Test: `src/app/(main)/legal/professional-standards/page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/legal/professional-standards" }));

import ProfessionalStandardsPage, { metadata } from "./page";

describe("Professional Standards page", () => {
  it("exports indexable metadata with the correct canonical", () => {
    expect(String(metadata.title)).toContain("Professional Standards");
    expect(String(metadata.alternates?.canonical)).toContain("/legal/professional-standards");
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("renders the h1 and every TOC section anchor", () => {
    render(<ProfessionalStandardsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Professional Standards/i }),
    ).toBeInTheDocument();
    for (const id of ["code-of-conduct", "ethics", "technical", "verification"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test --run "src/app/(main)/legal/professional-standards/page.test.tsx"`
Expected: FAIL ("Failed to resolve import ./page").

- [ ] **Step 3: Write the page**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Award, HeartHandshake, ShieldCheck, BadgeCheck } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { NumberedSteps } from "@/components/legal/NumberedSteps";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "code-of-conduct", label: "Core Code of Conduct" },
  { id: "ethics", label: "Ethics & Integrity" },
  { id: "technical", label: "Technical Standards" },
  { id: "verification", label: "Verification & Enforcement" },
];

export const metadata: Metadata = {
  title: "Professional Standards | Britestate",
  description:
    "The standards of conduct, ethics, and service quality Britestate expects from the estate agents, landlords, and service providers operating on the platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/professional-standards` },
  openGraph: {
    title: "Professional Standards | Britestate",
    description: "The conduct and quality standards we expect on Britestate.",
  },
};

export default function ProfessionalStandardsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Professional Standards</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Professional Standards</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        These standards are drafted for clarity and are pending final review by Britestate&rsquo;s
        legal team before publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="code-of-conduct" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Award className="text-primary" size={22} /> Core Code of Conduct
          </h2>
          <p>
            Everyone who offers a service on Britestate is expected to act honestly, fairly, and
            professionally. In particular, professionals must:
          </p>
          <ul>
            <li>Provide accurate, non-misleading listings and information.</li>
            <li>Communicate promptly and respectfully with users.</li>
            <li>Honour quoted fees and the terms they advertise.</li>
            <li>Comply with all applicable UK law and their own professional bodies.</li>
          </ul>
        </section>

        <section id="ethics" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <HeartHandshake className="text-primary" size={22} /> Ethics &amp; Integrity
          </h2>
          <p>
            We expect transparency about conflicts of interest, fair treatment of every user
            regardless of background (see our{" "}
            <Link href="/legal/fair-housing" className="text-primary underline hover:no-underline">
              Fair Housing Policy
            </Link>
            ), and zero tolerance for fraud, discrimination, or harassment.
          </p>
        </section>

        <section id="technical" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ShieldCheck className="text-primary" size={22} /> Technical Standards
          </h2>
          <p>Listings and profiles on Britestate should meet basic quality standards:</p>
          <ul>
            <li>Genuine, current photography and accurate property details.</li>
            <li>Correct pricing, tenure, and availability.</li>
            <li>Secure handling of any personal data shared through the platform.</li>
          </ul>
        </section>

        <section id="verification" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <BadgeCheck className="text-primary" size={22} /> Verification &amp; Enforcement
          </h2>
          <NumberedSteps
            steps={[
              {
                title: "Onboarding checks",
                body: "We verify professional accounts before they can transact on the platform.",
              },
              {
                title: "Ongoing monitoring",
                body: "We review reports and platform signals to identify conduct that breaches these standards.",
              },
              {
                title: "Action & escalation",
                body: (
                  <>
                    We may warn, suspend, or remove accounts that breach these standards. To report a
                    concern, use our{" "}
                    <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
                      Complaints Procedure
                    </Link>
                    .
                  </>
                ),
              },
            ]}
          />
        </section>
      </div>
    </LegalPageShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test --run "src/app/(main)/legal/professional-standards/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/legal/professional-standards"
git commit -m "feat(legal): add Professional Standards page"
```

---

## Task 9: Brand-guard test (no blue / no Stitch leftovers)

Codifies the marketing brand policy: the 5 new pages must contain no blue tokens, no `EstateLegal` branding, no Material Symbols, and no `href="#"` placeholders.

**Files:**
- Create: `src/__tests__/legal/brand-guard.test.ts`

- [ ] **Step 1: Write the test** (the pages already exist from Tasks 4–8, so this should pass green immediately; if it fails, fix the offending page).

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const NEW_LEGAL_PAGES = [
  "src/app/(main)/legal/fair-housing/page.tsx",
  "src/app/(main)/legal/refunds/page.tsx",
  "src/app/(main)/legal/third-party-services/page.tsx",
  "src/app/(main)/legal/regulatory/page.tsx",
  "src/app/(main)/legal/professional-standards/page.tsx",
] as const;

const BANNED: ReadonlyArray<{ label: string; re: RegExp }> = [
  { label: "blue brand-accent token", re: /\bbrand-accent\b/ },
  { label: "tailwind blue utility", re: /\b(?:text|bg|border|from|to|via|ring)-blue-\d{2,3}\b/ },
  { label: "hard-coded blue hex #2563EB", re: /#2563eb/i },
  { label: "leftover EstateLegal branding", re: /EstateLegal/ },
  { label: "Material Symbols icon font", re: /material-symbols/i },
  {
    label: 'placeholder href="#"',
    re: /href\s*=\s*(?:"#"|'#'|\{\s*(?:"#"|'#'|`#`)\s*\})/,
  },
];

describe("new legal pages brand guard", () => {
  it.each(NEW_LEGAL_PAGES)("%s contains no banned patterns", (filePath) => {
    const source = readFileSync(join(ROOT, filePath), "utf8");
    const hits = BANNED.filter(({ re }) => re.test(source)).map(({ label }) => label);
    expect(hits).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test --run src/__tests__/legal/brand-guard.test.ts`
Expected: PASS (5 cases). If any fail, remove the offending pattern from that page and re-run.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/legal/brand-guard.test.ts
git commit -m "test(legal): brand-guard against blue and Stitch leftovers on new pages"
```

---

## Task 10: Wire navigation, legal hub, footer, and sitemaps

Make the 5 pages reachable. This makes `configured-route-targets` / `canonical-link-targets` the verification: every configured href must map to a real route (which now exists).

**Files:**
- Modify: `src/components/legal/LegalLeftNav.tsx`
- Modify: `src/app/(main)/legal/page.tsx`
- Modify: `src/config/navigation.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/(main)/sitemap-page/page.tsx`

- [ ] **Step 1: Add to `LegalLeftNav.tsx`** — extend `NAV_CATEGORIES`. Add the two new items to the existing **Compliance** group, add one to **Platform**, and add a new **Standards & Fairness** category. Replace the `Compliance` and `Platform` entries and append the new category:

```ts
  {
    heading: "Compliance",
    items: [
      { href: "/legal/aml-policy", label: "AML Policy" },
      { href: "/legal/modern-slavery", label: "Modern Slavery Statement" },
      { href: "/legal/regulatory", label: "Regulatory Information" },
      { href: "/legal/third-party-services", label: "Third-Party Services" },
    ],
  },
  {
    heading: "Platform",
    items: [
      { href: "/legal/fee-transparency", label: "Fee Transparency" },
      { href: "/legal/refunds", label: "Refund & Cancellation" },
      { href: "/legal/ai-transparency", label: "AI Transparency Notice" },
      { href: "/legal/accessibility", label: "Accessibility Statement" },
      { href: "/legal/complaints", label: "Complaints Procedure" },
      { href: "/legal/disclaimer", label: "Disclaimer" },
    ],
  },
  {
    heading: "Standards & Fairness",
    items: [
      { href: "/legal/professional-standards", label: "Professional Standards" },
      { href: "/legal/fair-housing", label: "Fair Housing Policy" },
    ],
  },
```

- [ ] **Step 2: Add to the legal hub `src/app/(main)/legal/page.tsx`.** Import the new icons and add entries mirroring the left-nav. Add to the imports from `lucide-react`: `Landmark, Share2, ReceiptText, Award, HeartHandshake`. Then update the `categories` array — add the two compliance docs, the refund doc to Platform, and a new category:

```tsx
  {
    heading: "Compliance",
    docs: [
      { href: "/legal/aml-policy", icon: Briefcase, title: "Anti-Money Laundering Policy", desc: "Our AML obligations under the Money Laundering Regulations 2017." },
      { href: "/legal/modern-slavery", icon: Scale, title: "Modern Slavery Statement", desc: "Our commitment under the Modern Slavery Act 2015." },
      { href: "/legal/regulatory", icon: Landmark, title: "Regulatory Information", desc: "Our company identity, regulatory bodies, redress routes, and AML supervision." },
      { href: "/legal/third-party-services", icon: Share2, title: "Third-Party Services Disclosure", desc: "The processors that power Britestate and how we vet them." },
    ],
  },
```

Add to the **Platform** category's `docs` array:

```tsx
      { href: "/legal/refunds", icon: ReceiptText, title: "Refund & Cancellation Policy", desc: "How refunds, cancellations, and your cooling-off rights work." },
```

Append a new category after Platform:

```tsx
  {
    heading: "Standards & Fairness",
    docs: [
      { href: "/legal/professional-standards", icon: Award, title: "Professional Standards", desc: "Conduct, ethics, and service-quality standards we expect on the platform." },
      { href: "/legal/fair-housing", icon: HeartHandshake, title: "Fair Housing Policy", desc: "Our commitment to equal access to housing and a discrimination-free service." },
    ],
  },
```

- [ ] **Step 3: Add to the footer Legal column in `src/config/navigation.ts`.** In `FOOTER_LINKS`, the `heading: "Legal"` column, append two high-value links:

```ts
      { label: "Fair Housing", href: "/legal/fair-housing" },
      { label: "Regulatory", href: "/legal/regulatory" },
```

- [ ] **Step 4: Add to the XML sitemap `src/app/sitemap.ts`.** Extend the `legalSlugs` array:

```ts
  const legalSlugs = [
    "terms", "privacy", "cookies", "accessibility", "complaints",
    "gdpr-rights", "aml-policy", "modern-slavery", "data-processing",
    "disclaimer", "acceptable-use",
    "fair-housing", "refunds", "third-party-services", "regulatory",
    "professional-standards",
  ];
```

- [ ] **Step 5: Add to the HTML sitemap `src/app/(main)/sitemap-page/page.tsx`.** In the `sections` array, the `heading: "Legal"` entry, append to its `links`:

```tsx
      { label: "Refund & Cancellation Policy", href: "/legal/refunds" },
      { label: "Third-Party Services Disclosure", href: "/legal/third-party-services" },
      { label: "Regulatory Information", href: "/legal/regulatory" },
      { label: "Professional Standards", href: "/legal/professional-standards" },
      { label: "Fair Housing Policy", href: "/legal/fair-housing" },
```

- [ ] **Step 6: Run the navigation test suite** (verifies every configured href maps to a real route, no placeholders, internal links use `<Link>`).

Run: `pnpm test --run src/__tests__/navigation src/config/navigation.test.ts`
Expected: PASS. (If `configured-route-targets` flags a route, confirm the matching `page.tsx` exists and the href is spelled identically.)

- [ ] **Step 7: Commit**

```bash
git add src/components/legal/LegalLeftNav.tsx "src/app/(main)/legal/page.tsx" src/config/navigation.ts src/app/sitemap.ts "src/app/(main)/sitemap-page/page.tsx"
git commit -m "feat(legal): wire 5 new legal pages into nav, hub, footer, and sitemaps"
```

---

## Task 11: Audit the 4 existing pages for brand compliance

Confirm the pre-existing pages render and contain no blue. No redesign — only fix violations if found.

**Files (read; modify only on violation):**
- `src/app/(main)/sitemap-page/page.tsx`
- `src/app/(main)/tools/first-time-buyer-guide/page.tsx`
- `src/app/(main)/valuation/page.tsx`
- `src/app/(main)/legal/page.tsx`

- [ ] **Step 1: Scan for blue tokens** in the 4 files.

Run:
```bash
grep -nEi 'brand-accent|(text|bg|border|from|to|via|ring)-blue-[0-9]|#2563eb' \
  "src/app/(main)/sitemap-page/page.tsx" \
  "src/app/(main)/tools/first-time-buyer-guide/page.tsx" \
  "src/app/(main)/valuation/page.tsx" \
  "src/app/(main)/legal/page.tsx" || echo "NO BLUE FOUND"
```
Expected: `NO BLUE FOUND`. If any line is printed, replace the blue utility with the `primary` equivalent (e.g. `text-blue-600` → `text-primary`, `bg-blue-50` → `bg-primary/5`) and re-run.

- [ ] **Step 2: Confirm the pages compile/build** (covered by the build in Task 12; no separate test needed here).

- [ ] **Step 3: Commit only if a fix was made**

```bash
git add -A && git commit -m "fix(brand): replace blue tokens with primary on existing public pages"
```
(If `NO BLUE FOUND`, skip this commit.)

---

## Task 12: Full verification gate

- [ ] **Step 1: Full unit test run.**

Run: `pnpm test --run`
Expected: PASS (all suites, including the new component/page/brand-guard tests and the navigation suite).

- [ ] **Step 2: Lint.**

Run: `pnpm lint`
Expected: no errors. (Fix any: e.g. unused imports, `import type` for type-only imports.)

- [ ] **Step 3: Production build.**

Run: `pnpm build`
Expected: build succeeds; the 5 new routes appear in the build output under `/legal/*`.

- [ ] **Step 4: Link-render E2E** (existing config renders pages and checks links resolve).

Run: `pnpm exec playwright test --config=playwright.link-render.config.ts`
Expected: PASS for the 5 new routes (200, links resolve, breadcrumbs render). If the config needs an explicit route list, add the 5 `/legal/*` paths to its fixture.

- [ ] **Step 5: Visual + a11y spot check.** Start the dev server and screenshot each new page at 320/768/1024/1440.

Run:
```bash
pnpm dev &
# then drive screenshots via the project's /browse or playwright screenshot config
```
Verify per page: single `h1`; left doc-nav highlights the active page; right "On This Page" TOC tracks scroll; visible focus rings on links; layout has no horizontal overflow at 320px; only green/gold accents (no blue).

- [ ] **Step 6: Adversarial copy/data review** (per prior restyle-agent drift). Diff each new page vs. its Stitch reference and confirm: no fabricated regulator memberships or numbers (all unknowns are `[BRACKET]` placeholders), no fake buttons (every CTA links to a real route or `mailto:`), no dropped sections, no `EstateLegal`/Material-Symbols leftovers.

Run: `git diff --stat feature/marketing-legal-pages` and review each `page.tsx`.

- [ ] **Step 7: Final commit (if any verification fixes were made).**

```bash
git add -A && git commit -m "chore(legal): verification fixes for marketing/legal pages"
```

---

## Self-Review (author's check against the spec)

- **Spec coverage:** 5 pages → Tasks 4–8. Reusable shell → reuse existing `LegalPageShell` (spec over-proposed a new one; corrected here). Primitives → `NumberedSteps`/`LabeledGrid` (Tasks 2–3), scroll-spy nav already exists (`LegalRightToc`). Brand/no-blue → Task 9 + Task 11. Wiring (nav/hub/footer/sitemaps) → Task 10. TDD tests (component/route/brand-guard/link-render) → Tasks 2–9, 12. Copy drafted + legal-review flagged → amber notes + `[BRACKET]` placeholders in each page. Existing-page audit → Task 11. Verification gate → Task 12.
- **Placeholder scan:** No "TBD/TODO/implement later". The `[COMPANY NUMBER]`/`[REGISTERED ADDRESS]`/`[Confirm…]` strings are deliberate legal-review markers (documented), matching the existing `terms` page convention — not plan gaps.
- **Type/name consistency:** `LegalPageShell` prop is `toc` (matches source). `NumberedSteps` prop `steps: {title, body}[]`; `LabeledGrid` prop `cells: {title, description?}[]`, `columns?: 2|3` — used consistently across Tasks 4–8. Section `id`s in each page match that page's `SECTIONS` and its test assertions.
- **Note:** `LegalLeftNav` and `legal/page.tsx` duplicate the category list (pre-existing duplication); Task 10 updates both to keep them in sync — not refactored further (out of scope).
