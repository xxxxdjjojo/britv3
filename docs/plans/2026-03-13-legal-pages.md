# Legal Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing single-page `/legal` mega-page with an 11-document Legal Hub, a PECR-compliant cookie consent system (banner + preferences modal), and a GDPR subject rights request form.

**Architecture:** `LegalPageShell` (Server Component) wraps each document page in a three-column grid (sticky left nav, article content, right ToC); `CookieConsentContext` provides anonymous-user cookie consent state with a modal controller; the GDPR form posts to `/api/legal/gdpr-request` for email dispatch via Resend.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, Supabase client for auth detection, Upstash Redis for rate limiting, Resend for email, nanoid for reference IDs.

---

## Pre-flight Checks

Before starting:
1. Confirm packages are installed. From the working directory (repo root `britv3.0/`…  actually the CWD `/Users/joanflerinbig/Documents/britv3.0/` IS the Next.js app root — run pnpm commands from there):
   ```bash
   cat package.json | grep -E '"nanoid|resend|@upstash'
   ```
2. If missing, install:
   ```bash
   pnpm add nanoid resend @upstash/redis @upstash/ratelimit
   ```

**Font class note:** The spec refers to `font-display` and `font-body` but the actual Tailwind v4 utilities defined in `globals.css` are:
- `font-heading` → Plus Jakarta Sans (use this for headings instead of `font-display`)
- `font-sans` → Inter (this is the default; no explicit class needed for body)

**Path note:** All `src/` paths are relative to the Next.js app root (the working directory). The git path prefix is `britv3.0/src/...` but you work with `src/...` directly.

---

## Task 1: Legal Navigation Client Components

**Files:**
- Create: `src/components/legal/LegalLeftNav.tsx`
- Create: `src/components/legal/LegalRightToc.tsx`

### Step 1: Create `src/components/legal/LegalLeftNav.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    category: "User Agreements",
    items: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/acceptable-use", label: "Acceptable Use Policy" },
    ],
  },
  {
    category: "Privacy & Data Protection",
    items: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/cookies", label: "Cookie Policy" },
      { href: "/legal/gdpr-rights", label: "GDPR Data Subject Rights" },
      { href: "/legal/data-processing", label: "Data Processing Agreement" },
    ],
  },
  {
    category: "Compliance",
    items: [
      { href: "/legal/aml-policy", label: "AML Policy" },
      { href: "/legal/modern-slavery", label: "Modern Slavery Statement" },
    ],
  },
  {
    category: "Platform",
    items: [
      { href: "/legal/accessibility", label: "Accessibility Statement" },
      { href: "/legal/complaints", label: "Complaints Procedure" },
      { href: "/legal/disclaimer", label: "Disclaimer" },
    ],
  },
] as const;

