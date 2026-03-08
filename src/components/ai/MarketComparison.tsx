"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MarketPricingData = Readonly<{
  price_low: number;
  price_median: number;
  price_high: number;
  unit: string;
}>;

type MarketComparisonProps = Readonly<{
  serviceCategory: string;
  region: string;
}>;

export function MarketComparison({
  serviceCategory,
  region,
}: MarketComparisonProps) {
  const [pricing, setPricing] = useState<MarketPricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPricing() {
      try {
        const response = await fetch(
          `/api/market-pricing?category=${encodeURIComponent(serviceCategory)}&region=${encodeURIComponent(region)}`,
        );

        if (!response.ok) {
          setPricing(null);
          return;
        }

        const data = await response.json();
        if (!cancelled && data.pricing) {
          setPricing(data.pricing);
        }
      } catch {
        // Graceful degradation: hide component on error
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPricing();
    return () => {
      cancelled = true;
    };
  }, [serviceCategory, region]);

  if (isLoading || !pricing) {
    return null;
  }

  const unitLabel = pricing.unit === "per_hour" ? "/hr" : `/${pricing.unit}`;

  return (
    <Alert>
      <TrendingUp className="h-4 w-4" />
      <AlertDescription>
        Market Rate: GBP {pricing.price_low} - GBP {pricing.price_high}
        {unitLabel} (median: GBP {pricing.price_median})
      </AlertDescription>
    </Alert>
  );
}
