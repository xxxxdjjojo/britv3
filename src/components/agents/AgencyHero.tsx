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
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
      {/* Logo + identity + CTA row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white overflow-hidden">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${agencyName} logo`}
                  fill
                  className="object-contain p-2"
                  priority
                />
              ) : (
                <LogoFallback name={agencyName} />
              )}
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-2 -right-2 bg-brand-primary text-white p-1 rounded-full border-2 border-white dark:border-slate-900">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                {agencyName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold px-3 py-1 uppercase tracking-wider">
                Premium Partner
              </span>
            </div>

            {/* Rating + location row */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              {avgRating != null && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-brand-secondary text-brand-secondary" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {avgRating}
                  </span>
                  <span className="ml-1">({totalReviews} Reviews)</span>
                </span>
              )}
              {city && (
                <>
                  {avgRating != null && (
                    <span className="mx-1 text-slate-300 dark:text-slate-600">
                      &bull;
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex-1 md:flex-none border border-brand-primary text-brand-primary font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/5 transition-colors"
          >
            Follow
          </button>
          <button
            type="button"
            className="flex-1 md:flex-none bg-brand-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-primary-light transition-all"
          >
            Contact Agent
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <AgencyStatBar stats={stats} />
    </section>
  );
}
