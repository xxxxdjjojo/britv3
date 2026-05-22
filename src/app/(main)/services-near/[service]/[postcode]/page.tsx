// src/app/(main)/services/[service]/[postcode]/page.tsx
//
// Memo Pivot v2 — programmatic SEO. Dynamic route renders a landing page
// for every (service, postcode) pair. The top-N pairs are prebuilt via
// generateStaticParams; the rest fall through to on-demand SSR.

import type { Metadata } from "next";
import Link from "next/link";

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
    title: `${label}s in ${area} — Verified, Britestate-rated`,
    description: `Find a verified ${label.toLowerCase()} in ${area} on Britestate. Compare ratings, quotes and availability.`,
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
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Service not found
        </h1>
        <p className="mt-4 text-neutral-700">
          The service <strong>{service}</strong> isn&apos;t on Britestate yet.{" "}
          <Link href="/marketplace" className="text-[#1B4D3E] underline-offset-4 hover:underline">
            Browse all services
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1B4D3E]">
          Britestate · {area}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          {label}s in {area}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-neutral-700">
          Verified, Britestate-rated {label.toLowerCase()}s serving {area}. Compare
          quotes, ratings, and availability in minutes.
        </p>
      </header>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-heading text-xl font-bold text-neutral-900">
            Why Britestate {label.toLowerCase()}s?
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-neutral-700">
            <li>Verified Companies House checks on every listing</li>
            <li>Britestate Trust badge for reviewed providers</li>
            <li>Transparent quotes — no surprise fees</li>
            <li>Insurance documents on file</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-200 p-6">
          <h2 className="font-heading text-xl font-bold text-neutral-900">
            Get quotes from {area} {label.toLowerCase()}s
          </h2>
          <p className="mt-3 text-neutral-700">
            Tell us the job. We&apos;ll route it to verified {label.toLowerCase()}s
            covering {area}.
          </p>
          <Link
            href={`/post-a-job?service=${encodeURIComponent(service)}&postcode=${encodeURIComponent(area)}`}
            className="mt-5 inline-block rounded-md bg-[#1B4D3E] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D7A5F]"
          >
            Post a job
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-xl bg-neutral-50 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-bold text-neutral-900">
          Common {label.toLowerCase()} jobs in {area}
        </h2>
        <p className="mt-3 text-neutral-700">
          Britestate gathers thousands of jobs across {area}. Typical
          requests for a local {label.toLowerCase()} include emergency
          callouts, scheduled maintenance, and property-transaction
          checks.
        </p>
      </section>
    </div>
  );
}
