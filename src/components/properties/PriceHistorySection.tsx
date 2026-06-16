import { getSoldPriceData } from "@/services/land-registry/land-registry";
import { extractPaon, toComparables } from "@/services/land-registry/convert";
import { PriceHistory } from "./PriceHistory";

type AskingPriceEntry = Readonly<{
  date: string;
  price: number;
  event?: string;
}>;

type PriceHistorySectionProps = Readonly<{
  history: AskingPriceEntry[];
  postcode: string;
  addressLine1: string;
  addressLine2: string | null;
}>;

export async function PriceHistorySection({
  history,
  postcode,
  addressLine1,
  addressLine2,
}: PriceHistorySectionProps) {
  const { exactHistory, areaSummary } = await getSoldPriceData({
    postcode,
    paon: extractPaon(addressLine1),
    saon: addressLine2,
  });

  return (
    <PriceHistory
      history={[...history]}
      comparables={toComparables(areaSummary.recentSales)}
      pastSales={toComparables(exactHistory)}
    />
  );
}

export function PriceHistorySectionSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-20 rounded-xl bg-muted animate-pulse" />
      <div className="h-10 rounded-lg bg-muted animate-pulse" />
      <div className="h-48 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}
