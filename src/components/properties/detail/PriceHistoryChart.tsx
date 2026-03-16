import { fetchLandRegistryComparables } from "@/services/properties/land-registry-service";
import { PriceHistory } from "@/components/properties/PriceHistory";

type PriceHistoryChartProps = Readonly<{
  postcode: string;
  history: Array<{ date: string; price: number; event?: string }>;
  className?: string;
}>;

export async function PriceHistoryChart({
  postcode,
  history,
  className,
}: PriceHistoryChartProps) {
  const comparables = postcode
    ? await fetchLandRegistryComparables(postcode)
    : null;

  return (
    <PriceHistory
      history={history}
      comparables={comparables}
      className={className}
    />
  );
}
