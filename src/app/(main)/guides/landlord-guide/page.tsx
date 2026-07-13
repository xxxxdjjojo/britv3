/**
 * Free Landlord Guide — gated lead magnet landing page.
 * Route: /guides/landlord-guide
 *
 * Server Component: SEO metadata + JSON-LD + editorial layout. The email
 * capture + PDF reveal lives in the LandlordGuideDownloadForm client component,
 * which posts to /api/newsletter with source "landlord_guide".
 */

import type { Metadata } from "next";
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  Scale,
  Zap,
  Receipt,
  Home as HomeIcon,
} from "lucide-react";

import { LandlordGuideDownloadForm } from "@/components/guides/LandlordGuideDownloadForm";
import { brandConfig, appUrl } from "@/config/brand";

const GUIDE_TITLE = "The UK Landlord's Essential Guide (2026)";
const GUIDE_PATH = "/guides/landlord-guide";
const PDF_PATH = "/guides/landlord-guide.pdf";

export const metadata: Metadata = {
  title: `Free Landlord Guide — The UK Landlord's Essential Guide (2026) | ${brandConfig.displayName}`,
  description:
    "Download our free 2026 guide for UK landlords: responsibilities & compliance, HMO licensing, the Renters' Rights reforms, deposit protection, EPC rules and Section 24 tax — in plain English.",
  alternates: { canonical: GUIDE_PATH },
  openGraph: {
    type: "article",
    title: GUIDE_TITLE,
    description:
      "A free, plain-English guide to landlord responsibilities, compliance, HMO licensing, the Renters' Rights reforms, deposits, EPC rules and Section 24 tax.",
    url: GUIDE_PATH,
  },
  twitter: {
    card: "summary_large_image",
    title: GUIDE_TITLE,
    description:
      "Free 2026 guide for UK landlords — compliance, HMO licensing, Renters' Rights, deposits, EPC and Section 24 tax.",
  },
};

const WHATS_INSIDE = [
  {
    icon: ShieldCheck,
    title: "Responsibilities & compliance checklist",
    body: "Gas, electrical, alarms, Right to Rent and the pre-tenancy paperwork that protects your possession rights.",
  },
  {
    icon: HomeIcon,
    title: "HMO licensing basics",
    body: "When a mandatory licence applies, plus additional and selective licensing your council may run locally.",
  },
  {
    icon: Scale,
    title: "Renters' Rights reforms at a glance",
    body: "The end of Section 21, periodic tenancies, the new database and Ombudsman, and what to do now.",
  },
  {
    icon: FileText,
    title: "Deposit protection done right",
    body: "Approved schemes, the 30-day rule, prescribed information, deposit caps and end-of-tenancy deductions.",
  },
  {
    icon: Zap,
    title: "EPC & energy efficiency rules",
    body: "Today's minimum rating, the direction of travel toward band C, and the exemptions register.",
  },
  {
    icon: Receipt,
    title: "Landlord tax & Section 24 essentials",
    body: "How rental profit is taxed and how the mortgage-interest restriction really affects your returns.",
  },
] as const;

const WHO_ITS_FOR = [
  "First-time landlords letting their first property",
  "Accidental landlords renting out a former home",
  "Portfolio landlords keeping compliance tidy across multiple units",
  "Anyone weighing up buy-to-let before taking the plunge",
] as const;

