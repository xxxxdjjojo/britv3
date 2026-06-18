import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Home, ClipboardList, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { TrackedLink } from "@/components/valuation/TrackedLink";

export const metadata: Metadata = {
  title: "Value my property | Britestate",
  description:
    "Get a free indicative automated estimate of your home's current market value, based on HM Land Registry sold prices. Not a survey or formal valuation.",
  alternates: { canonical: "/value-my-property" },
};

const STEPS = [
  {
    icon: MapPin,
    title: "Find your address",
    description: "Enter your postcode and choose your exact property.",
  },
  {
    icon: Home,
    title: "Confirm the details",
    description: "Check what we know and add anything missing.",
  },
  {
    icon: ClipboardList,
    title: "Get your estimate",
    description: "We calculate an indicative estimate from nearby sold prices.",
  },
  {
    icon: Mail,
    title: "Verify your email",
    description: "Confirm a one-time code to view and save your result.",
  },
] as const;

export default function ValueMyPropertyIntroPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <section aria-labelledby="vmp-heading" className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <Home className="size-8" />
        </div>
        <p className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-primary">
          Indicative automated estimate
        </p>
        <h1
          id="vmp-heading"
          className="mt-2 font-heading text-4xl font-bold text-neutral-900 sm:text-5xl"
        >
          Value my property
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Get a free estimate of your home&apos;s current market value, based on
          recent HM Land Registry sold prices near you. It&apos;s an indicative
          guide — not a survey, mortgage valuation, or guaranteed sale price.
        </p>

        {/* Email-verification notice — stated up front, not as a final surprise */}
        <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary-lighter/60 p-4 text-left">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" />
          <p className="text-sm text-neutral-700">
            <span className="font-semibold text-neutral-900">
              You&apos;ll verify your email at the end.
            </span>{" "}
            To view and save your completed estimate we&apos;ll send a one-time
            code to your email and create a free passwordless account. We
            won&apos;t sign you up to marketing.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <TrackedLink
            href="/value-my-property/address"
            event="valuation_cta_clicked"
            properties={{ source: "intro" }}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 text-base font-semibold text-white shadow-lg transition-colors hover:bg-brand-primary-light"
          >
            Start my valuation
            <ArrowRight className="size-5" aria-hidden="true" />
          </TrackedLink>
          <Link
            href="/sold-prices"
            className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-brand-primary px-8 text-base font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
          >
            Browse sold prices
          </Link>
        </div>
      </section>

      <section aria-labelledby="vmp-steps-heading" className="mt-20">
        <h2
          id="vmp-steps-heading"
          className="text-center font-heading text-2xl font-bold text-neutral-900"
        >
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-xl border border-neutral-200 p-6"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <step.icon className="size-6" aria-hidden="true" />
              </div>
              <p className="font-heading text-xs font-semibold uppercase tracking-wide text-brand-secondary">
                Step {index + 1}
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold text-neutral-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
