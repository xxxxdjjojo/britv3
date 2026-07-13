// src/app/(main)/services/[service]/[postcode]/page.tsx
//
// Memo Pivot v2 — programmatic SEO. Dynamic route renders a landing page
// for every (service, postcode) pair. The top-N pairs are prebuilt via
// generateStaticParams; the rest fall through to on-demand SSR.

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  TOP_SERVICES,
  buildDefaultMatrix,
} from "@/lib/seo/postcode-service-matrix";

export const dynamicParams = true;

type RouteParams = { service: string; postcode: string };
type Props = { params: Promise<RouteParams> };

const SERVICE_LABEL: Record<string, string> = {
  plumber: "Plumber",
  electrician: "Electrician",
  roofer: "Roofer",
  builder: "Builder",
  decorator: "Decorator",
  "gas-engineer": "Gas engineer",
  surveyor: "Surveyor",
  conveyancer: "Conveyancer",
  "mortgage-broker": "Mortgage broker",
  architect: "Architect",
  gardener: "Gardener",
  cleaner: "Cleaner",
};

function titleCaseService(slug: string): string {
  return SERVICE_LABEL[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function uppercasePostcode(slug: string): string {
  return slug.toUpperCase();
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  return buildDefaultMatrix().map((p) => ({
    service: p.service,
    postcode: p.postcode.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, postcode } = await params;
  const label = titleCaseService(service);
  const area = uppercasePostcode(postcode);
  return {
    title: `${label}s in ${area} — Verified, TrueDeed-rated`,
    description: `Find a verified ${label.toLowerCase()} in ${area} on TrueDeed. Compare ratings, quotes and availability.`,
  };
}

export default async function ServiceAreaPage({ params }: Props) {
  const { service, postcode } = await params;
  const label = titleCaseService(service);
  const area = uppercasePostcode(postcode);
  const isValidService = TOP_SERVICES.includes(service);

  if (!isValidService) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-primary-dark">
          Service not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The service <strong>{service}</strong> isn&apos;t on TrueDeed yet.{" "}
          <Link href="/marketplace" className="text-brand-primary underline underline-offset-4">
            Browse all services
          </Link>
          .
        </p>
      </div>
    );
  }

  const relatedServices = TOP_SERVICES.filter((s) => s !== service).slice(0, 6);
  const postQuery = `?service=${encodeURIComponent(service)}&postcode=${encodeURIComponent(area)}`;

  return (
    <div className="bg-surface">
      {/* Hero */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500"
          >
            <Link href="/" className="hover:text-brand-primary">
              TrueDeed
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/marketplace" className="hover:text-brand-primary">
              Find a pro
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-brand-primary">
              {label}s in {area}
            </span>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-secondary">
                Verified local pros · {area}
              </p>
              <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-brand-primary-dark sm:text-5xl">
                {label}s in{" "}
                <span className="text-brand-primary underline decoration-brand-primary/25 decoration-4 underline-offset-8">
                  {area}
                </span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Verified, TrueDeed-rated {label.toLowerCase()}s serving {area}.
                Compare quotes, ratings, and availability in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/post-a-job${postQuery}`}
                  className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-primary-light"
                >
                  Post a job
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-lg border border-brand-primary px-6 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary-lighter"
                >
                  Browse all pros
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main column */}
          <div className="space-y-12 lg:col-span-8">
            {/* Why verified */}
            <section>
              <h2 className="font-heading text-2xl font-bold text-brand-primary-dark">
                Why book a TrueDeed {label.toLowerCase()}?
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Companies House checked",
                    body: "We verify the legal entity behind every listing before it goes live.",
                  },
                  {
                    title: "TrueDeed Trust badge",
                    body: "Reviewed providers earn a Trust badge backed by real customer ratings.",
                  },
                  {
                    title: "Transparent quotes",
                    body: "Compare clear, itemised quotes — no surprise fees on the day.",
                  },
                  {
                    title: "Insurance on file",
                    body: "Public liability and trade insurance documents are held on record.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
                  >
                    <h3 className="font-heading text-base font-bold text-brand-primary-dark">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Common jobs */}
            <section className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="font-heading text-2xl font-bold text-brand-primary-dark">
                Common {label.toLowerCase()} jobs in {area}
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Typical requests for a local {label.toLowerCase()} include
                emergency callouts, scheduled maintenance, and
                property-transaction checks. Post the details once and verified{" "}
                {label.toLowerCase()}s covering {area} can quote you back.
              </p>
              <Link
                href={`/post-a-job${postQuery}`}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary-light"
              >
                Describe your job
              </Link>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:col-span-4">
            {/* Quote CTA */}
            <div className="rounded-2xl bg-brand-primary p-8 text-white shadow-lg lg:sticky lg:top-24">
              <h2 className="font-heading text-2xl font-bold">
                Get quotes from {area} {label.toLowerCase()}s
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Tell us the job. We&apos;ll route it to verified{" "}
                {label.toLowerCase()}s covering {area}.
              </p>
              <Link
                href={`/post-a-job${postQuery}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-brand-primary shadow-sm transition-transform hover:scale-[1.02]"
              >
                Post a job
              </Link>
            </div>

            {/* Related services in same area */}
            {relatedServices.length > 0 && (
              <nav
                aria-label={`Other services in ${area}`}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h2 className="font-heading text-lg font-bold text-brand-primary-dark">
                  Other trades in {area}
                </h2>
                <ul className="mt-4 space-y-1">
                  {relatedServices.map((s) => (
                    <li key={s}>
                      <Link
                        href={`/services-near/${s}/${postcode.toLowerCase()}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-primary-lighter hover:text-brand-primary"
                      >
                        {titleCaseService(s)}s in {area}
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