export default function LandlordGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: GUIDE_TITLE,
    description:
      "A free, plain-English guide to UK landlord responsibilities, compliance, HMO licensing, the Renters' Rights reforms, deposit protection, EPC rules and Section 24 tax.",
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    url: appUrl(GUIDE_PATH),
    mainEntityOfPage: appUrl(GUIDE_PATH),
    publisher: {
      "@type": "Organization",
      name: brandConfig.displayName,
      url: brandConfig.canonicalUrl,
    },
    about: [
      "Landlord compliance",
      "HMO licensing",
      "Renters' Rights",
      "Tenancy deposit protection",
      "EPC and MEES",
      "Section 24 landlord tax",
    ],
  };

  return (
    <main className="bg-gradient-to-b from-brand-primary-lighter/50 via-brand-primary-lighter/10 to-transparent">
      {/* Static, non-user-derived JSON-LD — no XSS surface. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---- Hero ---- */}
      <section
        aria-labelledby="guide-heading"
        className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8"
      >
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-primary">
            Free guide for UK landlords
          </p>
          <h1
            id="guide-heading"
            className="font-heading text-4xl font-bold text-brand-primary-dark sm:text-5xl"
          >
            The UK Landlord&apos;s Essential Guide
          </h1>
          <p className="mt-5 max-w-xl text-lg text-neutral-600">
            Eight pages of plain-English guidance on the responsibilities,
            compliance, licensing, reform and tax that every UK landlord needs
            to get right in 2026. No jargon, no fluff — just the essentials.
          </p>

          <ul className="mt-8 space-y-2.5">
            {[
              "Updated for the 2026 Renters' Rights reforms",
              "Accurate UK general guidance — no invented statistics",
              "Compliance checklists you can actually use",
            ].map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm text-neutral-700"
              >
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-brand-primary-light"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-xl">
            <LandlordGuideDownloadForm />
          </div>
        </div>

        {/* ---- Cover mock ---- */}
        <div className="relative mx-auto w-full max-w-sm">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2rem] bg-brand-primary/10 blur-2xl"
          />
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-brand-primary/15 bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-primary-light p-8 text-white shadow-xl">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="inline-flex size-8 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-sm">
                T
              </span>
              {brandConfig.displayName}
            </div>
            <p className="mt-12 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/70">
              Free guide for UK landlords
            </p>
            <p className="mt-4 font-heading text-3xl font-bold leading-tight">
              The UK Landlord&apos;s Essential Guide
            </p>
            <p className="mt-4 text-sm text-white/80">
              Responsibilities, compliance, licensing, reform &amp; tax.
            </p>
            <div className="absolute bottom-8 left-8 font-heading text-6xl font-bold text-white/10">
              2026
            </div>
          </div>
        </div>
      </section>

      {/* ---- What's inside ---- */}
      <section
        aria-labelledby="inside-heading"
        className="border-t border-brand-primary/10 bg-white/60"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
              What&apos;s inside
            </p>
            <h2
              id="inside-heading"
              className="mt-2 font-heading text-3xl font-bold text-brand-primary-dark"
            >
              Six chapters, every landlord essential
            </h2>
            <p className="mt-3 text-neutral-600">
              Each chapter cuts a complex topic down to what matters — and gives
              you a checklist or quick-reference table to act on.
            </p>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHATS_INSIDE.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-xl border border-brand-primary/15 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
                  <Icon className="size-5.5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-neutral-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Who it's for + trust ---- */}
      <section
        aria-labelledby="who-heading"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:grid lg:grid-cols-2 lg:gap-16 lg:px-8"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
            Who it&apos;s for
          </p>
          <h2
            id="who-heading"
            className="mt-2 font-heading text-3xl font-bold text-brand-primary-dark"
          >
            Written for landlords at every stage
          </h2>
          <ul className="mt-6 space-y-3">
            {WHO_ITS_FOR.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-neutral-700"
              >
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-brand-primary-light"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-brand-primary/15 bg-brand-primary-lighter/40 p-8 lg:mt-0">
          <p className="font-heading text-xl font-bold text-brand-primary-dark">
            Guidance you can trust
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            This guide gives accurate UK general guidance with no fabricated
            statistics. Letting law is devolved and changes over time, so every
            chapter points you to confirm the current rules with the relevant
            authority. It&apos;s general information, not legal, tax or financial
            advice.
          </p>
          <p className="mt-4 text-sm text-neutral-700">
            Prefer to keep compliance organised year-round?{" "}
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline underline-offset-4"
            >
              The guide
            </a>{" "}
            pairs with the TrueDeed landlord dashboard to track certificates,
            tenancies, rent and maintenance in one place.
          </p>
        </div>
      </section>
    </main>
  );
}
