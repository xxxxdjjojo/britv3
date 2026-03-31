/**
 * ProviderSearchCard — Server Component
 *
 * Renders a provider card for category landing pages and search results.
 * Matches the Stitch search results card layout: avatar, identity block,
 * rating row, trust badges, latest review snippet, and dual CTAs.
 */

import { ShieldCheck, Star } from "lucide-react";
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
              ? "fill-brand-secondary text-brand-secondary"
              : "fill-surface-container-highest text-surface-container-highest"
          }`}
        />
      ))}
    </span>
  );
}

export function ProviderSearchCard({ provider, category, latestReview }: Props) {
  const { profiles, provider_rating_stats, business_name, slug } = provider;
  const isVerified = profiles.provider_verification_status === "verified";
  const avgRating = provider_rating_stats?.avg_rating ?? 0;
  const totalReviews = provider_rating_stats?.total_reviews ?? 0;

  const truncatedReview =
    latestReview && latestReview.length > 120
      ? `${latestReview.slice(0, 120)}…`
      : latestReview;

  return (
    <article className="flex flex-col sm:flex-row gap-4 p-6 bg-surface rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Left: Avatar */}
      <div className="relative flex-shrink-0 self-start">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-low">
          {profiles.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profiles.avatar_url}
              alt={business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-primary/30">
              {business_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isVerified && (
          <span
            className="absolute -bottom-1 -right-1 bg-brand-primary rounded-full p-0.5"
            title="Britestate Verified"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </span>
        )}
      </div>

      {/* Right: Identity block */}
      <div className="flex-1 min-w-0">
        {/* Name + Compare */}
        <div className="flex flex-wrap items-start gap-2 mb-1">
          <h3
            className="font-heading text-xl font-bold text-brand-primary leading-tight"
            style={{ letterSpacing: "-0.01em" }}
          >
            {business_name}
          </h3>
          <CompareButton providerId={provider.id} providerName={business_name} />
        </div>

        {/* Trade category + location pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {provider.services.slice(0, 3).map((svc) => (
            <span
              key={svc}
              className="px-2.5 py-0.5 bg-brand-primary-lighter text-brand-primary text-xs font-medium rounded-full capitalize"
            >
              {String(svc).replace(/_/g, " ")}
            </span>
          ))}
          {provider.city && (
            <span className="px-2.5 py-0.5 bg-surface-container-low text-brand-primary/60 text-xs font-medium rounded-full">
              {provider.city}
            </span>
          )}
        </div>

        {/* Rating row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-brand-primary/60 mb-2">
          {totalReviews > 0 ? (
            <>
              <StarRating rating={avgRating} />
              <span className="font-semibold text-brand-primary">
                {avgRating.toFixed(1)}
              </span>
              <span>({totalReviews} review{totalReviews !== 1 ? "s" : ""})</span>
            </>
          ) : (
            <span className="text-brand-primary/30 text-xs">No reviews yet</span>
          )}
          {provider.years_experience && provider.years_experience > 0 && (
            <span>· {provider.years_experience} years exp.</span>
          )}
        </div>

        {/* Trust badges (compact, max 3) */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-primary text-white text-xs font-semibold rounded-full">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          )}
          {provider.insurance_verified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-success text-white text-xs font-semibold rounded-full">
              Insured
            </span>
          )}
          {(provider.qualifications ?? []).slice(0, 1).map((q) => (
            <span
              key={q}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-accent text-white text-xs font-semibold rounded-full"
            >
              {q.split(":")[0]}
            </span>
          ))}
        </div>

        {/* Latest review snippet */}
        {truncatedReview && (
          <p className="italic text-sm text-brand-primary/50 mt-2 line-clamp-2">
            &ldquo;{truncatedReview}&rdquo;
          </p>
        )}

        {/* Bottom CTA row */}
        <div className="flex flex-wrap gap-2 mt-4">
          <a
            href={`/services/${category}/${slug}`}
            className="min-h-[44px] inline-flex items-center bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 active:scale-95 transition-all"
          >
            View Profile
          </a>
          <a
            href={`/services/${category}/${slug}#services`}
            className="min-h-[44px] inline-flex items-center bg-surface-container-low text-brand-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors"
          >
            Get a Quote
          </a>
        </div>
      </div>
    </article>
  );
}
