/**
 * ProviderSearchCard — Server Component
 *
 * Renders a provider card for category landing pages and search results.
 * Matches the Stitch search results card layout: avatar, identity block,
 * rating row, trust badges, latest review snippet, and dual CTAs.
 */

import { MapPin, ShieldCheck, Star } from "lucide-react";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import { CompareButton } from "@/components/providers/CompareButton";

type Props = Readonly<{
  provider: ServiceProviderPublicProfile;
  category: string;
  /** Optional latest review text passed from the page-level fetch */
  latestReview?: string | null;
}>;

function StarRating({ rating }: { rating: number }) {
  const clampedRating = Math.min(5, Math.max(0, rating));
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(clampedRating)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
          }`}
        />
      ))}
    </span>
  );
}

export function ProviderSearchCard({ provider, category, latestReview }: Props) {
  const { provider_rating_stats, slug } = provider;
  // Guard the nested JOIN shape: search results come from the flat
  // search_providers RPC where `profiles`/`provider_rating_stats` may be
  // absent. A missing field must degrade the card, never 500 the page.
  const profiles = provider.profiles;
  const isVerified = profiles?.provider_verification_status === "verified";
  const avatarUrl = profiles?.avatar_url ?? null;
  const avgRating = provider_rating_stats?.average_rating ?? 0;
  const totalReviews = provider_rating_stats?.total_reviews ?? 0;
  const services = provider.services ?? [];
  const displayName = provider.business_name ?? "Provider";
  // Coverage: prefer service_postcodes (always present on the flat search RPC
  // shape) over the unreliable `city` field.
  const coverage = (provider.service_postcodes ?? []).slice(0, 2);

  const truncatedReview =
    latestReview && latestReview.length > 120
      ? `${latestReview.slice(0, 120)}…`
      : latestReview;

  return (
    <article className="group flex flex-col sm:flex-row gap-5 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-brand-primary/30 transition-all">
      {/* Left: Avatar */}
      <div className="relative flex-shrink-0 self-start">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-brand-primary-lighter dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-800">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isVerified && (
          <span
            className="absolute -bottom-1.5 -right-1.5 bg-brand-primary rounded-full p-1 ring-2 ring-white dark:ring-slate-900"
            title="TrueDeed Verified"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </span>
        )}
      </div>

      {/* Right: Identity block */}
      <div className="flex-1 min-w-0">
        {/* Name + verified mark + Compare */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-brand-primary transition-colors">
            {displayName}
          </h3>
          {isVerified && (
            <ShieldCheck
              className="w-4 h-4 text-brand-primary"
              aria-label="Verified"
            />
          )}
          <span className="ml-auto">
            <CompareButton providerId={provider.id} providerName={displayName} />
          </span>
        </div>

        {/* Rating row */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
          {totalReviews > 0 ? (
            <>
              <StarRating rating={avgRating} />
              <span className="font-semibold text-slate-900 dark:text-white">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-slate-400">
                ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
              </span>
            </>
          ) : (
            <span className="text-slate-400 text-xs">No reviews yet</span>
          )}
          {provider.years_experience && provider.years_experience > 0 && (
            <span className="text-slate-400">
              · {provider.years_experience} yrs experience
            </span>
          )}
        </div>

        {/* Service category pills */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {services.slice(0, 3).map((svc) => (
            <span
              key={svc}
              className="px-2.5 py-1 bg-brand-primary-lighter dark:bg-brand-primary/15 text-brand-primary dark:text-brand-primary-mid text-[11px] font-semibold rounded-md capitalize"
            >
              {String(svc).replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {/* Trust badges + coverage */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-primary text-white text-[11px] font-bold rounded-full">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          )}
          {provider.insurance_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-primary-light text-white text-[11px] font-bold rounded-full">
              Insured
            </span>
          )}
          {(provider.qualifications ?? []).slice(0, 1).map((q) => (
            <span
              key={q}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-secondary text-white text-[11px] font-bold rounded-full"
            >
              {q.split(":")[0]}
            </span>
          ))}
          {coverage.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <MapPin className="w-3 h-3" />
              {coverage.join(", ")}
            </span>
          )}
        </div>

        {/* Latest review snippet */}
        {truncatedReview && (
          <p className="italic text-sm text-slate-500 dark:text-slate-500 mt-2 line-clamp-2">
            &ldquo;{truncatedReview}&rdquo;
          </p>
        )}

        {/* Bottom CTA row */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <a
            href={`/services/${category}/${slug}`}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-primary-light transition-colors"
          >
            View Profile
          </a>
          <a
            href={`/services/${category}/${slug}#services`}
            className="border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            Get a Quote
          </a>
        </div>
      </div>
    </article>
  );
}
