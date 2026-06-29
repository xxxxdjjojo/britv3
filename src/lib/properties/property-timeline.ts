/**
 * Property timeline — pure builder. Assembles an ordered list of known
 * milestones (built → sale / price events → listed) from data already on the
 * page. Honest about gaps: it only emits events backed by real data.
 */

export type TimelineEvent = {
  /** Four-digit year for sorting / display; null only if entirely unknown. */
  year: number | null;
  /** ISO date when known (price events); null for year-only events (built). */
  date: string | null;
  label: string;
  detail?: string;
};

export type TimelineInput = {
  yearBuilt: number | null;
  listedDate: string | null;
  /** Oldest → newest, as produced by buildPropertyView.priceHistoryFormatted. */
  priceHistory: { date: string; price: number; event?: string }[];
};

function priceEventLabel(event: string | undefined): string {
  if (event === "Listed") return "Listed";
  if (event === "Reduced") return "Price reduced";
  return "Price change";
}

function gbp(price: number): string {
  return `£${price.toLocaleString("en-GB")}`;
}

function sortKey(e: TimelineEvent): number {
  if (e.date) return new Date(e.date).getTime();
  if (e.year != null) return new Date(`${e.year}-01-01`).getTime();
  return 0;
}

export function buildPropertyTimeline(input: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (input.yearBuilt && input.yearBuilt > 0) {
    events.push({ year: input.yearBuilt, date: null, label: "Built" });
  }

  for (const h of input.priceHistory) {
    const year = h.date ? Number(h.date.slice(0, 4)) : null;
    events.push({
      year: Number.isFinite(year) ? year : null,
      date: h.date || null,
      label: priceEventLabel(h.event),
      detail: gbp(h.price),
    });
  }

  // Fallback: if there is no price history at all, still anchor a "Listed" event.
  if (input.priceHistory.length === 0 && input.listedDate) {
    const year = Number(input.listedDate.slice(0, 4));
    events.push({
      year: Number.isFinite(year) ? year : null,
      date: input.listedDate,
      label: "Listed",
    });
  }

  return events.sort((a, b) => sortKey(a) - sortKey(b));
}
