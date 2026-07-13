// src/app/(main)/sellers/page.tsx — Memo Pivot v2: sellers landing page.

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sell with TrueDeed — One-Off Pricing, Lower Commission",
  description:
    "List your home for a one-off £99 / £249 / £449, with completion fees as low as 0.25%. No 1.4% high-street estate-agent cuts.",
};

export default function SellersLanding() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-primary">
          For sellers
        </p>
        <h1 className="font-heading text-4xl font-bold text-brand-primary-dark sm:text-5xl">
          List your home for less. Sell it for more.
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
          A one-off listing fee replaces the 1.4% high-street estate-agent
          commission. Pay only when the sale completes — and pay less every
          tier you climb.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            asChild
            className="bg-brand-primary hover:bg-brand-primary-light"
          >
            <Link href="/pricing?tab=sellers">View seller plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/valuation">Get a free valuation</Link>
          </Button>
        </div>
      </div>

      <section className="mt-20 grid gap-8 sm:grid-cols-3">
        <Card title="Basic — £99">
          15-photo listing, standard hero, tour-booking inbox, 0.50% on completion.
        </Card>
        <Card title="Plus — £249" highlighted>
          Drone tour + floorplan, premium hero, AI story, 0.35% on completion.
        </Card>
        <Card title="Premium — £449">
          Concierge service, comparable-sales valuation, photo/video shoot, 0.25%
          on completion.
        </Card>
      </section>

      <p className="mt-16 text-center text-sm text-neutral-500">
        Don&apos;t want any upfront cost?{" "}
        <Link
          href="/pricing?tab=sellers"
          className="text-brand-primary underline underline-offset-4"
        >
          Try No-Sale-No-Fee
        </Link>{" "}
        — list free, pay 1% only when the sale completes.
      </p>
    </div>
  );
}

function Card({
  title,
  highlighted,
  children,
}: Readonly<{ title: string; highlighted?: boolean; children: React.ReactNode }>) {
  return (
    <div
      className={`rounded-xl border p-6 ${highlighted ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-border"}`}
    >
      <h3 className="font-heading text-xl font-bold text-neutral-900">{title}</h3>
      <p className="mt-3 text-sm text-neutral-700">{children}</p>
    </div>
  );
}
