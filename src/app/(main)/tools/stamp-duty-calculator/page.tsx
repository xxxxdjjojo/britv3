import type { Metadata } from "next";
import Link from "next/link";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator | Britestate",
  description:
    "Calculate your Stamp Duty Land Tax (SDLT) for residential property purchases in England and Northern Ireland. Supports first-time buyer relief and additional property surcharge.",
};

export default function StampDutyCalculatorPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Stamp Duty Calculator
        </h1>
        <p className="text-muted-foreground">
          Stamp Duty Land Tax (SDLT) is a tax you pay when buying residential
          property in England and Northern Ireland. The amount depends on the
          purchase price and whether you are a first-time buyer, home mover, or
          purchasing an additional property. Enter your property price below to
          see a full breakdown.
        </p>
      </div>

      <SdltCalculator />

      <div className="mt-8 text-center">
        <Link
          href="/tools/mortgage-calculator"
          className="text-primary text-sm underline-offset-4 hover:underline"
        >
          &larr; Calculate your mortgage payments
        </Link>
      </div>
    </div>
  );
}
