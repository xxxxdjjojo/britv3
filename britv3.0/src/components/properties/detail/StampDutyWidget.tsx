import Link from "next/link";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";

export function StampDutyWidget(
  props: Readonly<{
    propertyPrice: number;
    isFirstTimeBuyer?: boolean;
    className?: string;
  }>,
) {
  return (
    <div className={props.className}>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold text-neutral-900">
            Stamp Duty (SDLT)
          </h3>
          <Link
            href="/tools/stamp-duty-calculator"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Full calculator &rarr;
          </Link>
        </div>
        <SdltCalculator
          initialPrice={props.propertyPrice}
          initialIsFirstTimeBuyer={props.isFirstTimeBuyer ?? false}
        />
      </div>
    </div>
  );
}
