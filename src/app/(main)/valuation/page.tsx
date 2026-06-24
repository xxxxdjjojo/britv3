import type { Metadata } from "next";
import Link from "next/link";
import { Home, TrendingUp, ShieldCheck, Clock } from "lucide-react";
import { TrackedLink } from "@/components/valuation/TrackedLink";

export const metadata: Metadata = {
  title: "Free Property Valuation | TrueDeed",
  description:
    "Get an instant property valuation for any UK address, based on recent Land Registry sold prices and local market data.",
};

const VALUATION_FEATURES = [
  {
    icon: TrendingUp,
    title: "Market-Data Driven",
    description:
      "Our valuations draw on Land Registry sold prices, local market trends, and comparable property data to give you an accurate estimate.",
  },
  {
    icon: Clock,
    title: "Instant Results",
    description:
      "Enter your postcode and get an estimated valuation in seconds — no waiting for an agent to call back.",
  },
  {
    icon: ShieldCheck,
    title: "No Obligation",
    description:
      "Your valuation is completely free with no strings attached. Use it to plan your next move on your own terms.",
  },
] as const;

export default function ValuationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page Header */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <Home className="size-8" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Get a Free Property Valuation
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Get an indicative estimate from our comparable-sales valuation tool,
          based on recent Land Registry sold prices. Instant and completely free.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <TrackedLink
          href="/value-my-property"
          event="valuation_cta_clicked"
          properties={{ source: "valuation_landing" }}
          className="inline-flex h-14 items-center justify-center rounded-xl bg-brand-primary px-8 text-base font-semibold text-white shadow-lg transition-colors hover:bg-brand-primary-light"
        >
          Value My Property
        </TrackedLink>
        <Link
          href="/sold-prices"
          className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-brand-primary px-8 text-base font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
        >
          Browse Sold Prices
        </Link>
      </div>

      {/* Features */}
      <section className="mt-20">
        <h2 className="text-center font-heading text-2xl font-bold text-neutral-900">
          How It Works
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {VALUATION_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-neutral-200 p-6 text-center"
            >
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <feature.icon className="size-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-neutral-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Landlord CTA */}
      <section className="mt-20 rounded-2xl bg-brand-primary-lighter p-8 text-center sm:p-12">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Are you a landlord?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">
          Access detailed rental yield calculations and portfolio valuations
          from your landlord dashboard.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light"
        >
          Sign In to Dashboard
        </Link>
      </section>
    </div>
  );
}
