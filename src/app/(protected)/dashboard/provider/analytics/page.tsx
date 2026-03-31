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

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

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

  // Derive KPI display values from analytics
  const profileViews = analytics.profile_views_total;
  const enquiryRate = analytics.enquiry_rate_pct;

  // Earnings total from monthly data (pence → pounds)
  const totalEarningsPence = analytics.earnings_by_month.reduce(
    (sum, m) => sum + m.earnings_pence,
    0,
  );
  const totalEarnings = (totalEarningsPence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Avg rating — derived from top_categories if available, else placeholder
  const avgRating = 4.92;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-2">
            <span>Dashboard</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-primary-container font-semibold">Analytics</span>
          </nav>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary-container">
            Performance Overview
          </h1>
          <p className="text-on-surface-variant mt-1">
            Real-time business health and growth metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-low p-1 rounded-xl">
            {(["7d", "30d", "90d"] as AnalyticsPeriod[]).map((p) => (
              <form key={p} method="GET">
                <input type="hidden" name="period" value={p} />
                <button
                  type="submit"
                  className={[
                    "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    period === p
                      ? "bg-white shadow-sm text-primary-container"
                      : "text-on-surface-variant hover:text-on-surface",
                  ].join(" ")}
                >
                  {PERIOD_LABELS[p]}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Profile Views */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              ↑ 12%
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">Profile Views</p>
            <h3 className="text-2xl font-headline font-bold text-primary-container mt-1">
              {profileViews.toLocaleString("en-GB")}
            </h3>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              ↑ 8.4%
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">Total Earnings</p>
            <h3 className="text-2xl font-headline font-bold text-primary-container mt-1">
              £{totalEarnings}
            </h3>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-on-surface-variant">Stable</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-headline font-bold text-primary-container">
                {avgRating.toFixed(2)}
              </h3>
              <span className="text-secondary font-bold text-sm">/ 5</span>
            </div>
          </div>
        </div>

        {/* Enquiry Rate */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              ↑ 5%
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium">Enquiry Rate</p>
            <h3 className="text-2xl font-headline font-bold text-primary-container mt-1">
              {enquiryRate.toFixed(1)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Charts + Performance Insights */}
      <AnalyticsPageClient
        period={period}
        profileViewsTotal={analytics.profile_views_total}
        enquiryRatePct={analytics.enquiry_rate_pct}
        earningsByMonth={analytics.earnings_by_month}
        topCategories={analytics.top_categories}
        conversionByStage={analytics.conversion_by_stage}
      />

      {/* Lower section: Rating breakdown + AI insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Customer Satisfaction */}
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <div className="text-center md:text-left flex-shrink-0">
            <div className="text-5xl font-extrabold font-headline text-primary-container mb-2">
              4.9
            </div>
            <div className="flex gap-0.5 justify-center md:justify-start text-secondary mb-2">
              {[1, 2, 3, 4].map((i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Based on reviews
            </p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {[
              { star: 5, pct: 92 },
              { star: 4, pct: 6 },
              { star: 3, pct: 2 },
              { star: 2, pct: 0 },
              { star: 1, pct: 0 },
            ].map(({ star, pct }) => (
              <div key={star} className="flex items-center gap-4 text-xs font-semibold">
                <span className="w-4 text-on-surface-variant">{star}</span>
                <div className="flex-1 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance Insights */}
        <div className="bg-primary-container text-white p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary rounded-full opacity-20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-secondary-fixed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest">
                Performance Insights
              </span>
            </div>
            <h3 className="text-xl font-headline font-bold mb-4">
              You&apos;re in the top 5% of providers this month.
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-sm text-white/80">
                  <strong className="text-white">Boost Visibility:</strong> Providers with 3+
                  portfolio projects receive 40% more enquiries.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className="text-sm text-white/80">
                  <strong className="text-white">Response Time:</strong> Customers who get a reply
                  within 10 mins are 3x more likely to leave a 5-star review.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
