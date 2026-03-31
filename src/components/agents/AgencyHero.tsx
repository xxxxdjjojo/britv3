/**
 * AgencyHero — Server Component
 *
 * Renders the branded hero section for an estate agent public profile page.
 * Includes cover photo/gradient, logo/avatar with verified badge, agency identity
 * block (name, Premium Partner badge, rating row, CTA buttons), and the AgencyStatBar.
 */

import Image from "next/image";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import AgencyStatBar from "@/components/agents/AgencyStatBar";
import type { AgentPublicProfile, AgentPublicStats } from "@/types/providers";

type AgencyHeroProps = Readonly<{
  agency: AgentPublicProfile;
  stats: AgentPublicStats;
}>;

function LogoFallback({ name }: Readonly<{ name: string | null }>) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0] ?? "")
        .join("")
        .toUpperCase()
    : "AG";
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1B4D3E] text-white text-2xl font-bold">
      {initials}
    </div>
  );
}

export default function AgencyHero({ agency, stats }: AgencyHeroProps) {
  const agencyName = agency.agency?.name ?? agency.display_name;
  const logoUrl = agency.agency?.logo_url ?? null;
  const city = agency.areas_covered?.[0] ?? null;
  const avgRating = stats.avg_rating;
  const totalReviews = stats.total_reviews;

  return (
    <div className="bg-[#faf9f8] dark:bg-[#0f1a17] rounded-xl shadow-sm overflow-hidden mb-8">
      {/* Cover photo / gradient */}
      <div className="relative h-48">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${agencyName} cover`}
            fill
            className="object-cover opacity-20"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B4D3E]/20 via-[#e8e6e3] to-[#D4A853]/10" />
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#faf9f8]/60 dark:to-[#0f1a17]/60" />
      </div>

      {/* Content below cover */}
      <div className="px-8 pb-8">
        {/* Logo + identity row */}
        <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-xl ring-4 ring-[#1B4D3E] shadow-md bg-[#faf9f8] overflow-hidden">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${agencyName} logo`}
                  fill
                  className="object-cover"
                />
              ) : (
                <LogoFallback name={agencyName} />
              )}
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-2 -right-2 bg-[#1B4D3E] text-white p-1 rounded-full border-2 border-[#faf9f8] dark:border-[#0f1a17]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 pt-4 md:pt-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-heading font-bold tracking-tight text-[#1a1a1a] dark:text-white">
                {agencyName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] text-xs font-semibold px-2.5 py-0.5">
                Premium Partner
              </span>
            </div>

            {/* Rating + location row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7280] dark:text-[#9ca3af]">
              {avgRating != null && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#D4A853] text-[#D4A853]" />
                  <span className="font-semibold text-[#1a1a1a] dark:text-white">
                    {avgRating}
                  </span>
                  <span>({totalReviews} Reviews)</span>
                </span>
              )}
              {city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#9ca3af]" />
                  {city}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 min-h-[44px] rounded-xl bg-[#f4f3f2] dark:bg-[#1a2822] text-sm font-medium text-[#1a1a1a] dark:text-white hover:bg-[#eceae8] dark:hover:bg-[#243330] transition-colors"
              >
                Follow
              </button>
              <button
                type="button"
                className="px-4 py-2 min-h-[44px] rounded-xl bg-[#1B4D3E] text-white text-sm font-medium hover:bg-[#163d31] active:bg-[#0f2b22] transition-colors"
              >
                Contact Agent
              </button>
            </div>
          </div>
        </div>

        {/* Stat bar */}
        <AgencyStatBar stats={stats} />
      </div>
    </div>
  );
}
