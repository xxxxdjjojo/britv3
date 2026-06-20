/**
 * FeasibilityBadge
 *
 * Small pill showing permitted-development feasibility. Presentational,
 * server component. Brand: green for permitted, amber for needs-planning,
 * grey for not-applicable (no blue/rainbow — public-page colour policy).
 */

import type { PdFeasibility } from "@/lib/properties/permitted-development-rules";

type Props = Readonly<{
  feasibility: PdFeasibility;
}>;

const badge: Record<PdFeasibility, { label: string; className: string }> = {
  likely_permitted: {
    label: "Likely permitted development",
    className: "bg-green-100 text-[#1B4D3E] border border-green-200",
  },
  needs_full_planning: {
    label: "Likely needs full planning",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  not_applicable: {
    label: "Not applicable",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

export function FeasibilityBadge({ feasibility }: Props) {
  const { label, className } = badge[feasibility];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
