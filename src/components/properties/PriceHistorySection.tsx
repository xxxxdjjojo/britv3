import { fetchLandRegistryComparables } from "@/services/properties/land-registry-service";
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

/**
 * Server component: renders the asking-price history alongside HM Land Registry
 * sold-price comparables for the property's postcode. Comparables come from the
 * cached, never-throwing `fetchLandRegistryComparables`, so the section degrades
 * to asking-price history alone when no Land Registry data is available.
 */
export async function PriceHistorySection({
  history,
  postcode,
}: PriceHistorySectionProps) {
  const comparables = await fetchLandRegistryComparables(postcode);

  return <PriceHistory history={[...history]} comparables={comparables} />;
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
