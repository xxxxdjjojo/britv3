/**
 * ProviderHero — Server Component
 *
 * Renders the hero section for a tradesperson public profile page.
 * Includes cover photo, avatar, identity block, rating summary, trust badges,
 * and CTA buttons.
 */

import Image from "next/image";
import { MapPin, Clock, Star } from "lucide-react";
import TrustBadges from "@/components/providers/TrustBadges";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import { SLUG_TO_CATEGORY } from "@/lib/providers/category-slugs";

type ProviderHeroProps = Readonly<{
  provider: ServiceProviderPublicProfile;
  category: string;
}>;

function AvatarFallback({ name }: Readonly<{ name: string | null }>) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0] ?? "")
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1B4D3E] text-white text-4xl font-bold">
      {initials}
    </div>
  );
}

export default function ProviderHero({ provider, category }: ProviderHeroProps) {
  const rating = provider.provider_rating_stats;
  const avg = rating?.avg_rating ?? null;
  const totalReviews = rating?.total_reviews ?? 0;
  const categoryLabel = SLUG_TO_CATEGORY[category] ?? category;
  const verificationStatus = provider.profiles.provider_verification_status ?? "pending";

  // Build accreditations array from qualifications field
  // The actual accreditations field doesn't exist on the type — use qualifications
  // mapped as simple accreditation objects
  const accreditations = (provider.qualifications ?? []).map((q) => ({ type: q }));

  const insuranceDetails: Record<string, unknown> | null = provider.insurance_verified
    ? { verified: true }
    : null;

  return (
    <div className="relative">
      {/* Cover photo */}
      <div className="relative w-full h-[300px] bg-slate-200 overflow-hidden">
        {provider.profiles.avatar_url ? (
          <Image
            src={provider.profiles.avatar_url}
            alt={`${provider.business_name} cover`}
            fill
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PC9zdmc+"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent dark:from-slate-950" />
      </div>

      {/* Identity row */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-6 -mt-20 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100">
              {provider.profiles.avatar_url ? (
                <Image
                  src={provider.profiles.avatar_url}
                  alt={provider.business_name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <AvatarFallback name={provider.profiles.full_name} />
              )}
            </div>
            {/* Verified shield overlay */}
            {verificationStatus === "verified" && (
              <span className="absolute bottom-2 right-2 bg-[#1B4D3E] text-white p-1.5 rounded-full border-2 border-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </span>
            )}
          </div>

          {/* Identity block */}
          <div className="flex-1 pb-6 pt-24 md:pt-24">
            <h1 className="text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
              {provider.business_name}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mt-1 capitalize">
              {String(categoryLabel).replace(/_/g, " ")}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
              {avg !== null && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-slate-900 dark:text-white">{avg.toFixed(1)}</strong>
                  <span>({totalReviews} Reviews)</span>
                </span>
              )}
              {provider.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {provider.city}
                </span>
              )}
              {provider.years_experience !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {provider.years_experience} years experience
                </span>
              )}
            </div>

            {/* Trust badges */}
            <TrustBadges
              accreditations={accreditations}
              insuranceDetails={insuranceDetails}
              verificationStatus={verificationStatus}
            />

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href="#quote"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request a Quote
              </a>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Call
                </a>
              )}
              <a
                href="#message"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
