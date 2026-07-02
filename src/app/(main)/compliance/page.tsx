import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { brandConfig, appBaseUrl } from "@/config/brand";

const BASE_URL = appBaseUrl();

/**
 * Compliance Library index (Campaign 42). Future documents (DPIA-style
 * analyses, follow-up audits) are one array entry away.
 */
const COMPLIANCE_DOCUMENTS: ReadonlyArray<{
  slug: string;
  title: string;
  date: string;
  dateLabel: string;
  summary: string;
}> = [
  {
    slug: "pre-launch-audit-2026",
    title: "Pre-Launch Compliance & Legal Due-Diligence Audit",
    date: "2026-06-07",
    dateLabel: "7 June 2026",
    summary:
      "The full pre-launch audit of our own platform — fifty regulatory instruments mapped, every launch blocker named, and the scorecard we did not get to choose. Published gaps and all.",
  },
];

export const metadata: Metadata = {
  title: `Compliance Library — What we publish and why | ${brandConfig.displayName}`,
  description: `${brandConfig.displayName} publishes its own compliance homework — audits, risk assessments and analyses — in full, including the findings against us.`,
  alternates: { canonical: `${BASE_URL}/compliance` },
  openGraph: {
    title: `Compliance Library | ${brandConfig.displayName}`,
    description:
      "We publish our own compliance homework — including the findings against us.",
  },
};

export default function ComplianceLibraryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          Compliance library
        </p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          What we publish and why
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          Most companies keep their compliance homework in a drawer. We publish
          ours — audits, risk assessments and data-protection analyses — in
          full, including the findings against us. If we claim to hold
          ourselves to a standard, this is where you check.
        </p>
      </header>

      <ul className="space-y-6">
        {COMPLIANCE_DOCUMENTS.map((doc) => (
          <li key={doc.slug}>
            <Link
              href={`/compliance/${doc.slug}`}
              className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-brand-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:flex-row sm:items-start"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary-lighter text-brand-primary">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <time
                  dateTime={doc.date}
                  className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                >
                  {doc.dateLabel}
                </time>
                <span className="mt-1 block font-heading text-xl font-bold text-neutral-900">
                  {doc.title}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-neutral-600">
                  {doc.summary}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
                  Read the document
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 max-w-3xl text-sm leading-relaxed text-neutral-500">
        More documents — DPIA-style analyses and follow-up audits — will be
        added here as they are completed. See also{" "}
        <Link
          href="/pledges"
          className="underline decoration-neutral-300 underline-offset-2 hover:text-brand-primary"
        >
          our pledges
        </Link>
        , each of which names its own verification path.
      </p>
    </div>
  );
}
