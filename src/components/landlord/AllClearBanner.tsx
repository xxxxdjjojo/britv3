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
    <div className="flex items-center gap-4 rounded-xl border border-success/30 bg-success-light p-5 dark:border-success/20 dark:bg-success/10">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success-light dark:bg-success/10">
        <CheckCircle2 className="size-6 text-success dark:text-success" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-success dark:text-success">
          Everything&apos;s on track
        </p>
        <p className="text-sm text-success dark:text-success">
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
