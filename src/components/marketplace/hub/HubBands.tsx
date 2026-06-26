import Link from "next/link";
import {
  Search,
  MessagesSquare,
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
  Lock,
} from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search or post a job",
    body: "Browse verified pros by trade and area, or tell us what you need and let quotes come to you.",
  },
  {
    icon: MessagesSquare,
    title: "Compare & message",
    body: "Read real customer reviews, check ratings, and message professionals directly — no middlemen.",
  },
  {
    icon: CheckCircle2,
    title: "Hire with confidence",
    body: "Agree the work, track it through TrueDeed, and leave a review to help the next homeowner.",
  },
] as const;

const TRUST = [
  {
    icon: BadgeCheck,
    title: "Identity verified",
    body: "Providers are ID-checked before the verified badge appears on their profile.",
  },
  {
    icon: ShieldCheck,
    title: "Real reviews only",
    body: "Ratings come from customers who actually hired through the platform — no anonymous fakes.",
  },
  {
    icon: Lock,
    title: "Protected from start to finish",
    body: "Quotes, messages and milestones live in one place, so there's always a clear record.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary-mid">
          Simple &amp; transparent
        </span>
        <h2
          id="how-heading"
          className="font-heading text-3xl font-bold tracking-tight text-foreground dark:text-white"
        >
          How it works
        </h2>
      </div>

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="relative rounded-2xl border border-border bg-white p-7 dark:border-slate-700 dark:bg-slate-900"
          >
            <span
              aria-hidden
              className="font-heading text-5xl font-extrabold text-brand-primary-lighter dark:text-slate-800"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-4 flex size-11 items-center justify-center rounded-xl bg-brand-primary text-white">
              <step.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-lg font-bold text-foreground dark:text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TrustBand() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="bg-brand-primary-dark text-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2
          id="trust-heading"
          className="max-w-2xl font-heading text-3xl font-bold tracking-tight"
        >
          Why homeowners trust the TrueDeed marketplace
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {TRUST.map((item) => (
            <div key={item.title} className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-brand-gold ring-1 ring-white/15">
                <item.icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-heading text-lg font-bold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-white/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Homeowner CTA */}
        <div className="flex flex-col justify-between rounded-3xl bg-brand-primary-lighter p-9 dark:bg-slate-900">
          <div>
            <h2
              id="cta-heading"
              className="font-heading text-2xl font-bold text-brand-primary-dark dark:text-white"
            >
              Need a job done?
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-primary-dark/70 dark:text-slate-300">
              Post it once and receive quotes from verified professionals in your
              area — completely free.
            </p>
          </div>
          <Link
            href="/post-a-job"
            className="mt-6 inline-flex w-fit items-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Post a job — it&apos;s free
          </Link>
        </div>

        {/* Professional CTA */}
        <div className="flex flex-col justify-between rounded-3xl bg-brand-primary-dark p-9 text-white">
          <div>
            <h2 className="font-heading text-2xl font-bold">
              Are you a professional?
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
              List your business on TrueDeed, win quality leads, and build a
              reputation on real customer reviews.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register?professional=service_provider"
              className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-primary-dark transition-colors hover:bg-brand-primary-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-dark"
            >
              List your business
            </Link>
            <Link
              href="/dashboard/provider/jobs/leads"
              className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10"
            >
              Browse available jobs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
