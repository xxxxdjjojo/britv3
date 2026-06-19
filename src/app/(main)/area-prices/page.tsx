/**
 * Area Prices — free, postcode-first sold-price lookup.
 * Route: /area-prices
 *
 * Server shell (metadata + heading); the interactive search + map live in the
 * AreaPricesExplorer client component.
 */

import type { Metadata } from "next";
import { AreaPricesExplorer } from "./AreaPricesExplorer";
import { brandConfig } from "@/config/brand";

export const metadata: Metadata = {
  title: `Area Prices — What Homes Sell For Near You | ${brandConfig.displayName}`,
  description:
    "Enter your postcode to see the typical (median) sold price for your area, split by flats and houses, from HM Land Registry data. Free, no sign-up.",
  alternates: { canonical: "/area-prices" },
};

export default function AreaPricesPage() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-brand-primary-lighter/20">
      <AreaPricesExplorer />
    </main>
  );
}
