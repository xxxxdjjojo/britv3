// src/app/(main)/fee-transparency/page.tsx — Memo Pivot v2: full commission table.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fee Transparency | TrueDeed",
  description:
    "Every commission rate, every segment, every tier — Hemnet-style transparency on what TrueDeed earns and when.",
};

interface Row {
  readonly tier: string;
  readonly base: string;
  readonly commission: string;
}

interface SegmentBlock {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly rows: readonly Row[];
}

const SEGMENTS: readonly SegmentBlock[] = [
  {
    id: "sellers",
    name: "Sellers",
    summary:
      "One-off listing fees replace the 1.4% high-street agent commission. Pay less to complete the further you invest upfront.",
    rows: [
      { tier: "Basic — £99 upfront", base: "£99", commission: "0.50% on completion" },
      { tier: "Plus — £249 upfront", base: "£249", commission: "0.35% on completion" },
      { tier: "Premium — £449 upfront", base: "£449", commission: "0.25% on completion" },
      { tier: "No-Sale-No-Fee", base: "£0", commission: "1.00% on completion only" },
    ],
  },
  {
    id: "agents",
    name: "Estate Agents",
    summary:
      "Free to list. TrueDeed only earns on the leads we originate — never on the rest of your pipeline.",
    rows: [
      { tier: "Listed — Free", base: "£0", commission: "Revenue-share, opt-in" },
      { tier: "Pro — £99/mo", base: "£99/mo", commission: "70/30 split on TrueDeed leads" },
      { tier: "Elite — £349/mo", base: "£349/mo", commission: "85/15 split on TrueDeed leads" },
    ],
  },
  {
    id: "landlords",
    name: "Landlords",
    summary:
      "From single-property hobbyists to portfolio operators. Small letting fees only when a tenancy completes.",
    rows: [
      { tier: "Free — 1 property", base: "£0", commission: "10% of first month rent" },
      { tier: "Essential — £15/mo", base: "£15/mo", commission: "9% of first month rent" },
      { tier: "Pro — £39/mo", base: "£39/mo", commission: "8% of first month rent" },
      { tier: "Portfolio — £99/mo", base: "£99/mo", commission: "8% of first month rent" },
    ],
  },
  {
    id: "providers",
    name: "Providers (Tradespeople)",
    summary:
      "Tier-banded marketplace commission: pay less per job the higher your tier. Listed 12%, Pro 10%, Elite 6%.",
    rows: [
      { tier: "Listed — Free", base: "£0", commission: "12% per job" },
      { tier: "Pro — £39/mo", base: "£39/mo", commission: "10% per job" },
      { tier: "Elite — £149/mo", base: "£149/mo", commission: "6% per job" },
    ],
  },
  {
    id: "providers-niche",
    name: "Professionals (Conveyancer / Surveyor / Mortgage Broker)",
    summary:
      "Niche professional tiers with workflow-tuned tooling. Conveyancers and surveyors pay 6% per transaction; mortgage brokers pay £35 per qualified lead.",
    rows: [
      { tier: "Conveyancer — £79/mo", base: "£79/mo", commission: "6% per transaction" },
      { tier: "Surveyor — £79/mo", base: "£79/mo", commission: "6% per transaction" },
      { tier: "Mortgage broker — £49/mo", base: "£49/mo", commission: "£35 per qualified lead" },
    ],
  },
  {
    id: "developers",
    name: "Developers",
    summary:
      "Tiered completion fees for new-build developers. From 0.25% down to 0.15% as you scale.",
    rows: [
      { tier: "Single — £299/mo", base: "£299/mo", commission: "0.25% on completion" },
      { tier: "Multi — £799/mo", base: "£799/mo", commission: "0.20% on completion" },
      { tier: "Enterprise — £1,999/mo", base: "£1,999/mo", commission: "0.15% on completion" },
    ],
  },
  {
    id: "traders",
    name: "Traders",
    summary:
      "Property traders pay a flat 0.50% on resale through TrueDeed, regardless of tier.",
    rows: [
      { tier: "Pro — £99/mo", base: "£99/mo", commission: "0.50% on resale" },
      { tier: "Elite — £299/mo", base: "£299/mo", commission: "0.50% on resale" },
    ],
  },
];

export default function FeeTransparencyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Fee Transparency
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
          The full commission map. No fine print, no fee-discovery game,
          no rate that depends on the call you didn&apos;t pick up.
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-neutral-500">
          Replaces the previous flat 2.5% marketplace fee with tier-banded
          rates following the May 2026 strategy review.
        </p>
      </header>

      <section className="mt-12 space-y-12">
        {SEGMENTS.map((segment) => (
          <article
            key={segment.id}
            id={segment.id}
            data-segment={segment.id}
            className="rounded-2xl border border-neutral-200 p-6 sm:p-8"
          >
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              {segment.name}
            </h2>
            <p className="mt-2 text-neutral-700">{segment.summary}</p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-sm font-semibold text-neutral-700">
                    <th className="py-3 pr-4">Tier</th>
                    <th className="py-3 pr-4">Base</th>
                    <th className="py-3">Commission / completion fee</th>
                  </tr>
                </thead>
                <tbody>
                  {segment.rows.map((row) => (
                    <tr
                      key={row.tier}
                      className="border-b border-neutral-100 text-sm text-neutral-900"
                    >
                      <td className="py-3 pr-4 font-medium">{row.tier}</td>
                      <td className="py-3 pr-4 text-neutral-700">{row.base}</td>
                      <td className="py-3">{row.commission}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-2xl bg-muted p-6 sm:p-8">
        <h2 className="font-heading text-xl font-bold text-neutral-900">
          How these rates compare
        </h2>
        <ul className="mt-4 space-y-2 text-neutral-700">
          <li>
            <strong>vs. Rightmove enhanced:</strong> TrueDeed Elite agent
            (£349/mo) undercuts Rightmove&apos;s enhanced tier by ~76%.
          </li>
          <li>
            <strong>vs. Checkatrade:</strong> Provider Pro (£39/mo + 10%) saves
            tradespeople £30–£70/mo before any lead spend.
          </li>
          <li>
            <strong>vs. Hemnet:</strong> TrueDeed Seller Plus matches
            Hemnet&apos;s upfront price while offering No-Sale-No-Fee for
            sellers who prefer to pay only on completion.
          </li>
        </ul>
        <p className="mt-6 text-sm text-neutral-500">
          Got a tier the market doesn&apos;t serve well? Tell us — pricing
          should evolve with the market it supports.{" "}
          <Link
            href="/contact"
            className="text-brand-primary underline underline-offset-4"
          >
            Get in touch
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
