import { getLocalComparables } from "@/services/properties/ppd-comparables-service";
import { getRegionalAverage } from "@/services/areas/sold-prices-service";
import { PriceHistory } from "@/components/properties/PriceHistory";

type PriceHistoryChartProps = Readonly<{
  postcode: string;
  history: Array<{ date: string; price: number; event?: string }>;
  propertyType?: string;
  className?: string;
}>;

export async function PriceHistoryChart({
  postcode,
  history,
  propertyType,
  className,
}: PriceHistoryChartProps) {
  const outwardCode = postcode?.split(" ")[0] ?? "";

  const [comparables, regionalYearly] = await Promise.all([
    postcode ? getLocalComparables(postcode, propertyType) : null,
    outwardCode ? getRegionalAverage(outwardCode, propertyType) : [],
  ]);

  // Convert yearly averages to { date, price } entries matching history date format
  const regionalAverage = regionalYearly.map((r) => ({
    date: `${r.year}-01-01`,
    price: r.avgPrice,
  }));

  return (
    <PriceHistory
      history={history}
      comparables={comparables}
      regionalAverage={regionalAverage}
      className={className}
    />
  );
}
