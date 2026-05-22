// src/app/(main)/traders/page.tsx — Memo Pivot v2: traders landing page.

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Britestate for Property Traders — Off-Market Deal Feed",
  description:
    "Flippers and traders: off-market alerts, comp tools, and 0.50% on resale. From £99/mo (Pro) to £299/mo (Elite).",
};

export default function TradersLanding() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1B4D3E]">
          For property traders
        </p>
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Off-market deals, AI comps, dedicated deal scout.
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
          Built for flippers and property traders. Subscription unlocks the
          off-market feed; you pay 0.50% on resale through Britestate.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="bg-[#1B4D3E] hover:bg-[#2D7A5F]">
            <Link href="/pricing?tab=traders">View trader plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Talk to deals team</Link>
          </Button>
        </div>
      </div>

      <section className="mt-20 grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
        <Card title="Pro — £99/mo">
          Up to 5 active flips, off-market alerts, comp tools.
        </Card>
        <Card title="Elite — £299/mo" highlighted>
          Unlimited active flips, first-access deal feed, dedicated deal scout,
          API access.
        </Card>
      </section>
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
      className={`rounded-xl border p-6 ${highlighted ? "border-[#1B4D3E] ring-2 ring-[#1B4D3E]/20" : "border-neutral-200"}`}
    >
      <h3 className="font-heading text-xl font-bold text-neutral-900">{title}</h3>
      <p className="mt-3 text-sm text-neutral-700">{children}</p>
    </div>
  );
}
