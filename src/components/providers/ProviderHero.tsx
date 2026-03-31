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
    <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white text-4xl font-bold">
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
    <div className="relative bg-surface dark:bg-[#0f1a17]">
      {/* Cover photo — tall on desktop, medium on mobile */}
      <div className="relative w-full h-[240px] md:h-[340px] overflow-hidden bg-neutral-200 dark:bg-neutral-900">
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
          <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 via-neutral-200 to-brand-secondary/10 dark:from-brand-primary/40 dark:to-[#0f1a17]" />
        )}
        {/* Glassmorphism gradient overlay — fades into page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent dark:from-[#0f1a17] dark:via-[#0f1a17]/30 dark:to-transparent" />

        {/* Floating glassmorphism stats pill — visible on md+ */}
        {avg !== null && (
          <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm">
            <Star className="w-4 h-4 fill-brand-secondary text-brand-secondary" />
            <span className="text-sm font-bold text-brand-primary dark:text-white tracking-tight">
              {avg.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
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
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl ring-4 ring-brand-primary shadow-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
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
                className="absolute -bottom-2 -right-2 bg-brand-primary text-white p-1.5 rounded-xl shadow-md"
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
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-neutral-950 dark:text-white">
              {provider.business_name}
            </h1>
            <p className="text-base text-neutral-500 dark:text-neutral-400 mt-0.5 capitalize font-sans">
              {String(categoryLabel).replace(/_/g, " ")}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              {avg !== null && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-brand-secondary text-brand-secondary" />
                  <strong className="text-neutral-950 dark:text-white font-semibold">
                    {avg.toFixed(1)}
                  </strong>
                  <span className="text-neutral-400">({totalReviews} reviews)</span>
                </span>
              )}
              {provider.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  {provider.city}
                </span>
              )}
              {provider.years_experience !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-neutral-400" />
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
                className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 active:bg-brand-primary-dark transition-colors shadow-sm"
                aria-label={`Get a quote from ${provider.business_name}`}
              >
                <FileText className="w-4 h-4" />
                Get Quote
              </a>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 bg-surface-container-low dark:bg-neutral-800 text-neutral-950 dark:text-white text-sm font-semibold rounded-xl hover:bg-[#eceae8] dark:hover:bg-neutral-800 transition-colors"
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
