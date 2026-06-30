import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getLocalExperts } from "@/services/placements/local-experts-service";
import { buildViewAllHref } from "@/lib/placements/local-expert-links";
import type { ListingType } from "@/lib/placements/relevance";

import { LocalExpertsList } from "./LocalExpertsList";

type Props = Readonly<{
  listingId: string;
  propertyId: string;
  postcode: string | null;
  town: string | null;
  region: string | null;
  address?: string | null;
  coordinates: { lat: number; lng: number } | null;
  listingType: ListingType;
  /** True when the page surfaces renovation potential (renovation trades lead). */
  hasRenovationPotential: boolean;
}>;

function postcodeDistrict(postcode: string | null): string | null {
  if (!postcode) return null;
  return postcode.trim().toUpperCase().split(" ")[0] || null;
}

/**
 * "Local experts who can help with this property" — organic verified traders
 * near the home, with a small number of clearly-labelled sponsored cards blended
 * in. Server-rendered and self-gating: renders nothing when no eligible trader
 * matches, so the page degrades gracefully.
 */
export async function LocalExpertsSection({
  listingId,
  propertyId,
  postcode,
  town,
  region,
  address,
  coordinates,
  listingType,
  hasRenovationPotential,
}: Props) {
  let experts;
  try {
    const supabase = await createClient();
    experts = await getLocalExperts(supabase, {
      postcode,
      postcodeDistrict: postcodeDistrict(postcode),
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
      town,
      region,
      listingType,
      hasRenovationPotential,
      limit: 3,
      sponsoredLimit: 2,
    });
  } catch {
    return null;
  }

  if (!experts || experts.length === 0) return null;

  // Link to all local trades for the area — do NOT narrow by the first card's
  // category (it may be a sponsored card whose trade is unrelated to the rest).
  const viewAllHref = buildViewAllHref({ postcode });

  return (
    <section aria-labelledby="local-experts-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <h2
            id="local-experts-heading"
            className="flex items-center gap-2 text-xl font-semibold text-[color:var(--color-brand-primary,#1B4D3E)]"
            style={{ fontFamily: "var(--font-plus-jakarta-sans, 'Plus Jakarta Sans', sans-serif)" }}
          >
            <ShieldCheck className="size-5 shrink-0" />
            Local experts who can help with this property
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Connect with vetted professionals near this home — from surveys and roofing to bathrooms, electrics and
            renovations.
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--color-brand-primary,#1B4D3E)] hover:text-[color:var(--color-brand-primary-light,#2D7A5F)]"
        >
          View all local experts
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <LocalExpertsList
        experts={experts}
        context={{ propertyId, listingId, zone: "property_bottom" }}
        postcode={postcode}
        address={address}
      />
    </section>
  );
}
