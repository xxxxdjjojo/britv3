import Link from "next/link";
import { ShieldCheck, Search, Star } from "lucide-react";

/**
 * Marketplace hub hero. Editorial, airy, soft-green direction.
 *
 * The search form posts to `/services` (a real route) via plain GET so it works
 * without JavaScript — mirroring the original landing behaviour. A secondary
 * "Post a Job" CTA routes to `/post-a-job`.
 */
export function HubHero() {
  return (
    <section
      aria-labelledby="hub-hero-heading"
      className="relative overflow-hidden bg-brand-primary-lighter dark:bg-slate-950"
    >
      {/* Soft atmospheric wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_85%_0%,rgba(45,122,95,0.18),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-primary ring-1 ring-brand-primary/15 backdrop-blur dark:bg-slate-900/70 dark:text-brand-primary-light">
            <ShieldCheck className="size-3.5" />
            Verified UK professionals
          </span>

          <h1
            id="hub-hero-heading"
            className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-primary-dark dark:text-white sm:text-5xl lg:text-6xl"
          >
            Find a tradesperson
            <br />
            <span className="text-brand-primary-light">you can actually trust.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-primary-dark/70 dark:text-slate-300">
            Plumbers, electricians, builders and property professionals across the UK —
            ID-checked, reviewed by real customers, and rated transparently.
          </p>

          {/* Search — plain HTML GET, works without JS */}
          <form
            action="/services"
            method="get"
            role="search"
            aria-label="Search professionals"
            className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-lg shadow-brand-primary/5 ring-1 ring-brand-primary/10 sm:flex-row dark:bg-slate-900 dark:ring-slate-700"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="size-5 shrink-0 text-brand-primary-mid" aria-hidden />
              <label htmlFor="hub-search" className="sr-only">
                Search by trade or profession
              </label>
              <input
                id="hub-search"
                type="text"
                name="q"
                placeholder="Try “electrician” or “surveyor”…"
                className="w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-primary-dark/70 dark:text-slate-400">
            <span>
              Got a job in mind?{" "}
              <Link
                href="/post-a-job"
                className="font-semibold text-brand-primary underline-offset-4 hover:underline dark:text-brand-primary-light"
              >
                Post it free &amp; get quotes →
              </Link>
            </span>
          </div>
        </div>

        {/* Editorial trust card */}
        <div className="relative hidden items-center justify-center lg:flex">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl shadow-brand-primary/10 ring-1 ring-brand-primary/10 dark:bg-slate-900 dark:ring-slate-700">
            <div className="flex items-center gap-1 text-brand-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-current" aria-hidden />
              ))}
            </div>
            <p className="mt-4 text-lg font-medium leading-snug text-brand-primary-dark dark:text-white">
              “Found a vetted electrician in minutes. The reviews were the real
              deal — no surprises.”
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              A homeowner in Manchester
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 dark:border-slate-700">
              {[
                { value: "ID", label: "checked" },
                { value: "100%", label: "real reviews" },
                { value: "UK-wide", label: "coverage" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-lg font-bold text-brand-primary dark:text-brand-primary-light">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
