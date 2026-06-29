import { getPostcodeCard } from "@/services/market-map/postcode-card-service";
import {
  assessValuePosition,
  bandForPropertyType,
  valueRatingLabel,
} from "@/lib/properties/price-position";

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

const RATING_STYLES: Record<string, string> = {
  good_value:
    "bg-success/10 text-success dark:bg-success/20 dark:text-success border-success/30",
  fair: "bg-muted text-muted-foreground border-border",
  above_market:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800",
};

/**
 * Block 05 (buy) — Price position. Compares this listing against the area
 * median for its property type (flat vs house) from the postcode-card
 * precompute, and shows a transparent value rating. Self-gates: renders nothing
 * for rentals or when there is no confident area median. Async (server-side
 * RPC) — wrap in Suspense.
 */
export async function PricePosition({
  price,
  postcode,
  propertyType,
  listingType,
}: {
  price: number;
  postcode: string;
  propertyType: string;
  listingType: "sale" | "rent";
}) {
  if (listingType !== "sale") return null;

  const card = await getPostcodeCard(postcode);
  if (!card.found) return null;

  const band = bandForPropertyType(propertyType);
  const series = card[band];
  if (series.insufficient || series.median == null) return null;

  const position = assessValuePosition(price, series.median);
  if (!position) return null;

  const areaLabel = series.areaName ?? card.location?.ladName ?? "the area";
  const bandLabel = band === "flat" ? "flats" : "houses";
  const max = Math.max(position.thisPrice, position.areaMedian);
  const thisWidth = Math.round((position.thisPrice / max) * 100);
  const areaWidth = Math.round((position.areaMedian / max) * 100);
  const deltaPctAbs = Math.abs(Math.round(position.deltaPct * 100));

  return (
    <div className="mb-6 rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">How the price compares</h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RATING_STYLES[position.rating]}`}
        >
          {valueRatingLabel(position.rating)}
        </span>
      </div>

      <div className="space-y-2.5">
        <Bar
          label="This property"
          value={gbp(position.thisPrice)}
          widthPct={thisWidth}
          strong
        />
        <Bar
          label={`${areaLabel} median (${bandLabel})`}
          value={gbp(position.areaMedian)}
          widthPct={areaWidth}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {deltaPctAbs === 0
          ? "In line with the area median."
          : `${deltaPctAbs}% ${position.deltaPct < 0 ? "below" : "above"} the area median for ${bandLabel}.`}{" "}
        Based on recent Land Registry sales ({series.count} transactions).
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  widthPct,
  strong = false,
}: {
  label: string;
  value: string;
  widthPct: number;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={strong ? "font-semibold text-primary" : "font-medium"}>
          {value}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${strong ? "bg-brand-primary" : "bg-brand-primary/40"}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
