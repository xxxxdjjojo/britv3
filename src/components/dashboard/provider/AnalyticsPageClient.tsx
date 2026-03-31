"use client";

import { useRouter, usePathname } from "next/navigation";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { ConversionFunnel } from "./ConversionFunnel";
import type { EarningsByMonth, TopCategory } from "@/services/provider/provider-analytics-service";
import type { ConversionFunnel as ConversionFunnelType } from "@/types/provider-dashboard";

type Period = "7d" | "30d" | "90d";

type Props = Readonly<{
  period: Period;
  profileViewsTotal: number;
  enquiryRatePct: number;
  earningsByMonth: EarningsByMonth[];
  topCategories: TopCategory[];
  conversionByStage: ConversionFunnelType;
}>;

export function AnalyticsPageClient({
  period,
  profileViewsTotal,
  enquiryRatePct,
  earningsByMonth,
  topCategories,
  conversionByStage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handlePeriodChange(newPeriod: Period) {
    router.push(`${pathname}?period=${newPeriod}`);
  }

  return (
    <div className="space-y-8">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Profile Views
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-neutral-900 tabular-nums">
            {profileViewsTotal.toLocaleString("en-GB")}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Enquiry Rate
          </p>
          <p className="mt-2 font-heading text-3xl font-bold text-neutral-900 tabular-nums">
            {enquiryRatePct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts with period selector */}
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={topCategories}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      {/* Conversion Funnel */}
      <ConversionFunnel funnel={conversionByStage} />
    </div>
  );
}
