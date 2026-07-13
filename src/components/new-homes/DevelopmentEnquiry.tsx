import { LeadCtaGroup } from "./LeadCtaGroup";
import { DevelopmentStatusBadge } from "./AvailabilityBadge";
import {
  formatBedsRange,
  formatCompletion,
  formatPriceRange,
} from "@/lib/new-homes/format";
import type { DevelopmentDetail } from "@/lib/new-homes/types";

/** Sticky enquiry panel for the detail page right rail (desktop). */
export function EnquirySidebar({
  development,
}: Readonly<{ development: DevelopmentDetail }>) {
  const completion = formatCompletion(development.completionDate);
  return (
    <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <DevelopmentStatusBadge status={development.status} />
        {development.availableUnits != null ? (
          <span className="text-xs font-medium text-neutral-500">
            {development.availableUnits} available
          </span>
        ) : null}
      </div>
      <p className="font-heading text-2xl font-bold text-brand-primary">
        {formatPriceRange(development.priceMin, development.priceMax)}
      </p>
      <p className="mt-0.5 text-sm text-neutral-500">
        {formatBedsRange(development.bedsMin, development.bedsMax)} homes
        {completion ? ` · ${completion}` : ""}
      </p>

      <div className="mt-4">
        <LeadCtaGroup
          developmentId={development.id}
          developmentName={development.name}
          units={development.units}
          layout="stacked"
        />
      </div>
    </div>
  );
}

/** Fixed bottom enquiry bar for mobile (hidden on large screens). */
export function MobileEnquiryBar({
  development,
}: Readonly<{ development: DevelopmentDetail }>) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pb-safe border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-bold text-brand-primary">
            {formatPriceRange(development.priceMin, development.priceMax)}
          </p>
          <p className="truncate text-xs text-neutral-500">{development.name}</p>
        </div>
        <div className="shrink-0">
          <LeadCtaGroup
            developmentId={development.id}
            developmentName={development.name}
            units={development.units}
            layout="single"
          />
        </div>
      </div>
    </div>
  );
}
