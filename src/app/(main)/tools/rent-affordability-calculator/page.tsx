import type { Metadata } from "next";
import { ModeTabs } from "./_components/ModeTabs";
import { CalculatorPageHeader } from "@/components/calculators/CalculatorPageHeader";

export const metadata: Metadata = {
  title: "Rent Affordability Calculator | TrueDeed",
  description:
    "Work out what rent you can comfortably afford, the income a rent needs, and how to split rent with roommates — with a budget breakdown and move-in cost estimate.",
  alternates: { canonical: "https://truedeed.co.uk/tools/rent-affordability-calculator" },
};

export default function RentAffordabilityCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 pt-12">
        <CalculatorPageHeader
          title="Rent affordability calculator"
          description="Plan your budget, find the income a rent needs, or split a tenancy with roommates — all in one place."
        />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <ModeTabs />
      </main>
    </div>
  );
}
