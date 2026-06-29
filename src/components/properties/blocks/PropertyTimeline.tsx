import { Separator } from "@/components/ui/separator";
import { buildPropertyTimeline } from "@/lib/properties/property-timeline";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 08 (history) — Property timeline. A horizontal milestone strip built
 * from data already on the page (built year, sale / price events, listed date).
 * Self-gates: renders nothing when no milestones are known.
 */
export function PropertyTimeline({ view }: { view: PropertyView }) {
  const { listing, property } = view.detail;
  const events = buildPropertyTimeline({
    yearBuilt: property.yearBuilt,
    listedDate: listing.listedDate,
    priceHistory: view.priceHistoryFormatted,
  });

  if (events.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Property timeline</h2>
      <Separator className="mb-4" />
      <ol className="flex gap-4 overflow-x-auto pb-2">
        {events.map((e, i) => (
          <li
            key={`${e.label}-${e.date ?? e.year ?? i}`}
            className="relative min-w-[120px] flex-1 rounded-xl border bg-card p-3"
          >
            <span className="block text-xs font-semibold text-brand-primary">
              {e.year ?? "—"}
            </span>
            <span className="mt-0.5 block text-sm font-medium">{e.label}</span>
            {e.detail && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {e.detail}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
