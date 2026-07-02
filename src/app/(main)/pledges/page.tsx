import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PLEDGES } from "@/config/pledges";
import { brandConfig, appBaseUrl } from "@/config/brand";

const BASE_URL = appBaseUrl();

export const metadata: Metadata = {
  title: `Our Pledges — The portal that binds its own hands | ${brandConfig.displayName}`,
  description: `The public pledges ${brandConfig.displayName} makes to buyers, renters and agents — each with what it binds us to, how to verify we keep it, and a dated changelog.`,
  alternates: { canonical: `${BASE_URL}/pledges` },
  openGraph: {
    title: `Our Pledges | ${brandConfig.displayName}`,
    description:
      "Public, verifiable pledges with dated changelogs — so they cannot be quietly weakened.",
  },
};

export default function PledgesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <header className="mb-14 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          Our pledges
        </p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          The portal that binds its own hands
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          Promises are cheap. Each pledge below states exactly what it binds us
          to, how you can verify we keep it, and carries a dated changelog — so
          none of them can be quietly weakened later.
        </p>
      </header>

      {/* One card per pledge */}
      <ul className="grid gap-6 md:grid-cols-2">
        {PLEDGES.map((pledge) => (
          <li key={pledge.slug} className="h-full">
            {pledge.status === "live" ? (
              <Link
                href={`/pledges/${pledge.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-brand-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-primary-lighter px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                  Live
                </span>
                <h2 className="font-heading text-xl font-bold text-neutral-900">
                  {pledge.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                  {pledge.oneSentence}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
                  Read the pledge
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ) : (
              <div className="flex h-full flex-col rounded-2xl border border-dashed border-neutral-300 bg-muted p-6">
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-neutral-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                  In preparation
                </span>
                <h2 className="font-heading text-xl font-bold text-neutral-900">
                  {pledge.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                  {pledge.oneSentence}
                </p>
                <p className="mt-4 text-sm font-medium text-neutral-500">
                  In preparation — publishing with our first annual figures.
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Why pledges */}
      <p className="mt-14 max-w-3xl text-sm leading-relaxed text-neutral-500">
        Why publish these at all? Because the incentives of a property portal
        usually run the other way, and the only pledge worth making is one you
        can be caught breaking. Each pledge names its own verification path —
        including the parts that live in our codebase.
      </p>
    </div>
  );
}
