import Link from "next/link";
import { Star, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import type { FeaturedProvider } from "@/app/(main)/marketplace/featured-providers";

function ProviderCard({ provider }: { provider: FeaturedProvider }) {
  const name = provider.displayName ?? provider.businessName;
  const topService = provider.services[0];
  // Provider profile route is /services/[category]/[slug]; fall back to the
  // marketplace profile route when no service category is known.
  const profileHref = topService
    ? `/services/${topService}/${provider.slug}`
    : `/marketplace/${provider.slug}`;

  return (
    <a
      href={profileHref}
      className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg hover:shadow-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary-lighter dark:bg-slate-700">
          {provider.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={provider.avatarUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              width={56}
              height={56}
            />
          ) : (
            <span className="font-heading text-xl font-bold text-brand-primary">
              {name.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-heading text-sm font-bold text-foreground dark:text-white">
              {name}
            </h3>
            {provider.isVerified && (
              <ShieldCheck
                className="size-4 shrink-0 text-brand-primary-light"
                aria-label="Verified provider"
              />
            )}
          </div>
          {topService && (
            <p className="truncate text-xs capitalize text-muted-foreground">
              {topService.replace(/_/g, " ")}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-1">
            <Star className="size-4 fill-brand-gold text-brand-gold" aria-hidden />
            <span className="text-xs font-semibold text-foreground dark:text-slate-200">
              {provider.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({provider.totalReviews} reviews)
            </span>
          </div>
        </div>
      </div>

      {provider.city && (
        <div className="mt-4 flex items-center gap-1 border-t border-border pt-3 text-xs text-muted-foreground dark:border-slate-700">
          <MapPin className="size-3.5" aria-hidden />
          {provider.city}
        </div>
      )}
    </a>
  );
}

/**
 * Top-rated providers band, fed by the real `provider_rating_stats` aggregate.
 * Renders nothing when no provider clears the review threshold (seed-empty
 * state) so the page degrades gracefully.
 */
export function FeaturedProviders({ providers }: { providers: FeaturedProvider[] }) {
  if (providers.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-heading"
      className="bg-brand-primary-lighter/50 py-20 dark:bg-slate-900/40"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary-mid">
              Trusted by customers
            </span>
            <h2
              id="featured-heading"
              className="font-heading text-3xl font-bold tracking-tight text-foreground dark:text-white"
            >
              Top-rated this week
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-dark dark:text-brand-primary-light"
          >
            See all professionals
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.providerId} provider={provider} />
          ))}
        </div>
      </div>
    </section>
  );
}
