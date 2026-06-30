"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, MapPin, Star, User } from "lucide-react";

import { useImpressionTracking } from "@/hooks/useImpressionTracking";
import { trackPlacementEvent } from "@/lib/placements/track-placement-event";
import type { FeaturedExpert, PlacementZone } from "@/types/sponsored-placements";

type Props = Readonly<{
  expert: FeaturedExpert;
  zone: PlacementZone;
  propertyId?: string | null;
  /** Show the regulatory "Sponsored" tag (true for paid placements). */
  sponsored?: boolean;
  variant?: "rail" | "band";
}>;

function formatRating(rating: number | null): string {
  return rating == null ? "New" : rating.toFixed(1);
}

function formatResponse(hours: number | null): string | null {
  if (hours == null) return null;
  if (hours <= 1) return "Replies within an hour";
  if (hours <= 24) return `Replies in ~${Math.round(hours)}h`;
  return `Replies in ~${Math.round(hours / 24)}d`;
}

export function FeaturedExpertCard({ expert, zone, propertyId, sponsored = true, variant = "rail" }: Props) {
  const onImpression = useCallback(() => {
    trackPlacementEvent({
      placementId: expert.placementId,
      providerId: expert.providerId,
      eventType: "impression",
      zone,
      propertyId,
    });
  }, [expert.placementId, expert.providerId, zone, propertyId]);

  const cardRef = useImpressionTracking<HTMLDivElement>(onImpression);

  const fire = (eventType: "click" | "profile_view" | "enquiry_started") =>
    trackPlacementEvent({ placementId: expert.placementId, providerId: expert.providerId, eventType, zone, propertyId });

  const profileHref = `/services/tradespeople/${expert.slug}`;
  const responseLabel = formatResponse(expert.responseTimeHours);

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl border border-[color:var(--color-brand-primary-lighter,#E8F5EE)] bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {sponsored && (
        <span className="absolute right-3 top-3 rounded-full bg-[color:var(--color-brand-primary-lighter,#E8F5EE)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-brand-primary,#1B4D3E)]">
          Sponsored
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
          {expert.avatarUrl ? (
            <Image src={expert.avatarUrl} alt={`${expert.businessName} logo`} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <User className="size-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{expert.businessName}</p>
            {expert.isVerified && (
              <BadgeCheck
                className="size-4 shrink-0"
                style={{ color: "var(--color-brand-primary, #1B4D3E)" }}
                aria-label="Verified local expert"
              />
            )}
          </div>
          <p className="text-xs font-medium text-[color:var(--color-brand-primary,#1B4D3E)]">{expert.primaryService}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star
                className="size-3"
                style={{ color: "var(--color-brand-secondary, #A07D2E)", fill: "var(--color-brand-secondary, #A07D2E)" }}
              />
              <span className="font-medium text-foreground">{formatRating(expert.averageRating)}</span>
              {expert.totalReviews > 0 && <span>({expert.totalReviews})</span>}
            </span>
            {expert.serviceArea && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {expert.serviceArea}
              </span>
            )}
          </div>
        </div>
      </div>

      {expert.valueProposition && variant === "rail" && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{expert.valueProposition}</p>
      )}

      {responseLabel && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-primary-light,#2D7A5F)]">
          <Clock className="size-3" />
          {responseLabel}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`${profileHref}?intent=quote`}
          onClick={() => {
            fire("click");
            fire("enquiry_started");
          }}
          className="flex-1 rounded-lg bg-[color:var(--color-brand-primary,#1B4D3E)] px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[color:var(--color-brand-primary-light,#2D7A5F)]"
        >
          Request Quote
        </Link>
        <Link
          href={profileHref}
          onClick={() => {
            fire("click");
            fire("profile_view");
          }}
          className="rounded-lg border border-[color:var(--color-brand-primary,#1B4D3E)] px-3 py-2 text-center text-xs font-semibold text-[color:var(--color-brand-primary,#1B4D3E)] transition-colors hover:bg-[color:var(--color-brand-primary-lighter,#E8F5EE)]"
        >
          View
        </Link>
      </div>
    </div>
  );
}
