import { CheckCircle2 } from "lucide-react";

type AllClearBannerProps = Readonly<{
  monthlyCashflow: number;
}>;

/**
 * Celebration banner shown when all rent is paid, compliance is green,
 * and no maintenance is open.
 */
export function AllClearBanner({ monthlyCashflow }: AllClearBannerProps) {
  const cashflowFormatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(monthlyCashflow);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/10">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-emerald-800 dark:text-emerald-300">
          Everything&apos;s on track
        </p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          All rent received, compliance up to date, no open maintenance.
          {monthlyCashflow > 0 && (
            <span className="ml-1 font-medium">
              Monthly cashflow: {cashflowFormatted}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
