"use client";

import { useCallback } from "react";

import { useImpressionTracking } from "@/hooks/useImpressionTracking";
import {
  trackLocalTradersSectionViewed,
  type LocalTraderContext,
} from "@/lib/analytics/local-trader-events";
import type { LocalExpert } from "@/types/local-experts";

import { LocalExpertCard } from "./LocalExpertCard";

type Props = Readonly<{
  experts: LocalExpert[];
  context: LocalTraderContext;
  postcode?: string | null;
  address?: string | null;
}>;

/**
 * Responsive card rail: a snap-scroll carousel on mobile, a 3-up grid on
 * desktop. Records a single section-viewed event when it scrolls into view.
 */
export function LocalExpertsList({ experts, context, postcode, address }: Props) {
  const onImpression = useCallback(() => {
    trackLocalTradersSectionViewed(context, experts.length);
  }, [context, experts.length]);

  const ref = useImpressionTracking<HTMLDivElement>(onImpression);

  return (
    <div
      ref={ref}
      className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
    >
      {experts.map((expert) => (
        <div
          key={expert.placementId ?? expert.providerId}
          className="w-[82%] shrink-0 snap-start sm:w-auto sm:shrink"
        >
          <LocalExpertCard expert={expert} context={context} postcode={postcode} address={address} />
        </div>
      ))}
    </div>
  );
}
