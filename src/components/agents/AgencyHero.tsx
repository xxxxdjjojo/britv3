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
    <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white text-2xl font-bold">
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
    <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl shadow-sm overflow-hidden mb-8">
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
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-neutral-200 to-brand-secondary/10" />
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-50/60 dark:to-neutral-950/60" />
      </div>

      {/* Content below cover */}
      <div className="px-8 pb-8">
        {/* Logo + identity row */}
        <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-xl ring-4 ring-brand-primary shadow-md bg-neutral-50 overflow-hidden">
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
            <div className="absolute -bottom-2 -right-2 bg-brand-primary text-white p-1 rounded-full border-2 border-neutral-50 dark:border-neutral-950">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 pt-4 md:pt-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-heading font-bold tracking-tight text-neutral-900 dark:text-white">
                {agencyName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold px-2.5 py-0.5">
                Premium Partner
              </span>
            </div>

            {/* Rating + location row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              {avgRating != null && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-brand-secondary text-brand-secondary" />
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {avgRating}
                  </span>
                  <span>({totalReviews} Reviews)</span>
                </span>
              )}
              {city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  {city}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 min-h-[44px] rounded-xl bg-neutral-100 dark:bg-neutral-900 text-sm font-medium text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Follow
              </button>
              <button
                type="button"
                className="px-4 py-2 min-h-[44px] rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 active:bg-brand-primary-dark transition-colors"
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
