import Link from "next/link";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";

export function MortgageCalculatorWidget(
  props: Readonly<{
    propertyPrice: number;
    className?: string;
  }>,
) {
  return (
    <div className={props.className}>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold text-neutral-900">
            Mortgage Calculator
          </h3>
          <Link
            href="/tools/mortgage-calculator"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Full calculator &rarr;
          </Link>
        </div>
        <MortgageCalculator initialPrice={props.propertyPrice} />
      </div>
    </div>
  );
}
