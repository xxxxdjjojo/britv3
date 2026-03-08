import type { Metadata } from "next";
import Link from "next/link";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator | Britestate",
  description:
    "Calculate your monthly mortgage payments, total interest, and loan-to-value ratio. Save your parameters to see personalised estimates on property listings.",
};

export default function MortgageCalculatorPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Mortgage Calculator
        </h1>
        <p className="text-muted-foreground">
          Adjust the property price, deposit, interest rate, and term to see
          your estimated monthly payments in real time. Save your parameters to
          see personalised &ldquo;Est. X/mo&rdquo; figures on property listing
          cards.
        </p>
      </div>

      <MortgageCalculator />

      <div className="mt-8 text-center">
        <Link
          href="/tools/stamp-duty-calculator"
          className="text-primary text-sm underline-offset-4 hover:underline"
        >
          Calculate your Stamp Duty (SDLT) &rarr;
        </Link>
      </div>
    </div>
  );
}
