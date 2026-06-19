// src/app/(main)/developers/page.tsx — Memo Pivot v2: developers landing page.

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "TrueDeed for Developers — Showcase Entire Schemes",
  description:
    "From single-site to enterprise portfolios. Investor exposure, AI renders, integrated leads — at 0.15–0.25% on completion.",
};

export default function DevelopersLanding() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-primary">
          For developers
        </p>
        <h1 className="font-heading text-4xl font-bold text-brand-primary-dark sm:text-5xl">
          Showcase entire developments. Pay a fraction of the commission.
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
          Single-site to enterprise portfolios: an investor-grade storefront,
          AI render upgrades, and a completion fee from 0.15% to 0.25%.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="bg-brand-primary hover:bg-brand-primary-light">
            <Link href="/pricing?tab=developers">View developer plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Talk to sales</Link>
          </Button>
        </div>
      </div>

      <section className="mt-20 grid gap-8 sm:grid-cols-3">
        <Card title="Single — £299/mo">
          One development, storefront + lead capture, 0.25% on completion.
        </Card>
        <Card title="Multi — £799/mo" highlighted>
          Up to 5 developments, AI renders, investor feed, 0.20% on completion.
        </Card>
        <Card title="Enterprise — £1,999/mo">
          Unlimited developments, custom storefront, AI Digest placement,
          0.15% on completion.
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
      className={`rounded-xl border p-6 ${highlighted ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-border"}`}
    >
      <h3 className="font-heading text-xl font-bold text-neutral-900">{title}</h3>
      <p className="mt-3 text-sm text-neutral-700">{children}</p>
    </div>
  );
}
