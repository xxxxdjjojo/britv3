import { Search, MapPin, ShieldCheck, PoundSterling, Star } from "lucide-react";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Verified Professionals" },
  { icon: PoundSterling, label: "No Hidden Costs" },
  { icon: Star, label: "Top-Rated Service" },
] as const;

/**
 * Marketplace hub hero. Soft-green gradient, centered editorial headline with a
 * dual search bar (service + postcode).
 *
 * The form is a plain HTML GET to `/services/tradespeople` so it works without
 * JavaScript. That route reads `q` (search query) and `postcode` directly from
 * its search params, so the search is fully functional server-side.
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_85%_0%,rgba(45,122,95,0.16),transparent_70%),radial-gradient(50%_45%_at_10%_100%,rgba(45,122,95,0.08),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-brand-primary ring-1 ring-brand-primary/20 backdrop-blur dark:bg-slate-900/70 dark:text-brand-primary-light">
          <span
            aria-hidden
            className="size-2 animate-pulse rounded-full bg-brand-primary-light"
          />
          Trusted by 50,000+ UK homeowners
        </span>

        <h1
          id="hub-hero-heading"
          className="mt-8 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-primary-dark dark:text-white sm:text-5xl lg:text-6xl"
        >
          Find Trusted Tradespeople
          <br />
          <span className="text-brand-primary-light">Near You.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-primary-dark/70 dark:text-slate-300">
          Book verified plumbers, electricians and more in minutes. Quality
          professionals, real reviews, transparent ratings.
        </p>

        {/* Dual search — plain HTML GET, works without JS. /services/tradespeople
            reads `q` and `postcode` from its search params. */}
        <form
          action="/services/tradespeople"
          method="get"
          role="search"
          aria-label="Search professionals"
          className="mx-auto mt-10 flex max-w-4xl flex-col items-stretch gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-brand-primary/10 ring-1 ring-brand-primary/10 md:flex-row dark:bg-slate-900 dark:ring-slate-700"
        >
          <div className="flex flex-1 items-center gap-3 px-4">
            <Search
              className="size-5 shrink-0 text-brand-primary-mid"
              aria-hidden
            />
            <label htmlFor="hub-search-service" className="sr-only">
              What service do you need?
            </label>
            <input
              id="hub-search-service"
              type="text"
              name="q"
              aria-label="Service"
              placeholder="What service do you need?"
              className="w-full bg-transparent py-4 text-base md:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <div
            aria-hidden
            className="hidden w-px self-center bg-border md:block md:h-10 dark:bg-slate-700"
          />

          <div className="flex flex-1 items-center gap-3 px-4">
            <MapPin
              className="size-5 shrink-0 text-brand-primary-mid"
              aria-hidden
            />
            <label htmlFor="hub-search-postcode" className="sr-only">
              Enter postcode
            </label>
            <input
              id="hub-search-postcode"
              type="text"
              name="postcode"
              aria-label="Postcode"
              placeholder="Enter postcode"
              autoComplete="postal-code"
              inputMode="text"
              className="w-full bg-transparent py-4 text-base md:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-brand-primary px-10 py-4 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-colors hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Search Pros
          </button>
        </form>

        {/* Trust badges */}
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-brand-primary-dark/70 dark:text-slate-400">
          {TRUST_BADGES.map((badge) => (
            <li key={badge.label} className="flex items-center gap-2">
              <badge.icon
                className="size-4 text-brand-primary-light"
                aria-hidden
              />
              {badge.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
