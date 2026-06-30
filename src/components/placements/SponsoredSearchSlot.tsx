"use client";

import { useEffect, useState } from "react";

import type { FeaturedExpert } from "@/types/sponsored-placements";

import { FeaturedExpertCard } from "./FeaturedExpertCard";

type Props = Readonly<{
  area?: string | null;
  listingType: "sale" | "rent" | "all" | "new_build";
}>;

/**
 * A single native sponsored expert card for the search results list. Fetches one
 * relevant featured expert for the current area/journey and renders nothing when
 * none is available, so it never pads the grid with empty space.
 */
export function SponsoredSearchSlot({ area, listingType }: Props) {
  const [expert, setExpert] = useState<FeaturedExpert | null>(null);

  useEffect(() => {
    let active = true;
    const stage = listingType === "rent" ? "rent" : "buy";
    const params = new URLSearchParams({ stage, limit: "1" });
    if (area) params.set("town", area);

    fetch(`/api/placements/featured?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { experts: [] }))
      .then((d: { experts?: FeaturedExpert[] }) => {
        if (active) setExpert(d.experts?.[0] ?? null);
      })
      .catch(() => {
        if (active) setExpert(null);
      });

    return () => {
      active = false;
    };
  }, [area, listingType]);

  if (!expert) return null;

  const action = listingType === "rent" ? "Moving to" : "Buying in";
  const headline = area
    ? `${action} ${area}? Speak to a verified local ${expert.primaryService.toLowerCase()}.`
    : `Speak to a verified local ${expert.primaryService.toLowerCase()}.`;

  return (
    <div className="rounded-2xl border border-[color:var(--color-brand-primary-lighter,#E8F5EE)] bg-[color:var(--color-brand-primary-lighter,#E8F5EE)]/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[color:var(--color-brand-primary,#1B4D3E)]">{headline}</p>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sponsored</span>
      </div>
      <FeaturedExpertCard expert={expert} zone="search_grid" variant="band" sponsored={false} />
    </div>
  );
}
