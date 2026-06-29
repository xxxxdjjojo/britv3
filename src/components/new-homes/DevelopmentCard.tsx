import Link from "next/link";
import { DevelopmentVisual } from "./DevelopmentVisual";
import { DevelopmentStatusBadge } from "./AvailabilityBadge";
import {
  formatBedsRange,
  formatCompletion,
  formatPriceRange,
  schemeTypeLabel,
} from "@/lib/new-homes/format";
import type { DevelopmentCard as DevelopmentCardModel } from "@/lib/new-homes/types";

function EligibilityChip({ label }: Readonly<{ label: string }>) {
  return (
    <span className="rounded-full bg-[#F5ECD7] px-2 py-0.5 text-[11px] font-semibold text-[#7B5804]">
      {label}
    </span>
  );
}

export function DevelopmentCard({
  development,
}: Readonly<{ development: DevelopmentCardModel }>) {
  const completion = formatCompletion(development.completionDate);
  const available = development.availableUnits;

  return (
    <Link
      href={`/new-homes/${development.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
    >
      <div className="relative">
        <DevelopmentVisual
          imageUrl={development.heroImageUrl}
          brandColour={development.developer.brandColour}
          name={development.name}
          className="aspect-[16/10] w-full"
        />
        <div className="absolute left-3 top-3">
          <DevelopmentStatusBadge status={development.status} />
        </div>
        {/* Developer brand chip */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: development.developer.brandColour ?? "#1B4D3E" }}
          />
          {development.developer.name}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-heading text-lg font-semibold leading-tight text-neutral-900 group-hover:text-[#1B4D3E]">
            {development.name}
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            {development.city}
            {development.region ? `, ${development.region}` : ""}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-base font-bold text-[#1B4D3E]">
            {formatPriceRange(development.priceMin, development.priceMax)}
          </span>
          <span className="text-sm text-neutral-600">
            {formatBedsRange(development.bedsMin, development.bedsMax)}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
            {schemeTypeLabel(development.schemeType)}
          </span>
          {completion ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
              {completion}
            </span>
          ) : null}
          {development.helpToBuy ? <EligibilityChip label="Help to Buy" /> : null}
          {development.firstHomes ? <EligibilityChip label="First Homes" /> : null}
        </div>

        {available != null && available > 0 ? (
          <p className="text-xs font-medium text-emerald-700">
            {available} {available === 1 ? "home" : "homes"} available
          </p>
        ) : development.status === "sold_out" ? (
          <p className="text-xs font-medium text-neutral-500">Fully reserved</p>
        ) : null}
      </div>
    </Link>
  );
}
