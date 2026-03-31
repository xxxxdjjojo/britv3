/**
 * ProviderHero — Server Component
 *
 * Renders the hero section for a tradesperson public profile page.
 * "Invisible Estate" design: glassmorphism cover overlay, brand-primary avatar
 * ring, gold star rating, trust badges row, and brand-primary CTA buttons.
 * No 1px borders — background colour shifts for surface hierarchy.
 */

import Image from "next/image";
import { MapPin, Clock, Star, Phone, FileText, BadgeCheck } from "lucide-react";
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

  const accreditations = (provider.qualifications ?? []).map((q) => ({ type: q }));

  const insuranceDetails: Record<string, unknown> | null = provider.insurance_verified
    ? { verified: true }
    : null;

  return (
    <div className="relative bg-[#faf9f8] dark:bg-[#0f1a17]">
      {/* Cover photo — tall on desktop, medium on mobile */}
      <div className="relative w-full h-[240px] md:h-[340px] overflow-hidden bg-[#e8e6e3] dark:bg-[#1a2822]">
        {provider.profiles.avatar_url ? (
          <Image
            src={provider.profiles.avatar_url}
            alt={`${provider.business_name} cover`}
            fill
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZThlNmUzIi8+PC9zdmc+"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1B4D3E]/20 via-[#e8e6e3] to-[#D4A853]/10 dark:from-[#1B4D3E]/40 dark:to-[#0f1a17]" />
        )}
        {/* Glassmorphism gradient overlay — fades into page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f8] via-[#faf9f8]/30 to-transparent dark:from-[#0f1a17] dark:via-[#0f1a17]/30 dark:to-transparent" />

        {/* Floating glassmorphism stats pill — visible on md+ */}
        {avg !== null && (
          <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#1a2822]/80 backdrop-blur-md shadow-sm">
            <Star className="w-4 h-4 fill-[#D4A853] text-[#D4A853]" />
            <span className="text-sm font-bold text-[#1B4D3E] dark:text-white tracking-tight">
              {avg.toFixed(1)}
            </span>
            <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
              ({totalReviews})
            </span>
          </div>
        )}
      </div>

      {/* Identity row — overlaps cover via negative margin */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 -mt-16 md:-mt-20 relative z-10">
          {/* Avatar with brand-primary ring */}
          <div className="relative shrink-0 self-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl ring-4 ring-[#1B4D3E] shadow-xl overflow-hidden bg-[#e8e6e3] dark:bg-[#1a2822]">
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
            {/* Verified badge */}
            {verificationStatus === "verified" && (
              <span
                className="absolute -bottom-2 -right-2 bg-[#1B4D3E] text-white p-1.5 rounded-xl shadow-md"
                title="Britestate Verified"
                aria-label="Britestate Verified"
              >
                <BadgeCheck className="w-4 h-4" strokeWidth={2.5} />
              </span>
            )}
          </div>

          {/* Identity block */}
          <div className="flex-1 pt-4 md:pt-20 pb-6">
            {/* Name & category */}
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-[#1a1a1a] dark:text-white">
              {provider.business_name}
            </h1>
            <p className="text-base text-[#6b7280] dark:text-[#9ca3af] mt-0.5 capitalize font-sans">
              {String(categoryLabel).replace(/_/g, " ")}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#6b7280] dark:text-[#9ca3af]">
              {avg !== null && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-[#D4A853] text-[#D4A853]" />
                  <strong className="text-[#1a1a1a] dark:text-white font-semibold">
                    {avg.toFixed(1)}
                  </strong>
                  <span className="text-[#9ca3af]">({totalReviews} reviews)</span>
                </span>
              )}
              {provider.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#9ca3af]" />
                  {provider.city}
                </span>
              )}
              {provider.years_experience !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#9ca3af]" />
                  {provider.years_experience}{" "}
                  {provider.years_experience === 1 ? "year" : "years"} experience
                </span>
              )}
            </div>

            {/* Trust badges */}
            <TrustBadges
              accreditations={accreditations}
              insuranceDetails={insuranceDetails}
              verificationStatus={verificationStatus}
            />

            {/* CTA buttons — 44px touch targets */}
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href="#quote"
                className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 bg-[#1B4D3E] text-white text-sm font-semibold rounded-xl hover:bg-[#163d31] active:bg-[#0f2b22] transition-colors shadow-sm"
                aria-label={`Get a quote from ${provider.business_name}`}
              >
                <FileText className="w-4 h-4" />
                Get Quote
              </a>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 bg-[#f4f3f2] dark:bg-[#1a2822] text-[#1a1a1a] dark:text-white text-sm font-semibold rounded-xl hover:bg-[#eceae8] dark:hover:bg-[#243330] transition-colors"
                  aria-label={`Call ${provider.business_name}`}
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