export function LegalLeftNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Legal documents navigation">
      {/* Desktop: vertical categorised nav */}
      <div className="hidden lg:block space-y-6">
        {NAV_ITEMS.map(({ category, items }) => (
          <div key={category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              {category}
            </p>
            <ul className="space-y-1">
              {items.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={
                        active
                          ? "block rounded-md px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary"
                          : "block rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:text-primary hover:bg-neutral-50 transition-colors"
                      }
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scrollable pill row */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {NAV_ITEMS.flatMap(({ items }) =>
          items.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium bg-primary text-white"
                    : "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                }
              >
                {label}
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
}
```

### Step 2: Create `src/components/legal/LegalRightToc.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";

type TocSection = { id: string; label: string };

export function LegalRightToc(props: Readonly<{ sections: TocSection[] }>) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    props.sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(id);
          }
        },
        { rootMargin: "0px 0px -60% 0px", threshold: 0.4 }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [props.sections]);

  if (props.sections.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        On This Page
      </p>
      <ul className="space-y-1.5">
        {props.sections.map(({ id, label }) => {
          const active = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={
                  active
                    ? "block border-l-2 border-primary pl-3 text-sm font-medium text-primary"
                    : "block border-l-2 border-transparent pl-3 text-sm text-neutral-500 hover:text-primary transition-colors"
                }
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

### Step 3: Verify build passes

```bash
pnpm build
```

Expected: Build succeeds (new components are not yet imported anywhere — no errors expected).

### Step 4: Commit

```bash
git add src/components/legal/LegalLeftNav.tsx src/components/legal/LegalRightToc.tsx
git commit -m "feat(legal): add LegalLeftNav and LegalRightToc client components"
```

---

## Task 2: LegalPageShell Server Component

**Files:**
- Create: `src/components/legal/LegalPageShell.tsx`

### Step 1: Create `src/components/legal/LegalPageShell.tsx`

```tsx
import type { ReactNode } from "react";
import { LegalLeftNav } from "./LegalLeftNav";
import { LegalRightToc } from "./LegalRightToc";

type TocSection = { id: string; label: string };

export function LegalPageShell(props: Readonly<{
  toc: TocSection[];
  children: ReactNode;
}>) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-8 xl:gap-16">
        {/* Left nav — hidden on mobile (mobile pill row is rendered inside LegalLeftNav) */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <LegalLeftNav />
        </aside>

        {/* Article content */}
        <article className="min-w-0">
          {props.children}
        </article>

        {/* Right ToC — hidden on mobile */}
        <aside className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
          <LegalRightToc sections={props.toc} />
        </aside>
      </div>
    </div>
  );
}
```

### Step 2: Verify build passes

```bash
pnpm build
```

### Step 3: Commit

```bash
git add src/components/legal/LegalPageShell.tsx
git commit -m "feat(legal): add LegalPageShell three-column layout Server Component"
```

---

## Task 3: Legal Hub Index + Thin Layout

**Files:**
- Create: `src/app/(main)/legal/layout.tsx`
- Modify: `src/app/(main)/legal/page.tsx` (full rewrite)

### Step 1: Create `src/app/(main)/legal/layout.tsx`

```tsx
import type { ReactNode } from "react";

// Thin pass-through — required by Next.js for nested routes.
// Three-column shell is handled by LegalPageShell in each document page.
export default function LegalLayout(props: Readonly<{ children: ReactNode }>) {
  return <>{props.children}</>;
}
```

### Step 2: Rewrite `src/app/(main)/legal/page.tsx`

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText, Shield, Cookie, UserCheck, Database,
  Eye, AlertTriangle, MessageSquare, Briefcase, Scale, Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Hub | Britestate",
  description: "Britestate's legal documents, policies, and compliance information.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/legal`,
  },
};

const CATEGORIES = [
  {
    title: "User Agreements",
    items: [
      { href: "/legal/terms", icon: FileText, title: "Terms of Service", desc: "Rules governing your use of the Britestate platform." },
      { href: "/legal/acceptable-use", icon: AlertTriangle, title: "Acceptable Use Policy", desc: "Conduct standards and prohibited activities on the platform." },
    ],
  },
  {
    title: "Privacy & Data Protection",
    items: [
      { href: "/legal/privacy", icon: Shield, title: "Privacy Policy", desc: "How we collect, use, and protect your personal data under UK GDPR." },
      { href: "/legal/cookies", icon: Cookie, title: "Cookie Policy", desc: "Details of cookies we use and how to manage your preferences." },
      { href: "/legal/gdpr-rights", icon: UserCheck, title: "GDPR Data Subject Rights", desc: "Your eight rights under UK GDPR and how to exercise them." },
      { href: "/legal/data-processing", icon: Database, title: "Data Processing Agreement", desc: "DPA terms for service providers operating on the platform." },
    ],
  },
  {
    title: "Compliance",
    items: [
      { href: "/legal/aml-policy", icon: Briefcase, title: "Anti-Money Laundering Policy", desc: "Our AML obligations under the Money Laundering Regulations 2017." },
      { href: "/legal/modern-slavery", icon: Scale, title: "Modern Slavery Statement", desc: "Our commitment under the Modern Slavery Act 2015." },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/legal/accessibility", icon: Eye, title: "Accessibility Statement", desc: "Our WCAG 2.1 AA compliance status and known limitations." },
      { href: "/legal/complaints", icon: MessageSquare, title: "Complaints Procedure", desc: "How to raise a complaint and escalation options." },
      { href: "/legal/disclaimer", icon: Info, title: "Disclaimer", desc: "Limitations on the advice and information we provide." },
    ],
  },
] as const;

export default function LegalHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="mb-16 max-w-2xl">
        <h1 className="mb-4 text-4xl font-bold font-heading tracking-tight text-neutral-900">
          Legal Hub
        </h1>
        <p className="text-lg text-neutral-600">
          Britestate&apos;s legal documents, policies, and compliance information.
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-16">
        {CATEGORIES.map(({ title, items }) => (
          <section key={title}>
            <h2 className="mb-6 text-xl font-semibold font-heading text-neutral-900 border-b border-neutral-200 pb-3">
              {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(({ href, icon: Icon, title: docTitle, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-start gap-4 rounded-xl border border-neutral-200 p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="shrink-0 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
                      {docTitle}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{desc}</p>
                  </div>
                  <span className="shrink-0 text-neutral-400 group-hover:text-primary transition-colors mt-1">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Verify build passes

```bash
pnpm build
```

### Step 4: Commit

```bash
git add src/app/(main)/legal/layout.tsx src/app/(main)/legal/page.tsx
git commit -m "feat(legal): add thin layout and rebuild hub index as card grid"
```

---

## Task 4: Terms of Service + Privacy Policy Pages

**Files:**
- Create: `src/app/(main)/legal/terms/page.tsx`
- Create: `src/app/(main)/legal/privacy/page.tsx`

These two pages migrate content from the existing `/terms` and `/privacy` pages, expanded per spec.

### Step 1: Create `src/app/(main)/legal/terms/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "user-accounts", label: "2. User Accounts" },
  { id: "acceptable-use", label: "3. Acceptable Use" },
  { id: "intellectual-property", label: "4. Intellectual Property" },
  { id: "disclaimers", label: "5. Disclaimers" },
  { id: "liability", label: "6. Limitation of Liability" },
  { id: "governing-law", label: "7. Governing Law" },
  { id: "changes", label: "8. Changes to Terms" },
];

export const metadata: Metadata = {
  title: "Terms of Service | Britestate",
  description: "The terms and conditions governing your use of the Britestate platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/terms` },
  openGraph: { title: "Terms of Service | Britestate", description: "Terms and conditions for Britestate." },
};

export default function TermsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Terms of Service</span>
      </nav>

      {/* Mobile left nav */}
      <div className="lg:hidden mb-8">
        {/* LegalLeftNav pill row is rendered inside LegalPageShell on mobile */}
      </div>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Terms of Service</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        {/* TODO: legal review */}
        Please read these terms carefully before using Britestate. By accessing or using our platform,
        you agree to be bound by these terms.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Britestate platform
            operated by Britestate Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
            a company registered in England and Wales (Company No. 12345678).
            {/* TODO: legal review */}
          </p>
        </section>

        <section id="user-accounts">
          <h2 className="text-2xl font-bold font-heading">2. User Accounts</h2>
          <p>
            You must provide accurate information when creating an account. You are responsible for
            maintaining the confidentiality of your account credentials. Notify us immediately at{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a> if you suspect
            unauthorised access. {/* TODO: legal review */}
          </p>
        </section>

        <section id="acceptable-use">
          <h2 className="text-2xl font-bold font-heading">3. Acceptable Use</h2>
          <p>
            You agree not to use Britestate for unlawful purposes, to post fraudulent listings, to
            impersonate others, or to scrape our platform without written permission. Full details are
            in our{" "}
            <Link href="/legal/acceptable-use" className="text-primary hover:underline">
              Acceptable Use Policy
            </Link>
            . {/* TODO: legal review */}
          </p>
        </section>

        <section id="intellectual-property">
          <h2 className="text-2xl font-bold font-heading">4. Intellectual Property</h2>
          <p>
            All content on Britestate — including logos, text, and software — is owned by or licensed
            to Britestate Ltd and protected by copyright, database rights, and other intellectual
            property laws. {/* TODO: legal review */}
          </p>
        </section>

        <section id="disclaimers">
          <h2 className="text-2xl font-bold font-heading">5. Disclaimers</h2>
          <p>
            Britestate is a platform intermediary. We do not provide legal, financial, surveying, or
            mortgage advice. Listings and valuations are provided by third parties. See our{" "}
            <Link href="/legal/disclaimer" className="text-primary hover:underline">
              Disclaimer
            </Link>{" "}
            for full details. {/* TODO: legal review */}
          </p>
        </section>

        <section id="liability">
          <h2 className="text-2xl font-bold font-heading">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Britestate Ltd is not liable for indirect,
            incidental, or consequential damages arising from your use of the platform. Our aggregate
            liability shall not exceed the fees paid by you in the preceding 12 months. Nothing in
            these Terms limits liability for fraud, death, or personal injury caused by our
            negligence. {/* TODO: legal review */}
          </p>
        </section>

        <section id="governing-law">
          <h2 className="text-2xl font-bold font-heading">7. Governing Law</h2>
          <p>
            These Terms are governed by the laws of England and Wales. Any disputes shall be subject
            to the exclusive jurisdiction of the courts of England and Wales. {/* TODO: legal review */}
          </p>
        </section>

        <section id="changes">
          <h2 className="text-2xl font-bold font-heading">8. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. We will notify you by email or in-app notification
            at least 14 days before material changes take effect. Continued use of Britestate after
            that date constitutes acceptance. {/* TODO: legal review */}
          </p>
        </section>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terms of Service",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/terms`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
```

### Step 2: Create `src/app/(main)/legal/privacy/page.tsx`

Follow the exact same structure. Key differences from spec section 4.2:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "data-we-collect", label: "2. Data We Collect" },
  { id: "legal-basis", label: "3. Legal Basis for Processing" },
  { id: "how-we-use", label: "4. How We Use Your Data" },
  { id: "data-sharing", label: "5. Data Sharing" },
  { id: "data-retention", label: "6. Data Retention" },
  { id: "international-transfers", label: "7. International Transfers" },
  { id: "your-rights", label: "8. Your Rights" },
  { id: "cookies", label: "9. Cookies" },
  { id: "dpo-contact", label: "10. DPO Contact" },
  { id: "changes", label: "11. Changes" },
];

export const metadata: Metadata = {
  title: "Privacy Policy | Britestate",
  description: "How Britestate collects, uses, and protects your personal data under UK GDPR.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/privacy` },
  openGraph: { title: "Privacy Policy | Britestate", description: "Britestate Privacy Policy." },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Privacy Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Privacy Policy</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        {/* TODO: legal review */}
        This policy explains how Britestate Ltd processes your personal data in compliance with
        UK GDPR and the Data Protection Act 2018.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            Britestate Ltd (&ldquo;we&rdquo;) is the data controller. ICO registration: [pending].
            Contact: <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a>.
            {/* TODO: legal review */}
          </p>
        </section>

        <section id="data-we-collect">
          <h2 className="text-2xl font-bold font-heading">2. Data We Collect</h2>
          <p>We collect: account information (name, email, phone), property search history, listing data, payment data (via Stripe — we do not store card numbers), device and usage data, and communications. {/* TODO: legal review */}</p>
        </section>

        <section id="legal-basis">
          <h2 className="text-2xl font-bold font-heading">3. Legal Basis for Processing</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50">
                <th className="border border-neutral-200 p-3 text-left font-semibold">Purpose</th>
                <th className="border border-neutral-200 p-3 text-left font-semibold">Lawful Basis (UK GDPR Art. 6)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Account creation and management", "Contract (Art. 6(1)(b))"],
                ["Property search and listings", "Contract (Art. 6(1)(b))"],
                ["Marketing emails (opted in)", "Consent (Art. 6(1)(a))"],
                ["Analytics and platform improvement", "Legitimate interests (Art. 6(1)(f))"],
                ["Legal compliance (AML, GDPR)", "Legal obligation (Art. 6(1)(c))"],
              ].map(([purpose, basis]) => (
                <tr key={purpose}>
                  <td className="border border-neutral-200 p-3">{purpose}</td>
                  <td className="border border-neutral-200 p-3">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* TODO: legal review — expand table */}
        </section>

        <section id="how-we-use">
          <h2 className="text-2xl font-bold font-heading">4. How We Use Your Data</h2>
          <p>We use your data to operate the platform, send transactional emails, personalise search results, and improve our services. {/* TODO: legal review */}</p>
        </section>

        <section id="data-sharing">
          <h2 className="text-2xl font-bold font-heading">5. Data Sharing</h2>
          <p>We share data with: Supabase (database hosting), Stripe (payments), Resend (email), PostHog (analytics), Sentry (error tracking). We do not sell your data. {/* TODO: legal review */}</p>
        </section>

        <section id="data-retention">
          <h2 className="text-2xl font-bold font-heading">6. Data Retention</h2>
          <p>Account data: retained while account is active, then 30 days for deletion grace period. Financial records: 7 years (legal requirement). {/* TODO: legal review */}</p>
        </section>

        <section id="international-transfers">
          <h2 className="text-2xl font-bold font-heading">7. International Transfers</h2>
          <p>Some processors operate outside the UK. Transfers are protected by UK adequacy decisions or Standard Contractual Clauses. {/* TODO: legal review */}</p>
        </section>

        <section id="your-rights">
          <h2 className="text-2xl font-bold font-heading">8. Your Rights</h2>
          <p>You have rights of access, erasure, portability, rectification, restriction, and objection. Exercise them via our <Link href="/legal/gdpr-rights" className="text-primary hover:underline">GDPR Rights page</Link>. {/* TODO: legal review */}</p>
        </section>

        <section id="cookies">
          <h2 className="text-2xl font-bold font-heading">9. Cookies</h2>
          <p>See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link> for full details. {/* TODO: legal review */}</p>
        </section>

        <section id="dpo-contact">
          <h2 className="text-2xl font-bold font-heading">10. DPO Contact</h2>
          <p>Data Protection Officer: <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a>. {/* TODO: legal review */}</p>
        </section>

        <section id="changes">
          <h2 className="text-2xl font-bold font-heading">11. Changes</h2>
          <p>We will notify you of material changes via email. {/* TODO: legal review */}</p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Privacy Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/privacy`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
```

### Step 3: Verify build

```bash
pnpm build
```

### Step 4: Commit

```bash
git add src/app/(main)/legal/terms/page.tsx src/app/(main)/legal/privacy/page.tsx
git commit -m "feat(legal): add Terms of Service and Privacy Policy document pages"
```

---

## Task 5: Cookies, Acceptable Use, and GDPR Rights Pages

**Files:**
- Create: `src/app/(main)/legal/cookies/page.tsx`
- Create: `src/app/(main)/legal/acceptable-use/page.tsx`
- Create: `src/app/(main)/legal/gdpr-rights/page.tsx`

Each page follows the same scaffold as Task 4. Key differences:

### Step 1: Create `src/app/(main)/legal/cookies/page.tsx`

Sections per spec 4.3: What Are Cookies, Categories (Essential/Analytics/Marketing/Third Party), Cookie Table (name, purpose, duration, type), How to Manage Cookies, Manage Preferences.

The "Manage Preferences" section uses a `<button>` that calls `openPreferences()` from `CookieConsentContext`. Since `CookieConsentContext` does not exist yet, **import it as a forward reference** — create a thin `CookiePreferencesButton` placeholder that will be wired up in Task 9.

For now, use a placeholder:
```tsx
// Section 5 placeholder — will be replaced in Task 9
<div id="manage-preferences">
  <h2 className="text-2xl font-bold font-heading">5. Manage Preferences</h2>
  <p className="mb-4 text-neutral-600">Use the button below to update your cookie preferences at any time.</p>
  {/* CookiePreferencesButton inserted in Task 9 */}
  <button
    type="button"
    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
  >
    Manage Cookie Preferences
  </button>
</div>
```

Full `SECTIONS` for ToC:
```ts
const SECTIONS = [
  { id: "what-are-cookies", label: "1. What Are Cookies" },
  { id: "categories", label: "2. Categories" },
  { id: "cookie-table", label: "3. Cookie Table" },
  { id: "how-to-manage", label: "4. How to Manage" },
  { id: "manage-preferences", label: "5. Manage Preferences" },
];
```

Cookie table data:
```tsx
const COOKIE_TABLE = [
  { name: "sb-*-auth-token", purpose: "Supabase authentication session", duration: "Session / 1 year", type: "Essential" },
  { name: "brite_cookie_consent", purpose: "Stores your cookie consent preferences", duration: "1 year", type: "Essential" },
  { name: "ph_*", purpose: "PostHog analytics — page views and feature usage", duration: "1 year", type: "Analytics" },
  { name: "_ga, _ga_*", purpose: "Google Analytics — aggregate usage statistics", duration: "2 years", type: "Analytics" },
  { name: "_fbp", purpose: "Facebook Pixel — conversion tracking", duration: "3 months", type: "Marketing" },
  { name: "__stripe_mid", purpose: "Stripe fraud prevention", duration: "1 year", type: "Third Party" },
];
```

Metadata:
```ts
export const metadata: Metadata = {
  title: "Cookie Policy | Britestate",
  description: "Details of cookies Britestate uses and how to manage your preferences.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/cookies` },
};
```

### Step 2: Create `src/app/(main)/legal/acceptable-use/page.tsx`

Sections per spec 4.4:
```ts
const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "permitted-uses", label: "2. Permitted Uses" },
  { id: "prohibited-conduct", label: "3. Prohibited Conduct" },
  { id: "content-standards", label: "4. Content Standards" },
  { id: "enforcement", label: "5. Enforcement & Suspension" },
  { id: "appeals", label: "6. Appeals Process" },
];
```

Callout text: "This policy supplements our Terms of Service. Violations may result in account suspension."

Include references: Fraud Act 2006, Computer Misuse Act 1990, Online Safety Act 2023 in sections 1 or 3.

Metadata:
```ts
export const metadata: Metadata = {
  title: "Acceptable Use Policy | Britestate",
  description: "Conduct standards and prohibited activities on the Britestate platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/acceptable-use` },
};
```

### Step 3: Create `src/app/(main)/legal/gdpr-rights/page.tsx`

Sections per spec 4.5:
```ts
const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "right-to-access", label: "2.1 Right of Access" },
  { id: "right-to-erasure", label: "2.2 Right to Erasure" },
  { id: "right-to-portability", label: "2.3 Right to Portability" },
  { id: "right-to-rectification", label: "2.4 Right to Rectification" },
  { id: "right-to-restriction", label: "2.5 Right to Restriction" },
  { id: "right-to-object", label: "2.6 Right to Object" },
  { id: "withdraw-consent", label: "2.7 Withdraw Consent" },
  { id: "lodge-complaint", label: "2.8 Lodge Complaint" },
  { id: "submit-request", label: "3. Submit a Request" },
  { id: "response-timelines", label: "4. Response Timelines" },
  { id: "exemptions", label: "5. Exemptions" },
  { id: "ico-complaint", label: "6. ICO Complaint" },
];
```

Section 2 uses H3 for each right (nested under H2 "2. Your Eight Rights").

Section 3 "Submit a Request" renders `<GdprRequestForm />` — which doesn't exist yet. Use a placeholder:
```tsx
{/* GdprRequestForm — added in Task 11 */}
<div id="submit-request" className="mt-4 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
  <p className="text-sm text-neutral-500">Request form loading&hellip;</p>
</div>
```

Metadata:
```ts
export const metadata: Metadata = {
  title: "GDPR Data Subject Rights | Britestate",
  description: "Exercise your eight rights under UK GDPR — access, erasure, portability, and more.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/gdpr-rights` },
};
```

### Step 4: Verify build

```bash
pnpm build
```

### Step 5: Commit

```bash
git add src/app/(main)/legal/cookies/page.tsx src/app/(main)/legal/acceptable-use/page.tsx src/app/(main)/legal/gdpr-rights/page.tsx
git commit -m "feat(legal): add Cookies, Acceptable Use, and GDPR Rights pages"
```

---

## Task 6: Data Processing, Accessibility, and Complaints Pages

**Files:**
- Create: `src/app/(main)/legal/data-processing/page.tsx`
- Create: `src/app/(main)/legal/accessibility/page.tsx`
- Create: `src/app/(main)/legal/complaints/page.tsx`

### Step 1: Create each page using the established scaffold

**`data-processing/page.tsx`** — Sections per spec 4.6:
```ts
const SECTIONS = [
  { id: "definitions", label: "1. Definitions" },
  { id: "subject-matter", label: "2. Subject Matter & Duration" },
  { id: "nature-and-purpose", label: "3. Nature & Purpose of Processing" },
  { id: "personal-data-types", label: "4. Types of Personal Data" },
  { id: "processor-obligations", label: "5. Obligations of the Processor" },
  { id: "sub-processors", label: "6. Sub-Processors" },
  { id: "security-measures", label: "7. Security Measures" },
  { id: "breach-notification", label: "8. Data Breach Notification" },
  { id: "audit-rights", label: "9. Audit Rights" },
  { id: "termination", label: "10. Termination" },
];
```

Section 6 includes a sub-processors table (name, purpose, location):
```tsx
const SUB_PROCESSORS = [
  { name: "Supabase", purpose: "Database hosting and authentication", location: "EU / USA (SCCs)" },
  { name: "Stripe", purpose: "Payment processing", location: "USA (SCCs)" },
  { name: "Resend", purpose: "Transactional email", location: "USA (SCCs)" },
  { name: "PostHog", purpose: "Product analytics", location: "EU" },
  { name: "Sentry", purpose: "Error monitoring", location: "USA (SCCs)" },
];
```

Section 8 must mention the 72-hour GDPR breach notification requirement.

Callout text: "This agreement applies to all service providers and businesses integrating with the Britestate API."

**`accessibility/page.tsx`** — Sections per spec 4.7:
```ts
const SECTIONS = [
  { id: "compliance-status", label: "1. Compliance Status" },
  { id: "known-limitations", label: "2. Known Limitations" },
  { id: "feedback-contact", label: "3. Feedback & Contact" },
  { id: "enforcement", label: "4. Enforcement" },
  { id: "technical-information", label: "5. Technical Information" },
  { id: "preparation", label: "6. Preparation of Statement" },
];
```

Section 1 states WCAG 2.1 Level AA compliance commitment. Section 4 references the EHRC.

**`complaints/page.tsx`** — Sections per spec 4.8:
```ts
const SECTIONS = [
  { id: "overview", label: "1. Overview" },
  { id: "step-1-support", label: "2. Step 1 — Contact Support" },
  { id: "step-2-escalation", label: "3. Step 2 — Formal Escalation" },
  { id: "step-3-external", label: "4. Step 3 — External Resolution" },
  { id: "registered-address", label: "5. Registered Address" },
];
```

Section 4 references TPO, ICO, and ADR. Section 5 shows: "Britestate Ltd, 123 Placeholder Street, London EC1A 1BB" (with `// TODO: update with real address`).

### Step 2: Verify build

```bash
pnpm build
```

### Step 3: Commit

```bash
git add src/app/(main)/legal/data-processing/page.tsx src/app/(main)/legal/accessibility/page.tsx src/app/(main)/legal/complaints/page.tsx
git commit -m "feat(legal): add Data Processing Agreement, Accessibility Statement, and Complaints pages"
```

---

## Task 7: AML Policy, Modern Slavery, and Disclaimer Pages

**Files:**
- Create: `src/app/(main)/legal/aml-policy/page.tsx`
- Create: `src/app/(main)/legal/modern-slavery/page.tsx`
- Create: `src/app/(main)/legal/disclaimer/page.tsx`

### Step 1: Create each page

**`aml-policy/page.tsx`** — Sections per spec 4.9:
```ts
const SECTIONS = [
  { id: "policy-statement", label: "1. Policy Statement" },
  { id: "risk-assessment", label: "2. Risk Assessment Approach" },
  { id: "cdd", label: "3. Customer Due Diligence" },
  { id: "edd", label: "4. Enhanced Due Diligence" },
  { id: "sar-obligations", label: "5. Suspicious Activity Reporting" },
  { id: "record-keeping", label: "6. Record Keeping" },
  { id: "staff-training", label: "7. Staff Training" },
  { id: "mlro-contact", label: "8. MLRO Contact" },
];
```

References: Proceeds of Crime Act 2002, Money Laundering Regulations 2017.
Section 6: 5-year record keeping requirement.
MLRO contact: `compliance@britestate.co.uk` (with `// TODO: confirm MLRO contact`).

**`modern-slavery/page.tsx`** — Sections per spec 4.10:
```ts
const SECTIONS = [
  { id: "organisation", label: "1. Organisation & Supply Chains" },
  { id: "policies", label: "2. Policies in Relation to Slavery" },
  { id: "due-diligence", label: "3. Due Diligence Processes" },
  { id: "risk-assessment", label: "4. Risk Assessment" },
  { id: "kpis", label: "5. KPIs & Effectiveness" },
  { id: "training", label: "6. Training" },
  { id: "board-approval", label: "7. Board Approval" },
];
```

Reference: Modern Slavery Act 2015.

**`disclaimer/page.tsx`** — Sections per spec 4.11:
```ts
const SECTIONS = [
  { id: "no-advice", label: "1. No Professional Advice" },
  { id: "accuracy", label: "2. Accuracy of Information" },
  { id: "third-party-links", label: "3. Third-Party Links" },
  { id: "intermediary", label: "4. Platform as Intermediary" },
  { id: "liability", label: "5. Limitation of Liability" },
  { id: "jurisdiction", label: "6. Jurisdiction" },
];
```

### Step 2: Verify build

```bash
pnpm build
```

### Step 3: Commit

```bash
git add src/app/(main)/legal/aml-policy/page.tsx src/app/(main)/legal/modern-slavery/page.tsx src/app/(main)/legal/disclaimer/page.tsx
git commit -m "feat(legal): add AML Policy, Modern Slavery Statement, and Disclaimer pages"
```

---

## Task 8: CookieConsentContext

**Files:**
- Create: `src/contexts/CookieConsentContext.tsx`

### Step 1: Create `src/contexts/CookieConsentContext.tsx`

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useConsent } from "@/hooks/useConsent";
import type { ConsentType } from "@/types/gdpr";

const COOKIE_NAME = "brite_cookie_consent";
const COOKIE_VERSION = 1;

type ConsentPrefs = { analytics: boolean; marketing: boolean; third_party: boolean };

type CookieConsentContextValue = {
  consent: ConsentPrefs | null;
  updateConsent: (prefs: Partial<Record<ConsentType, boolean>>) => void;
  openPreferences: () => void;
  isPreferencesOpen: boolean;
  closePreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readCookie(): ConsentPrefs | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return null;
  }
}

function writeCookie(prefs: ConsentPrefs) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify({ ...prefs, version: COOKIE_VERSION })
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

export function CookieConsentProvider(props: Readonly<{ children: ReactNode }>) {
  const [consent, setConsent] = useState<ConsentPrefs | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  // useConsent is a no-op when no user is authenticated — safe to call unconditionally.
  const { updateConsent: dbUpdateConsent } = useConsent();
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const stored = readCookie();
    setConsent(stored);
  }, []);

  const updateConsent = useCallback(
    (prefs: Partial<Record<ConsentType, boolean>>) => {
      setConsent((prev) => {
        const current: ConsentPrefs = prev ?? {
          analytics: false,
          marketing: false,
          third_party: false,
        };
        const next: ConsentPrefs = { ...current, ...prefs };
        writeCookie(next);
        // Sync to DB for authenticated users — dbUpdateConsent no-ops when not logged in.
        for (const [type, granted] of Object.entries(prefs) as [ConsentType, boolean][]) {
          void dbUpdateConsent(type, granted);
        }
        return next;
      });
    },
    [dbUpdateConsent]
  );

  const openPreferences = useCallback(() => setIsPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setIsPreferencesOpen(false), []);

  const value = useMemo(
    () => ({ consent, updateConsent, openPreferences, isPreferencesOpen, closePreferences }),
    [consent, updateConsent, openPreferences, isPreferencesOpen, closePreferences]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {props.children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
```

### Step 2: Verify build

```bash
pnpm build
```

Expected: Build passes. Context not yet wired into the app.

### Step 3: Commit

```bash
git add src/contexts/CookieConsentContext.tsx
git commit -m "feat(legal): add CookieConsentContext for PECR anonymous consent layer"
```

---

## Task 9: CookieConsentBanner + Preferences Modal

**Files:**
- Create: `src/components/legal/CookieConsentBanner.tsx`

### Step 1: Create `src/components/legal/CookieConsentBanner.tsx`

```tsx
"use client";

import { useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import type { ConsentType } from "@/types/gdpr";
import { X } from "lucide-react";

type Toggle = { type: ConsentType; label: string; description: string };

const TOGGLES: Toggle[] = [
  { type: "analytics", label: "Analytics", description: "Help us understand how the platform is used (PostHog, Google Analytics)." },
  { type: "marketing", label: "Marketing", description: "Enable personalised ads and conversion tracking (Facebook Pixel)." },
  { type: "third_party", label: "Third Party", description: "Third-party features such as embedded maps and payment fraud tools." },
];

export function CookieConsentBanner() {
  const { consent, updateConsent, openPreferences, isPreferencesOpen, closePreferences } =
    useCookieConsent();

  // Local state for the preferences modal toggles
  const [localPrefs, setLocalPrefs] = useState({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    third_party: consent?.third_party ?? false,
  });

  // Sync local prefs when modal opens
  function handleOpenPreferences() {
    setLocalPrefs({
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
      third_party: consent?.third_party ?? false,
    });
    openPreferences();
  }

  function handleAcceptAll() {
    updateConsent({ analytics: true, marketing: true, third_party: true });
  }

  function handleRejectNonEssential() {
    updateConsent({ analytics: false, marketing: false, third_party: false });
  }

  function handleSavePreferences() {
    updateConsent(localPrefs);
    closePreferences();
  }

  return (
    <>
      {/* Banner — shown only until consent is set */}
      {consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 bg-white shadow-lg"
        >
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-neutral-600 max-w-2xl">
              We use cookies to improve your experience. Essential cookies are always active.
              You can manage preferences or{" "}
              <button
                type="button"
                onClick={handleOpenPreferences}
                className="underline text-primary hover:text-primary/80"
              >
                read our Cookie Policy
              </button>
              .
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleOpenPreferences}
                className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                Manage Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal — always mounted, visibility controlled by context */}
      {isPreferencesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closePreferences}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-heading text-neutral-900">
                Cookie Preferences
              </h2>
              <button
                type="button"
                onClick={closePreferences}
                className="rounded-full p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Close preferences"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Essential — always on, locked */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary opacity-60 cursor-not-allowed">
                    <span className="absolute right-1 size-3 rounded-full bg-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Essential</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Required for authentication and security. Cannot be disabled.
                  </p>
                </div>
              </div>

              {/* Configurable toggles */}
              {TOGGLES.map(({ type, label, description }) => (
                <div key={type} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={localPrefs[type]}
                      onClick={() =>
                        setLocalPrefs((prev) => ({ ...prev, [type]: !prev[type] }))
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        localPrefs[type] ? "bg-primary" : "bg-neutral-200"
                      }`}
                    >
                      <span
                        className={`absolute size-3 rounded-full bg-white shadow transition-transform ${
                          localPrefs[type] ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Step 2: Verify build

```bash
pnpm build
```

### Step 3: Commit

```bash
git add src/components/legal/CookieConsentBanner.tsx
git commit -m "feat(legal): add CookieConsentBanner with preferences modal"
```

---

## Task 10: Integrate Cookie Consent into Layout + Update Footer

**Files:**
- Modify: `src/app/(main)/layout.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/app/(main)/legal/cookies/page.tsx` (wire up the preferences button)

### Step 1: Update `src/app/(main)/layout.tsx`

Add `CookieConsentProvider` and `CookieConsentBanner`. The layout stays a Server Component — it simply renders Client Components:

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import type { ReactNode } from "react";

export default function MainLayout(props: Readonly<{ children: ReactNode }>) {
  return (
    <QueryProvider>
      <CookieConsentProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{props.children}</main>
          <Footer />
          <CookieConsentBanner />
        </div>
      </CookieConsentProvider>
    </QueryProvider>
  );
}
```

**Note:** `CookieConsentProvider` uses `useConsent` internally, which calls `createClient()` from Supabase. `CookieConsentProvider` is a Client Component (has `"use client"`). This is valid in App Router.

### Step 2: Update `src/components/layout/Footer.tsx`

Update `LEGAL_LINKS` to use `/legal/*` routes and add a Cookie Preferences button. Footer is already `"use client"` so no sub-component needed:

Replace `LEGAL_LINKS` and the Legal column section:

```tsx
// Remove the old LEGAL_LINKS const and FooterLinkColumn for Legal.
// Replace with:

import { useCookieConsent } from "@/contexts/CookieConsentContext";

// Inside the Footer function, call the hook:
const { openPreferences } = useCookieConsent();
```

Replace the Legal column markup (currently `<FooterLinkColumn title="Legal" links={LEGAL_LINKS} />`):

```tsx
{/* Col 5: Legal */}
<div>
  <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white">Legal</h4>
  <ul className="flex flex-col gap-3">
    {[
      { href: "/legal", label: "Legal Hub" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/cookies", label: "Cookies" },
      { href: "/legal/accessibility", label: "Accessibility" },
      { href: "/legal/complaints", label: "Complaints" },
    ].map((link) => (
      <li key={link.href}>
        <Link
          href={link.href}
          className="text-sm text-neutral-400 transition-colors hover:text-white"
        >
          {link.label}
        </Link>
      </li>
    ))}
    <li>
      <button
        type="button"
        onClick={openPreferences}
        className="text-sm text-neutral-400 transition-colors hover:text-white"
      >
        Cookie Preferences
      </button>
    </li>
  </ul>
</div>
```

Remove the now-unused `LEGAL_LINKS` const and the `FooterLinkColumn` call for Legal.

### Step 3: Wire up Cookie Preferences button on cookies page

Replace the placeholder button in `src/app/(main)/legal/cookies/page.tsx` Section 5 with a `CookiePreferencesInlineButton` client component:

Create `src/components/legal/CookiePreferencesInlineButton.tsx`:
```tsx
"use client";

import { useCookieConsent } from "@/contexts/CookieConsentContext";

export function CookiePreferencesInlineButton() {
  const { openPreferences } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
    >
      Manage Cookie Preferences
    </button>
  );
}
```

Then in `cookies/page.tsx`, replace the placeholder button with:
```tsx
import { CookiePreferencesInlineButton } from "@/components/legal/CookiePreferencesInlineButton";
// ...
<CookiePreferencesInlineButton />
```

### Step 4: Verify build

```bash
pnpm build
```

If you see a hydration error about `useConsent` being called outside of a provider, check that `CookieConsentProvider` wraps everything correctly in the layout.

### Step 5: Verify lint

```bash
pnpm lint
```

Fix any lint errors before committing.

### Step 6: Commit

```bash
git add src/app/(main)/layout.tsx src/components/layout/Footer.tsx src/components/legal/CookiePreferencesInlineButton.tsx src/app/(main)/legal/cookies/page.tsx
git commit -m "feat(legal): integrate cookie consent banner into main layout and update footer links"
```

---

## Task 11: GdprRequestForm Component

**Files:**
- Create: `src/components/legal/GdprRequestForm.tsx`

### Step 1: Create `src/components/legal/GdprRequestForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const RIGHT_TYPES = [
  "Access",
  "Erasure",
  "Portability",
  "Rectification",
  "Restriction",
  "Objection",
  "Withdraw Consent",
  "Lodge Complaint",
] as const;

type RightType = (typeof RIGHT_TYPES)[number];

type SuccessState = { reference: string };

export function GdprRequestForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [rightType, setRightType] = useState<RightType | "">("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate-limited">("idle");
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const res = await fetch("/api/legal/gdpr-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, accountEmail: accountEmail || undefined, rightType, description }),
    });

    const data = await res.json();

    if (res.status === 429) {
      setStatus("rate-limited");
      return;
    }

    if (!res.ok || !data.success) {
      setStatus("error");
      setErrorMessage(data.error ?? "An unexpected error occurred. Please try again.");
      return;
    }

    setSuccess({ reference: data.reference });
    setStatus("success");
  }

  if (status === "success" && success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h3 className="font-semibold font-heading text-green-900 mb-2">Request Received</h3>
        <p className="text-sm text-green-800 mb-3">
          Your reference number is: <strong>{success.reference}</strong>
        </p>
        <p className="text-sm text-green-800">
          We will respond within 30 days. If your request is complex, we may extend by up to 2 months
          and will notify you. You have the right to{" "}
          <a
            href="https://ico.org.uk/make-a-complaint"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            complain to the ICO
          </a>{" "}
          if you&apos;re unsatisfied.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="gdpr-full-name" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="gdpr-full-name"
          type="text"
          required
          minLength={2}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="gdpr-email" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="gdpr-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="gdpr-account-email" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Account Email (if different)
        </label>
        <input
          id="gdpr-account-email"
          type="email"
          value={accountEmail}
          onChange={(e) => setAccountEmail(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="gdpr-right-type" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Right Type <span className="text-red-500">*</span>
        </label>
        <select
          id="gdpr-right-type"
          required
          value={rightType}
          onChange={(e) => setRightType(e.target.value as RightType)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 bg-white"
        >
          <option value="">Select a right…</option>
          {RIGHT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="gdpr-description" className="block text-sm font-medium text-neutral-900 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="gdpr-description"
          required
          minLength={20}
          maxLength={1000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={status === "submitting"}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none"
          placeholder="Please describe your request in detail (min. 20 characters)…"
        />
        <p className="mt-1 text-xs text-neutral-500 text-right">{description.length}/1000</p>
      </div>

      {status === "rate-limited" && (
        <p className="rounded-lg bg-orange-50 border border-orange-100 text-orange-800 px-4 py-3 text-sm">
          You have already submitted a request recently. Please wait before submitting again.
        </p>
      )}

      {status === "error" && (
        <p className="rounded-lg bg-red-50 border border-red-100 text-red-800 px-4 py-3 text-sm">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
        Submit Request
      </button>
    </form>
  );
}
```

### Step 2: Wire up GdprRequestForm in gdpr-rights page

Replace the placeholder in `src/app/(main)/legal/gdpr-rights/page.tsx` Section 3:

```tsx
import { GdprRequestForm } from "@/components/legal/GdprRequestForm";
// ...
<section id="submit-request">
  <h2 className="text-2xl font-bold font-heading">3. Submit a Request</h2>
  <p className="mb-6 text-neutral-600">
    Complete the form below to exercise any of your data subject rights.
    We will respond within 30 calendar days.
  </p>
  <GdprRequestForm />
</section>
```

### Step 3: Verify build

```bash
pnpm build
```

### Step 4: Commit

```bash
git add src/components/legal/GdprRequestForm.tsx src/app/(main)/legal/gdpr-rights/page.tsx
git commit -m "feat(legal): add GdprRequestForm component and wire into GDPR rights page"
```

---

## Task 12: GDPR Request API Route

**Files:**
- Create: `src/app/api/legal/gdpr-request/route.ts`

### Step 1: Verify required packages

```bash
cat package.json | grep -E '"nanoid|resend|@upstash'
```

If any are missing:
```bash
pnpm add nanoid resend @upstash/redis @upstash/ratelimit
```

### Step 2: Create `src/app/api/legal/gdpr-request/route.ts`

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Zod schema — mirrors GdprRequestForm fields
const GdprRequestSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  accountEmail: z.string().email().optional(),
  rightType: z.enum([
    "Access",
    "Erasure",
    "Portability",
    "Rectification",
    "Restriction",
    "Objection",
    "Withdraw Consent",
    "Lodge Complaint",
  ]),
  description: z.string().min(20).max(1000),
});

const redis = Redis.fromEnv();

// Primary: 3 requests per email per 30 days
const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "30 d"),
  prefix: "rl:gdpr:email",
});

// Secondary: 10 requests per IP per day
const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 d"),
  prefix: "rl:gdpr:ip",
});

const resend = new Resend(process.env.RESEND_API_KEY);

function generateReference(): string {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `SAR-${yyyymmdd}-${nanoid(6)}`;
}

export async function POST(request: Request) {
  // Parse JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate
  const parsed = GdprRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fullName, email, accountEmail, rightType, description } = parsed.data;

  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: ipOk } = await ipRatelimit.limit(ip);
  if (!ipOk) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Rate limit by email
  const { success: emailOk } = await emailRatelimit.limit(email.toLowerCase());
  if (!emailOk) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const reference = generateReference();
  const submittedAt = new Date().toUTCString();

  // Send admin notification
  await resend.emails.send({
    from: "Britestate Privacy <privacy@britestate.co.uk>",
    to: "privacy@britestate.co.uk",
    subject: `[SAR] ${rightType} request — ${reference}`,
    text: [
      `Reference: ${reference}`,
      `Submitted: ${submittedAt}`,
      `Right Type: ${rightType}`,
      `Full Name: ${fullName}`,
      `Contact Email: ${email}`,
      accountEmail ? `Account Email: ${accountEmail}` : "",
      "",
      `Description:`,
      description,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  // Send confirmation to requester
  await resend.emails.send({
    from: "Britestate Privacy <privacy@britestate.co.uk>",
    to: email,
    subject: `Your data subject request — ${reference}`,
    text: [
      `Dear ${fullName},`,
      "",
      `We have received your ${rightType} request.`,
      "",
      `Your reference number is: ${reference}`,
      "",
      "We will respond within 30 calendar days. In complex cases we may extend by up to 2 months and will notify you.",
      "",
      "If you have any questions, reply to this email or contact privacy@britestate.co.uk.",
      "",
      "Britestate Privacy Team",
    ].join("\n"),
  });

  return NextResponse.json({ success: true, reference }, { status: 200 });
}
```

### Step 3: Verify build

```bash
pnpm build
```

### Step 4: Verify lint

```bash
pnpm lint
```

### Step 5: Commit

```bash
git add src/app/api/legal/gdpr-request/route.ts
git commit -m "feat(legal): add GDPR subject access request API route with rate limiting and Resend emails"
```

---

## Task 13: Redirects + Delete Old Pages

**Files:**
- Modify: `next.config.ts`
- Delete: `src/app/(main)/terms/page.tsx`
- Delete: `src/app/(main)/privacy/page.tsx`

### Step 1: Add redirects to `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/terms", destination: "/legal/terms", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/cookies", destination: "/legal/cookies", permanent: true },
      { source: "/accessibility", destination: "/legal/accessibility", permanent: true },
      { source: "/complaints", destination: "/legal/complaints", permanent: true },
    ];
  },
};

export default nextConfig;
```

### Step 2: Verify build with redirects

```bash
pnpm build
```

Expected: Build succeeds. Test that redirect works:
```bash
pnpm dev &
curl -I http://localhost:3000/terms
# Expect: 308 Permanent Redirect -> /legal/terms
kill %1
```

### Step 3: Delete the old pages

```bash
rm src/app/(main)/terms/page.tsx
rm src/app/(main)/privacy/page.tsx
```

### Step 4: Verify build still passes

```bash
pnpm build
```

### Step 5: Commit

```bash
git add next.config.ts
git rm src/app/(main)/terms/page.tsx src/app/(main)/privacy/page.tsx
git commit -m "feat(legal): add 301 redirects for old /terms and /privacy routes and remove old pages"
```

---

## Task 14: Final Verification

### Step 1: Full build

```bash
pnpm build
```

Expected: Zero errors. Zero warnings (or only expected warnings from `// TODO: legal review` comments in content).

### Step 2: Lint

```bash
pnpm lint
```

Expected: No errors.

### Step 3: Manual smoke test checklist

Start dev server:
```bash
pnpm dev
```

Verify each of these in the browser:

- [ ] `/legal` — hub index with four category sections, card grid
- [ ] `/legal/terms` — three-column layout, left nav highlights "Terms of Service", ToC scrolls
- [ ] `/legal/privacy` — legal basis table renders correctly
- [ ] `/legal/cookies` — "Manage Cookie Preferences" button opens modal
- [ ] `/legal/acceptable-use` — renders
- [ ] `/legal/gdpr-rights` — SAR form renders; submit with test data returns reference number format `SAR-YYYYMMDD-XXXXXX`
- [ ] `/legal/data-processing` — sub-processors table renders
- [ ] `/legal/accessibility` — renders
- [ ] `/legal/complaints` — renders
- [ ] `/legal/aml-policy` — renders
- [ ] `/legal/modern-slavery` — renders
- [ ] `/legal/disclaimer` — renders
- [ ] `/terms` → redirects to `/legal/terms` (308)
- [ ] `/privacy` → redirects to `/legal/privacy` (308)
- [ ] Footer "Cookie Preferences" button opens modal (even after banner dismissed)
- [ ] Cookie banner appears on first visit; disappears after "Accept All"; preferences modal still accessible via footer
- [ ] Mobile: left nav shows as pill row below breadcrumb; right ToC hidden

### Step 4: Final commit if any small fixes were needed

```bash
git add -p  # stage individual changes
git commit -m "fix(legal): address smoke test findings"
```

---

## Summary Checklist

- [ ] Task 1: LegalLeftNav + LegalRightToc
- [ ] Task 2: LegalPageShell
- [ ] Task 3: legal/layout.tsx + hub index page
- [ ] Task 4: Terms + Privacy pages
- [ ] Task 5: Cookies + Acceptable Use + GDPR Rights pages
- [ ] Task 6: Data Processing + Accessibility + Complaints pages
- [ ] Task 7: AML + Modern Slavery + Disclaimer pages
- [ ] Task 8: CookieConsentContext
- [ ] Task 9: CookieConsentBanner + modal
- [ ] Task 10: Layout integration + Footer update
- [ ] Task 11: GdprRequestForm + wire into GDPR Rights page
- [ ] Task 12: POST /api/legal/gdpr-request
- [ ] Task 13: Redirects + delete old pages
- [ ] Task 14: Final verification
