import { Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { categoriesForStage, type PlacementStage } from "@/lib/placements/relevance";
import { getFeaturedExperts } from "@/services/placements/placement-service";
import type { PlacementZone } from "@/types/sponsored-placements";

import { FeaturedExpertCard } from "./FeaturedExpertCard";

type Props = Readonly<{
  zone: PlacementZone;
  heading?: string;
  subheading?: string;
  postcode?: string | null;
  town?: string | null;
  region?: string | null;
  stage?: PlacementStage;
  categories?: string[] | null;
  propertyId?: string | null;
  limit?: number;
  variant?: "rail" | "band";
}>;

function postcodeDistrict(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  return postcode.trim().toUpperCase().split(" ")[0] || null;
}

/**
 * Server-rendered Featured Local Experts. Self-gates: renders nothing when no
 * eligible paid placement matches, so the host page degrades gracefully. Cards
 * are client components that record a visible-render impression.
 */
export async function FeaturedExperts({
  zone,
  heading = "Featured local experts",
  subheading,
  postcode,
  town,
  region,
  stage,
  categories,
  propertyId,
  limit = 3,
  variant = "rail",
}: Props) {
  let experts;
  try {
    const supabase = await createClient();
    experts = await getFeaturedExperts(supabase, {
      postcodeDistrict: postcodeDistrict(postcode),
      town: town ?? null,
      region: region ?? null,
      categories: categories ?? (stage ? categoriesForStage(stage) : null),
      limit,
    });
  } catch {
    return null;
  }

  if (!experts || experts.length === 0) return null;

  const headingId = `featured-experts-${zone}`;

  return (
    <section
      aria-labelledby={headingId}
      className={
        variant === "rail"
          ? "rounded-2xl border bg-card/60 p-4"
          : "rounded-2xl border bg-card/60 p-5"
      }
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2
            id={headingId}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <Sparkles className="size-4" style={{ color: "var(--color-brand-secondary, #A07D2E)" }} />
            {heading}
          </h2>
          {subheading && <p className="mt-0.5 text-xs text-muted-foreground">{subheading}</p>}
        </div>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Sponsored
        </span>
      </div>

      <div className={variant === "rail" ? "space-y-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
        {experts.map((expert) => (
          <FeaturedExpertCard
            key={expert.placementId}
            expert={expert}
            zone={zone}
            propertyId={propertyId}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
}
