/**
 * SpecialistHero — Server Component
 *
 * Shared hero section for mortgage broker, conveyancer, and surveyor public
 * profile pages. Renders a corporate/professional layout (no cover photo) with
 * a role-coloured avatar ring, identity block, primary regulatory badge, and
 * CTA buttons.
 */

import { BadgeCheck, Building2, Scale, MapPin, Clock, Star, ShieldCheck } from "lucide-react";
import Image from "next/image";
import TrustBadges from "@/components/providers/TrustBadges";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export type SpecialistType = "mortgage_broker" | "conveyancer" | "surveyor";

// ---------------------------------------------------------------------------
// Accreditation parsing helpers
// ---------------------------------------------------------------------------

type ParsedAccreditation = {
  type: string;
  number?: string;
};

/**
 * Parses the provider's qualifications array into structured accreditation
 * objects using the "PREFIX:NUMBER" convention (e.g. "FCA:FRN123456").
 */
function parseAccreditations(qualifications: string[] | null): ParsedAccreditation[] {
  if (!qualifications) return [];
  return qualifications.map((q) => {
    const colonIdx = q.indexOf(":");
    if (colonIdx === -1) {
      return { type: q };
    }
    return {
      type: q.slice(0, colonIdx).toLowerCase(),
      number: q.slice(colonIdx + 1),
    };
  });
}

type RegBadgeResult = { regType: string; number: string };

/**
 * Finds the primary regulatory registration badge for a given specialist type.
 * Looks for FCA (mortgage_broker), SRA or CLC (conveyancer), RICS (surveyor).
 */
function parseRegBadge(
  accreditations: ParsedAccreditation[],
  specialistType: SpecialistType,
): RegBadgeResult | null {
  for (const acc of accreditations) {
    const t = acc.type.toLowerCase();
    if (specialistType === "mortgage_broker" && t === "fca") {
      return { regType: "FCA", number: acc.number ?? "" };
    }
    if (specialistType === "conveyancer" && (t === "sra" || t === "clc")) {
      return { regType: t.toUpperCase(), number: acc.number ?? "" };
    }
    if (specialistType === "surveyor" && t === "rics") {
      return { regType: "RICS", number: acc.number ?? "" };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Ring / badge colour config per specialist type
// ---------------------------------------------------------------------------

const RING_CLASSES: Record<SpecialistType, string> = {
  mortgage_broker: "ring-brand-accent bg-brand-accent/10",
  conveyancer: "ring-brand-accent bg-brand-accent/10",
  surveyor: "ring-brand-primary bg-brand-primary/10",
};

const REG_BADGE_CLASSES: Record<SpecialistType, string> = {
  mortgage_broker: "bg-brand-accent",
  conveyancer: "bg-brand-accent",
  surveyor: "bg-brand-primary",
};

const CATEGORY_LABEL: Record<SpecialistType, string> = {
  mortgage_broker: "Mortgage Broker",
  conveyancer: "Conveyancer / Solicitor",
  surveyor: "Chartered Surveyor",
};

const CTA_LABEL: Record<SpecialistType, string> = {
  mortgage_broker: "Get Free Advice",
  conveyancer: "Get a Quote",
  surveyor: "Book Survey",
};

// ---------------------------------------------------------------------------
// AvatarFallback
// ---------------------------------------------------------------------------

function AvatarFallback({ name, ringClass }: Readonly<{ name: string | null; ringClass: string }>) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0] ?? "")
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div
      className={`w-full h-full flex items-center justify-center text-2xl font-bold text-white ${ringClass.split(" ")[1] ?? "bg-[--color-surface-container-high]"}`}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpecialistHero
// ---------------------------------------------------------------------------

type SpecialistHeroProps = Readonly<{
  provider: ServiceProviderPublicProfile;
  specialistType: SpecialistType;
}>;

export default function SpecialistHero({ provider, specialistType }: SpecialistHeroProps) {
  const rating = provider.provider_rating_stats;
  const avg = rating?.avg_rating ?? null;
  const totalReviews = rating?.total_reviews ?? 0;
  const verificationStatus = provider.profiles.provider_verification_status ?? "pending";

  const accreditations = parseAccreditations(provider.qualifications);
  const regBadge = parseRegBadge(accreditations, specialistType);
  const ringClass = RING_CLASSES[specialistType];
  const badgeClass = REG_BADGE_CLASSES[specialistType];
  const categoryLabel = CATEGORY_LABEL[specialistType];
  const ctaLabel = CTA_LABEL[specialistType];

  const insuranceDetails: Record<string, unknown> | null = provider.insurance_verified
    ? { verified: true }
    : null;

  // TrustBadges expects { type: string; number?: string; expires?: string }[]
  const trustAccreditations = accreditations.map((a) => ({ type: a.type, number: a.number }));

  return (
    <div className="bg-surface-container-lowest dark:bg-neutral-900 rounded-xl border border-[--color-outline-variant] dark:border-neutral-800 p-8 mb-8">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar with ring */}
        <div className="relative shrink-0">
          <div
            className={`w-20 h-20 rounded-full overflow-hidden ring-4 ${ringClass} flex items-center justify-center`}
          >
            {provider.profiles.avatar_url ? (
              <Image
                src={provider.profiles.avatar_url}
                alt={provider.business_name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <AvatarFallback name={provider.profiles.full_name} ringClass={ringClass} />
            )}
          </div>
          {/* Verified overlay */}
          {verificationStatus === "verified" && (
            <span className="absolute -bottom-1 -right-1 bg-brand-primary text-white p-1 rounded-full border-2 border-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Identity block */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-on-surface dark:text-white tracking-tight">
            {provider.business_name}
          </h1>
          <p className="text-lg text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] mt-0.5">{categoryLabel}</p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">
            {avg !== null && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-brand-secondary text-brand-secondary" />
                <strong className="text-on-surface dark:text-white">{avg.toFixed(1)}</strong>
                <span>({totalReviews} reviews)</span>
              </span>
            )}
            {provider.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[--color-on-surface-variant]" />
                {provider.city}
              </span>
            )}
            {provider.years_experience !== null && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[--color-on-surface-variant]" />
                {provider.years_experience} years experience
              </span>
            )}
          </div>

          {/* Primary regulatory badge */}
          {regBadge && (
            <div className="mt-3">
              {specialistType === "mortgage_broker" && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 ${badgeClass} text-white text-xs font-bold rounded-full`}
                >
                  <BadgeCheck className="w-3 h-3" />
                  FCA Authorised &middot; FRN {regBadge.number}
                </span>
              )}
              {specialistType === "conveyancer" && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 ${badgeClass} text-white text-xs font-bold rounded-full`}
                >
                  <Scale className="w-3 h-3" />
                  {regBadge.regType} Regulated &middot; {regBadge.number}
                </span>
              )}
              {specialistType === "surveyor" && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 ${badgeClass} text-white text-xs font-bold rounded-full`}
                >
                  <Building2 className="w-3 h-3" />
                  RICS Member &middot; {regBadge.number}
                </span>
              )}
            </div>
          )}

          {/* Trust badges row */}
          <TrustBadges
            accreditations={trustAccreditations}
            insuranceDetails={insuranceDetails}
            verificationStatus={verificationStatus}
          />

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href="#quote"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors"
            >
              {ctaLabel}
            </a>
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[--color-outline-variant] dark:border-neutral-600 text-on-surface dark:text-neutral-200 text-sm font-semibold rounded-lg hover:bg-[--color-surface-container-low] dark:hover:bg-neutral-800 transition-colors"
              >
                Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
