import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import { getProviderAnalytics } from "@/services/provider/provider-analytics-service";
import { AnalyticsPageClient } from "@/components/dashboard/provider/AnalyticsPageClient";

type AnalyticsPeriod = "7d" | "30d" | "90d";

const VALID_PERIODS = new Set<AnalyticsPeriod>(["7d", "30d", "90d"]);

function parsePeriod(value: string | undefined): AnalyticsPeriod {
  if (value && VALID_PERIODS.has(value as AnalyticsPeriod)) {
    return value as AnalyticsPeriod;
  }
  return "30d";
}

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ProviderAnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  let providerId: string;
  try {
    const identity = await resolveProviderId(supabase);
    providerId = identity.providerId;
  } catch {
    redirect("/dashboard/provider");
  }

  const resolvedSearchParams = await searchParams;
  const rawPeriod = resolvedSearchParams["period"];
  const period = parsePeriod(Array.isArray(rawPeriod) ? rawPeriod[0] : rawPeriod);

  const analytics = await getProviderAnalytics(supabase, providerId, period);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track your performance, earnings, and conversion metrics.
        </p>
      </div>

      <AnalyticsPageClient
        period={period}
        profileViewsTotal={analytics.profile_views_total}
        enquiryRatePct={analytics.enquiry_rate_pct}
        earningsByMonth={analytics.earnings_by_month}
        topCategories={analytics.top_categories}
        conversionByStage={analytics.conversion_by_stage}
      />
    </div>
  );
}
